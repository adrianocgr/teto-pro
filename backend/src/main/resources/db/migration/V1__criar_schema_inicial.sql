-- =========================================================
-- TetoPro Obra — schema inicial
-- Convenção: cada tabela tem um prefixo de 2-3 letras aplicado
-- a todas as suas colunas (mesmo padrão usado no backend de
-- referência imob360-api), exceto a coluna de isolamento
-- multi-tenant, que é sempre "tenant_id" em todas as tabelas
-- que a possuem — nome fixo mapeado por @TenantId (multi-tenancy
-- nativa do Hibernate 6) na superclasse EntidadeComTenant.
--
-- "Cadastro global" (categoria, unidade de medida, classificação,
-- insumo, fornecedor) significa global para os EMPREENDIMENTOS
-- de uma mesma empresa (tenant) — reaproveitado entre eles — e
-- NÃO global entre tenants diferentes: cada empresa tem o seu
-- próprio catálogo, isolado das demais.
-- Only tb_estado/tb_cidade são de fato globais entre tenants,
-- por serem dado geográfico de referência, não de negócio.
-- =========================================================

-- ---------- Empresa (tenant) ----------
create table tb_tenant (
    tn_id varchar(40) primary key,
    tn_nome varchar(255) not null,
    tn_status varchar(20) not null default 'ATIVO'
);

-- ---------- Usuário (identidade global de login, espelho do Keycloak) ----------
-- Deixou de ter tenant_id/papel próprios: uma mesma pessoa pode estar
-- vinculada a mais de uma empresa (ver tb_usuario_empresa, logo abaixo do
-- bloco de tb_investidor), cada vínculo com o seu próprio papel. O único
-- papel que não passa por tb_usuario_empresa é PLATAFORMA_ADMIN — não
-- pertence a empresa alguma, é apenas uma realm role no Keycloak.
create table tb_usuario (
    us_id bigint generated always as identity primary key,
    us_nome varchar(255) not null,
    us_username varchar(60) not null,
    us_email varchar(255) not null,
    us_status varchar(20) not null default 'ATIVO',
    us_keycloak_id varchar(64),
    us_created_at timestamp not null default now(),
    us_updated_at timestamp not null default now(),
    constraint uk_us_username unique (us_username),
    constraint uk_us_email unique (us_email),
    constraint uk_us_keycloak_id unique (us_keycloak_id)
);

-- ---------- Categoria (equivalente ao Centro de Custo) — catálogo da empresa ----------
create table tb_categoria (
    ct_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    ct_codigo varchar(20) not null,
    ct_descricao varchar(255) not null,
    ct_pai_id bigint references tb_categoria(ct_id),
    ct_status varchar(20) not null default 'ATIVO',
    constraint uk_ct_codigo unique (tenant_id, ct_codigo)
);
create index ix_ct_tenant on tb_categoria(tenant_id);

-- ---------- Unidade de medida — catálogo da empresa ----------
create table tb_unidade_medida (
    um_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    um_sigla varchar(10) not null,
    um_descricao varchar(120) not null,
    constraint uk_um_sigla unique (tenant_id, um_sigla)
);
create index ix_um_tenant on tb_unidade_medida(tenant_id);

-- ---------- Classificação de insumo — catálogo da empresa ----------
create table tb_classificacao (
    cl_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    cl_descricao varchar(255) not null,
    cl_status varchar(20) not null default 'ATIVO'
);
create index ix_cl_tenant on tb_classificacao(tenant_id);

-- ---------- Insumo — catálogo da empresa ----------
create table tb_insumo (
    in_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    in_codigo varchar(50) not null,
    in_descricao varchar(500) not null,
    in_unidade_medida_id bigint not null references tb_unidade_medida(um_id),
    in_classificacao_id bigint not null references tb_classificacao(cl_id),
    in_preco_referencia numeric(14,4) not null default 0,
    constraint uk_in_codigo unique (tenant_id, in_codigo)
);
create index ix_in_tenant on tb_insumo(tenant_id);

-- ---------- Estado / Cidade — cadastro GLOBAL (dado geográfico, entre tenants) ----------
create table tb_estado (
    es_id bigint generated always as identity primary key,
    es_nome varchar(255) not null,
    es_sigla varchar(2) not null,
    constraint uk_es_sigla unique (es_sigla)
);

create table tb_cidade (
    ci_id bigint generated always as identity primary key,
    ci_nome varchar(255) not null,
    ci_estado_id bigint not null references tb_estado(es_id)
);
create index ix_ci_estado on tb_cidade(ci_estado_id);

-- ---------- Fornecedor — catálogo da empresa ----------
create table tb_fornecedor (
    fo_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    fo_razao_social varchar(255) not null,
    fo_cnpj_cpf varchar(20) not null,
    fo_email varchar(255),
    fo_telefone varchar(30),
    fo_logradouro varchar(255),
    fo_numero varchar(30),
    fo_complemento varchar(120),
    fo_bairro varchar(120),
    fo_cep varchar(15),
    fo_cidade_id bigint references tb_cidade(ci_id),
    fo_status varchar(20) not null default 'ATIVO',
    constraint uk_fo_cnpj_cpf unique (tenant_id, fo_cnpj_cpf)
);
create index ix_fo_tenant on tb_fornecedor(tenant_id);

create table tb_representante (
    rp_id bigint generated always as identity primary key,
    rp_fornecedor_id bigint not null references tb_fornecedor(fo_id) on delete cascade,
    rp_nome varchar(255) not null,
    rp_email varchar(255),
    rp_telefone varchar(30)
);
create index ix_rp_fornecedor on tb_representante(rp_fornecedor_id);

-- ---------- Investidor — por tenant ----------
create table tb_investidor (
    iv_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    iv_nome varchar(255) not null,
    iv_cpf_cnpj varchar(20) not null,
    iv_tipo_pessoa varchar(20) not null, -- FISICA | JURIDICA
    iv_email varchar(255),
    iv_telefone varchar(30),
    iv_observacoes text,
    constraint uk_iv_cpf_cnpj unique (tenant_id, iv_cpf_cnpj)
);
create index ix_iv_tenant on tb_investidor(tenant_id);

-- ---------- Vínculo de usuário com empresa (N:N Usuario x Empresa) ----------
-- Uma pessoa (tb_usuario) pode estar vinculada a mais de uma empresa, cada
-- vínculo com seu próprio papel/status/investidor — por isso papel e
-- investidor não vivem mais em tb_usuario. Ao contrário das demais tabelas
-- "por tenant" deste schema, esta NÃO usa @TenantId (Hibernate só resolve
-- UM tenant por sessão, e listar/selecionar as empresas de um usuário
-- precisa enxergar todas de uma vez) — o isolamento por empresa aqui é
-- feito explicitamente em código (ver VinculoUsuarioEmpresaRepository).
create table tb_usuario_empresa (
    ue_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    ue_usuario_id bigint not null references tb_usuario(us_id) on delete cascade,
    ue_papel varchar(30) not null, -- ADMIN | GESTOR | INVESTIDOR_VISUALIZADOR
    ue_status varchar(20) not null default 'ATIVO',
    ue_investidor_id bigint references tb_investidor(iv_id), -- preenchido quando ue_papel = INVESTIDOR_VISUALIZADOR
    ue_created_at timestamp not null default now(),
    constraint uk_ue_usuario_empresa unique (ue_usuario_id, tenant_id)
);
create index ix_ue_tenant on tb_usuario_empresa(tenant_id);
create index ix_ue_usuario on tb_usuario_empresa(ue_usuario_id);

-- ---------- Empreendimento — por tenant ----------
create table tb_empreendimento (
    ep_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    ep_descricao varchar(255) not null,
    ep_inscricao_municipal varchar(50),
    ep_matricula varchar(50),
    ep_endereco varchar(255),
    ep_numero varchar(20),
    ep_quadra varchar(50),
    ep_lote varchar(50),
    ep_complemento varchar(100)
);
create index ix_ep_tenant on tb_empreendimento(tenant_id);

-- ---------- Participação (N:N Empreendimento x Investidor, com percentual) ----------
create table tb_participacao (
    pa_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    pa_empreendimento_id bigint not null references tb_empreendimento(ep_id) on delete cascade,
    pa_investidor_id bigint not null references tb_investidor(iv_id),
    pa_percentual numeric(5,2) not null,
    pa_data_entrada date not null default current_date,
    constraint uk_pa_emp_inv unique (pa_empreendimento_id, pa_investidor_id),
    constraint ck_pa_percentual check (pa_percentual >= 0 and pa_percentual <= 100)
);
create index ix_pa_tenant on tb_participacao(tenant_id);
create index ix_pa_investidor on tb_participacao(pa_investidor_id);

-- ---------- Despesa do empreendimento — por tenant ----------
create table tb_despesa (
    de_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    de_empreendimento_id bigint not null references tb_empreendimento(ep_id),
    de_categoria_id bigint not null references tb_categoria(ct_id),
    de_fornecedor_id bigint references tb_fornecedor(fo_id),
    de_descricao varchar(255) not null,
    de_observacao text,
    de_valor_total numeric(14,2) not null,
    de_data_cadastro date not null default current_date,
    de_data_alteracao date,
    de_usuario_cadastro_id bigint not null references tb_usuario(us_id),
    de_usuario_alteracao_id bigint references tb_usuario(us_id),
    constraint ck_de_valor_total check (de_valor_total >= 0)
);
create index ix_de_tenant on tb_despesa(tenant_id);
create index ix_de_tenant_data on tb_despesa(tenant_id, de_data_cadastro);
create index ix_de_empreendimento on tb_despesa(de_empreendimento_id);
create index ix_de_categoria on tb_despesa(de_categoria_id);

-- ---------- Item da despesa (insumo x quantidade x valor unitário) ----------
create table tb_item_despesa (
    ie_id bigint generated always as identity primary key,
    ie_despesa_id bigint not null references tb_despesa(de_id) on delete cascade,
    ie_insumo_id bigint not null references tb_insumo(in_id),
    ie_quantidade numeric(14,4) not null,
    ie_valor_unitario numeric(14,4) not null,
    ie_valor_total numeric(14,2) not null,
    ie_observacao varchar(500)
);
create index ix_ie_despesa on tb_item_despesa(ie_despesa_id);

-- ---------- Pagador da despesa (rateio N:N entre despesa e investidor) ----------
create table tb_pagador_despesa (
    pg_id bigint generated always as identity primary key,
    pg_despesa_id bigint not null references tb_despesa(de_id) on delete cascade,
    pg_investidor_id bigint not null references tb_investidor(iv_id),
    pg_valor numeric(14,2) not null,
    constraint uk_pg_despesa_investidor unique (pg_despesa_id, pg_investidor_id),
    constraint ck_pg_valor check (pg_valor >= 0)
);
create index ix_pg_despesa on tb_pagador_despesa(pg_despesa_id);
create index ix_pg_investidor on tb_pagador_despesa(pg_investidor_id);

-- ---------- Documento anexado à despesa (metadado; binário fica no GridFS/MongoDB) ----------
create table tb_despesa_documento (
    dd_id bigint generated always as identity primary key,
    dd_despesa_id bigint not null references tb_despesa(de_id) on delete cascade,
    dd_file_id varchar(24) not null,
    dd_filename varchar(255) not null,
    dd_content_type varchar(150),
    dd_length bigint not null,
    dd_uploaded_at timestamp not null default now(),
    dd_tags jsonb,
    constraint uk_dd_despesa_file unique (dd_despesa_id, dd_file_id)
);
create index ix_dd_despesa on tb_despesa_documento(dd_despesa_id);

-- ---------- Venda / fechamento do empreendimento ----------
create table tb_venda (
    vd_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    vd_empreendimento_id bigint not null references tb_empreendimento(ep_id),
    vd_data_venda date not null,
    vd_valor_venda numeric(14,2) not null,
    vd_comprador varchar(255) not null,
    vd_comissao_corretor numeric(14,2) not null default 0,
    vd_custos_venda_adicionais numeric(14,2) not null default 0,
    constraint uk_vd_empreendimento unique (vd_empreendimento_id)
);
create index ix_vd_tenant on tb_venda(tenant_id);
