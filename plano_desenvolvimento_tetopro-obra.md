# Plano de Desenvolvimento — TetoPro Obra

**Stack:** Java 21 + Spring Boot 3 · React + TypeScript · PostgreSQL (dados relacionais) · MongoDB (auditoria + armazenamento de arquivos via GridFS) · Keycloak (autenticação/autorização)

---

## 1. Arquitetura geral

```
┌─────────────────┐        ┌──────────────────────────────┐
│   React (SPA)    │ ───▶  │  Spring Boot API (REST)        │
│  keycloak-js      │        │  - Controllers                │
└─────────────────┘        │  - Services                    │
        │                    │  - Repositories (Spring Data) │
        │ (login/token)       │  - Interceptor de Auditoria   │
        ▼                    └───────┬───────────┬──────────┘
┌─────────────────┐                  │           │
│    Keycloak       │                  ▼           ▼
│(Realm: tetopro-obra)│      ┌──────────────┐  ┌──────────────────────┐
└─────────────────┘        │  PostgreSQL   │  │       MongoDB          │
                             │ (dados core)  │  │ - db_auditoria         │
                             └──────────────┘  │ - db_arquivos (GridFS) │
                                                 └──────────────────────┘
```

Backend único (modular monolith) é suficiente para o escopo — não há necessidade de microsserviços aqui. Separar por pacotes de domínio dentro do mesmo projeto (`empreendimento`, `investidor`, `lancamento`, `venda`, `auditoria`, `arquivo`).

O MongoDB acumula dois papéis nesse sistema — auditoria e armazenamento binário de arquivos — mas mantidos em **databases lógicos separados** dentro do mesmo cluster (`tetopro_obra_auditoria` e `tetopro_obra_arquivos`), para não misturar coleções de propósitos diferentes nem competir por índices/collections do mesmo namespace.

---

## 2. Modelagem de dados — PostgreSQL

> **Multi-tenancy**: todas as entidades listadas abaixo (exceto `usuario_app`, que já carrega o vínculo via Keycloak) recebem uma coluna `tenant_id` (indexada, não nula). Ela é omitida nas listas abaixo por brevidade — o detalhamento da estratégia está na seção 3.

### Entidades principais

**`empreendimento`**
- id, nome, endereco, bairro, area_total, area_unidade, qtd_unidades, data_inicio, status (`EM_OBRA`, `A_VENDA`, `VENDIDO`)

**`investidor`**
- id, nome, cpf_cnpj, email, telefone

**`participacao`** (N:N entre empreendimento e investidor)
- id, empreendimento_id, investidor_id, percentual_participacao (nullable — pode ser calculado pelo total pago, conforme decisão de negócio), data_entrada

**`categoria_custo`**
- id, nome (Terreno, Material, Mão de obra, Impostos, Documentação, Pós-venda, Outros), ativa (boolean)

**`lancamento_custo`**
- id, empreendimento_id, categoria_id, descricao, valor, data, fornecedor, forma_pagamento, numero_parcela, total_parcelas, observacao
- relação **1:N com `arquivo`** — cada lançamento pode ter vários arquivos anexados (comprovante de pagamento, nota fiscal, catálogo do produto, etc.)
- relação **1:N com `lancamento_pagador`** — um lançamento pode ter mais de um investidor pagando (ver abaixo)

**`lancamento_pagador`** (N:N entre `lancamento_custo` e `investidor`, com valor)
- id, lancamento_custo_id, investidor_id, valor_pago
- **regra de validação**: `SUM(valor_pago)` de todos os `lancamento_pagador` de um mesmo lançamento deve ser igual a `lancamento_custo.valor` — validar no service antes de persistir (e reforçar com constraint/trigger no banco, se quiser blindar contra escrita direta)

**`arquivo`**
- id, lancamento_custo_id (FK), nome_original, tipo_mime, tamanho_bytes, tipo_documento (`COMPROVANTE_PAGAMENTO`, `NOTA_FISCAL`, `CATALOGO`, `OUTRO`), **`gridfs_file_id`** (referência ao `ObjectId` do arquivo no GridFS/MongoDB), data_upload, usuario_upload
- O binário do arquivo **não fica no Postgres** — só o metadado e a referência. O conteúdo real vive no GridFS (ver seção 5)

**`venda`**
- id, empreendimento_id, data_venda, valor_venda, comprador, comissao_corretor, custos_venda_adicionais (itbi, cartório etc. — pode ser tabela `custo_venda` separada, reaproveitando `categoria_custo`)

**`usuario_app`** (espelha o usuário do Keycloak, para vínculos internos)
- id, keycloak_id (sub), nome, email, papel (`ADMIN`, `GESTOR`, `INVESTIDOR_VIEWER`)

### Diagrama relacional simplificado

```
empreendimento 1───N participacao N───1 investidor
empreendimento 1───N lancamento_custo N───1 categoria_custo
lancamento_custo 1───N lancamento_pagador N───1 investidor
lancamento_custo 1───N arquivo
empreendimento 1───1 venda
```

---

## 3. Multi-tenancy (SaaS multi-cliente)

Estratégia escolhida: **schema único compartilhado + coluna `tenant_id`**, priorizando simplicidade e custo (adequado para muitos tenants). Isolamento lógico, não físico.

### 3.1. Identificação do tenant

- **Keycloak com realm único** (`tetopro-obra`) — sem replicar client/configuração por cliente
- `tenant_id` (ou `organization_id`) como **atributo customizado do usuário**, exposto como claim no JWT via *Protocol Mapper*
- Avaliar o recurso **Keycloak Organizations** (v25+): abstração pronta para SaaS multi-tenant — cada organização é um tenant, com convite de membros, domínios de e-mail associados e isolamento de grupos/roles por organização. Evita reimplementar essa camada manualmente.

### 3.2. Resolução do tenant no backend

- Filtro/interceptor HTTP (`OncePerRequestFilter`) executado logo após a autenticação: extrai o claim `tenant_id` do JWT e popula um **`TenantContext`** (`ThreadLocal` ou `RequestScope` bean)
- O `TenantContext` é a fonte única de verdade para "qual tenant é esse request" durante todo o ciclo da requisição

### 3.3. Isolamento no PostgreSQL — Hibernate Filter

- Toda entidade multi-tenant (`Empreendimento`, `Investidor`, `Participacao`, `LancamentoCusto`, `LancamentoPagador`, `Venda`, `Arquivo`, `CategoriaCusto` quando customizada por tenant) recebe a coluna `tenant_id` (não nulo, indexado)
- `@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))` na entidade base, com `@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")`
- Um `Interceptor`/`OpenSessionInViewFilter` customizado habilita o filtro em toda `Session` no início da requisição, usando o valor do `TenantContext`:
  ```java
  session.enableFilter("tenantFilter").setParameter("tenantId", tenantContext.getTenantId());
  ```
- **Importante**: isso cobre `SELECT`, mas `INSERT` precisa preencher `tenant_id` automaticamente — usar um `@PrePersist` genérico (ou o mesmo Entity Listener de auditoria) que injeta o `tenant_id` do contexto atual antes de gravar
- Índice composto `(tenant_id, id)` e `(tenant_id, data)` nas tabelas mais consultadas, principalmente `lancamento_custo`

### 3.4. Isolamento no MongoDB (auditoria)

- Todo documento de auditoria ganha o campo `tenantId`
- Índice composto `{ tenantId: 1, entidade: 1, timestamp: -1 }`
- Toda query de consulta de auditoria passa `tenantId` obrigatoriamente (nunca opcional)

### 3.5. Isolamento no armazenamento de arquivos (GridFS)

- Todo arquivo gravado no GridFS carrega `tenant_id` nos **metadados** do documento (`fs.files.metadata.tenantId`)
- Índice em `metadata.tenantId` (junto com `metadata.lancamentoCustoId`) na coleção `.files`, para listagem e validação de acesso eficientes
- Toda consulta/download de arquivo no backend valida `tenant_id` do metadado contra o `TenantContext` antes de liberar o stream — nunca confiar apenas no ID do arquivo

### 3.6. Cuidados específicos

- **Nunca confiar em `tenant_id` vindo do corpo da requisição do frontend** — sempre derivar do JWT/`TenantContext` no backend, nunca aceitar como parâmetro editável pelo cliente
- Testes automatizados devem cobrir especificamente "vazamento" entre tenants (ex: tentar acessar um `lancamento_custo` de outro tenant via ID direto deve retornar 404, não 403 — para não revelar que o registro existe)
- Migrations (Flyway/Liquibase) continuam únicas para o schema compartilhado — não há necessidade de rodar por tenant, o que simplifica bastante o deploy

---

## 4. Auditoria com MongoDB via interceptor do Spring Data JPA

Objetivo: toda alteração relevante (criação, edição, exclusão) em `lancamento_custo`, `venda`, `participacao` etc. deve ir para uma coleção no MongoDB, sem poluir o schema relacional.

### Abordagem recomendada

Usar **`AbstractMongoEventListener`** não se aplica aqui (é para o próprio Mongo). Para capturar eventos do JPA, os dois caminhos possíveis:

1. **Spring Data JPA Auditing + Entity Listener customizado** (mais simples, recomendado)
   - Anotar entidades auditáveis com um listener customizado usando `@EntityListeners(AuditListener.class)`
   - O listener implementa `@PrePersist`, `@PreUpdate`, `@PreRemove` e publica um evento de domínio (`ApplicationEventPublisher`)
   - Um `@Async @EventListener` consome esse evento e grava o documento no MongoDB — assim a gravação no Mongo não trava a transação principal no Postgres

2. **Hibernate Interceptor / `EmptyInterceptor`** (mais baixo nível, captura até SQL bruto)
   - Implementar `org.hibernate.Interceptor` (`onFlushDirty`, `onSave`, `onDelete`) e registrar via `SessionFactory`
   - Mais granular (acesso aos valores antigo/novo campo a campo), mas mais acoplado ao Hibernate

**Recomendação:** opção 1 (Entity Listener + evento assíncrono) — mais idiomático em Spring Boot, mais fácil de manter, e desacopla a gravação de auditoria da transação de negócio.

### Modelo do documento de auditoria (MongoDB)

```json
{
  "_id": "ObjectId",
  "entidade": "lancamento_custo",
  "entidadeId": 123,
  "operacao": "UPDATE",
  "usuario": "joao@empresa.com",
  "timestamp": "2026-07-29T14:32:00Z",
  "camposAlterados": {
    "valor": { "de": 1500.00, "para": 1800.00 },
    "descricao": { "de": "Cimento", "para": "Cimento Itaú" }
  },
  "empreendimentoId": 5,
  "ip": "200.100.10.5"
}
```

### Captura do usuário logado

Usar `AuditorAware<String>` do Spring Data JPA, alimentado pelo `SecurityContextHolder` (que por sua vez recebe o principal resolvido pelo token JWT do Keycloak). Isso já preenche automaticamente `createdBy`/`lastModifiedBy` nas entidades Postgres, e o mesmo `AuditorAware` é reaproveitado no listener para gravar `usuario` no Mongo.

### Entidades a auditar
- `lancamento_custo` (toda edição/exclusão de custo é sensível — é dinheiro)
- `lancamento_pagador` (quem pagou o quê — tão sensível quanto o valor do lançamento em si)
- `venda`
- `participacao`
- Exclusões em geral (mesmo de outras entidades) — recomendo sempre auditar `DELETE`, independente da entidade

> O mesmo Entity Listener responsável pela auditoria é o ponto natural para também injetar automaticamente o `tenant_id` do `TenantContext` em toda entidade nova (ver seção 3.3) — evita duplicar essa lógica em dois listeners separados.

---

## 5. Armazenamento de arquivos — MongoDB GridFS

Infraestrutura própria, sem dependência de S3/MinIO. Os binários (PDFs de nota fiscal, fotos de comprovante, catálogos) ficam no **MongoDB via GridFS**, em uma coleção dedicada só deste sistema.

### 5.1. Por que GridFS

- Documentos MongoDB têm limite de 16MB — inviável para PDFs/imagens diretamente num documento normal
- GridFS quebra o arquivo em *chunks* (padrão 255KB) distribuídos em duas coleções internas, e resolve isso de forma transparente via driver
- Evita manter um serviço de storage adicional (MinIO) — tudo roda na infra que você já vai operar (Mongo)

### 5.2. Bucket dedicado

Em vez do bucket padrão do GridFS (`fs.files` / `fs.chunks`), usar um **bucket nomeado** exclusivo do sistema, para não colidir com nada e deixar claro no próprio nome da coleção a que sistema pertence:

```java
GridFSBucket bucket = GridFSBuckets.create(mongoDatabase, "tetoproobra_arquivos");
// gera as coleções:
//   tetoproobra_arquivos.files
//   tetoproobra_arquivos.chunks
```

Configuração via `GridFsTemplate` do Spring Data MongoDB (já incluso em `spring-boot-starter-data-mongodb`, não precisa de dependência extra), apontando para esse bucket customizado.

### 5.3. Metadados armazenados em cada arquivo (`fs.files.metadata`)

```json
{
  "tenantId": "abc-123",
  "empreendimentoId": 5,
  "lancamentoCustoId": 341,
  "tipoDocumento": "NOTA_FISCAL",
  "usuarioUpload": "joao@empresa.com",
  "nomeOriginal": "nf-cimento-itau-4521.pdf"
}
```

### 5.4. Relação N arquivos por lançamento

- Endpoint de upload aceita múltiplos arquivos por request (`multipart/form-data` com vários campos `arquivos`) ou uploads sequenciais — ambos gravam um documento GridFS por arquivo, cada um com seu `tipo_documento`
- A tabela `arquivo` no Postgres guarda o metadado relacional (FK para `lancamento_custo`, tipo, nome) + o `gridfs_file_id`; o binário em si nunca passa pelo Postgres
- Isso mantém o Postgres leve (só metadado) e centraliza o conteúdo pesado no Mongo, que é otimizado para isso via streaming

### 5.5. Fluxo de upload/download

- **Upload**: front envia multipart → backend valida tipo/tamanho (PDF, JPG, PNG, máx. configurável, ex. 15MB por arquivo) → grava no GridFS via `GridFsTemplate.store(inputStream, filename, contentType, metadata)` → persiste o metadado + `gridfs_file_id` na tabela `arquivo`
- **Download**: backend busca o `gridfs_file_id` associado, valida `tenant_id`, e faz streaming do conteúdo (`GridFsTemplate.getResource(...)`) direto na resposta HTTP — sem expor nada publicamente, sempre passando pelo backend autenticado
- **Exclusão**: ao excluir um `lancamento_custo` (ou um arquivo isolado), remover também o documento correspondente no GridFS (`bucket.delete(objectId)`) — cuidado para não deixar arquivo órfão
- Antivírus/validação de conteúdo é opcional para uma v1, mas vale considerar (ex: ClamAV) se o volume de usuários crescer

---

## 6. Autenticação e autorização — Keycloak

- **Realm** dedicado (`tetopro-obra`)
- **Clients**: um client público para o React (`tetopro-obra-frontend`, fluxo Authorization Code + PKCE) e um client confidential para o backend, se necessário
- **Roles** sugeridas:
  - `ADMIN` — acesso total, gerencia empreendimentos, investidores, usuários
  - `GESTOR` — lança custos, registra vendas, não gerencia usuários
  - `INVESTIDOR_VIEWER` — acesso somente leitura, vê apenas seus próprios empreendimentos/extratos
- Backend valida o JWT via `spring-boot-starter-oauth2-resource-server`, mapeando roles do token para `@PreAuthorize` nos controllers/services
- Front usa `keycloak-js` (ou `react-oidc-context`) para login, refresh de token e proteção de rotas

---

## 7. Design da API REST (principais endpoints)

```
POST   /api/empreendimentos
GET    /api/empreendimentos
GET    /api/empreendimentos/{id}/resumo        -> totais, saldo, gráfico por categoria

POST   /api/empreendimentos/{id}/investidores
GET    /api/empreendimentos/{id}/investidores

POST   /api/lancamentos                          -> body inclui lista de pagadores: [{investidorId, valorPago}, ...]
GET    /api/lancamentos?empreendimentoId=&categoriaId=&investidorId=&de=&ate=
PUT    /api/lancamentos/{id}
DELETE /api/lancamentos/{id}
GET    /api/lancamentos/{id}/pagadores            -> lista o rateio de pagadores daquele lançamento

POST   /api/lancamentos/{id}/arquivos           -> upload multipart (aceita N arquivos por request)
GET    /api/lancamentos/{id}/arquivos           -> lista arquivos do lançamento
GET    /api/arquivos/{id}/download              -> streaming direto do GridFS (backend autenticado)
DELETE /api/arquivos/{id}                       -> remove metadado (Postgres) + conteúdo (GridFS)

POST   /api/empreendimentos/{id}/venda
GET    /api/empreendimentos/{id}/fechamento     -> lucro, rateio por investidor

GET    /api/investidores/{id}/extrato

GET    /api/auditoria?entidade=&entidadeId=      -> ADMIN only
```

---

## 8. Frontend (React + TypeScript)

**Estrutura sugerida:**
```
src/
  auth/            (config keycloak-js, contexto de autenticação)
  api/             (clientes HTTP, um por domínio: empreendimentoApi, lancamentoApi...)
  pages/
    Empreendimentos/
    Lancamentos/
    Investidores/
    Fechamento/
  components/      (tabelas, formulários, cards de resumo)
  hooks/
  types/
```

- **Gestão de estado servidor**: React Query (TanStack Query) — encaixa bem com APIs REST, cache e invalidação automática após mutações
- **Formulários**: React Hook Form + validação (Zod)
- **Gráficos**: Recharts (gasto por categoria, evolução mensal) — já disponível no ecossistema React
- **Tabelas**: TanStack Table para listagens de lançamentos com filtro/ordenação

---

## 9. Fases de desenvolvimento

### Fase 0 — Setup de infraestrutura
- Docker Compose: Postgres, MongoDB, Keycloak (+ realm pré-configurado via import, já com Protocol Mapper de `tenant_id`)
- Esqueleto do projeto Spring Boot (módulos, configuração de segurança básica)
- `TenantContext` + filtro de resolução de tenant + Hibernate Filter configurado desde o início (é muito mais barato nascer com isso do que retrofitar depois)
- Esqueleto do projeto React com autenticação Keycloak funcionando

### Fase 1 — Núcleo (MVP)
- CRUD de Empreendimento, Investidor, Participação
- CRUD de Lançamento de Custo (sem upload ainda)
- Listagem/filtro de lançamentos
- Tela de resumo: total investido x total gasto

### Fase 2 — Auditoria e arquivos
- Interceptor/Entity Listener de auditoria gravando no MongoDB
- Tela de histórico de auditoria (admin)
- Upload/download de múltiplos arquivos por lançamento via GridFS (bucket `tetoproobra_arquivos`)

### Fase 3 — Fechamento financeiro
- Registro de venda
- Cálculo de lucro e rateio entre investidores
- Extrato individual por investidor (tela + exportação PDF)

### Fase 4 — Refinamento
- Gráficos (curva ABC, evolução mensal, gasto por categoria)
- Exportação de relatórios (PDF/Excel)
- Papéis de acesso refinados (investidor só vê o que é dele)
- Deploy em produção (ambiente próprio/cloud, Postgres/Mongo com backup e monitoramento — sem dependência de storage externo)

---

## 10. Stack de dependências (resumo)

**Backend (`pom.xml`)**
- `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-data-mongodb` (já traz `GridFsTemplate`, sem dependência extra para GridFS), `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-validation`
- `postgresql` driver
- `mapstruct` (DTO mapping), `lombok`

**Frontend**
- `react`, `typescript`, `keycloak-js`, `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, `recharts`, `axios`

**Infra local**
- `docker-compose.yml` com Postgres, MongoDB, Keycloak (sem MinIO/S3 — arquivos ficam no próprio MongoDB)

---

## 11. Pontos de atenção específicos ao seu caso (com base na planilha atual)

- Na planilha, cada investidor paga diretamente seus próprios custos (não é caixa único rateado) — às vezes até dividindo uma mesma nota entre dois investidores. O modelo `lancamento_pagador` (N:N entre lançamento e investidor, com valor) reflete exatamente isso, inclusive o caso de um único lançamento ser pago por mais de um investidor.
- A consolidação anual por investidor (aba `DIVISÃO_IMPOSTO`) deve virar uma **query agregada** join `lancamento_pagador` (`SUM(valor_pago) GROUP BY investidor, YEAR(data)`), eliminando o recálculo manual.
- Gastos pós-venda (aba `tintas`) devem continuar linkados ao empreendimento mesmo depois de `VENDIDO` — não travar lançamentos após a venda, só sinalizar visualmente.
- A aba de fornecedor específico (vidros) mostra que vale ter campo de parcelamento (`numero_parcela`/`total_parcelas`) e "forma de pagamento" no lançamento.

---

Quer que eu comece já gerando o esqueleto do projeto (estrutura de pastas, `pom.xml`, `docker-compose.yml`, entidades JPA iniciais)?
