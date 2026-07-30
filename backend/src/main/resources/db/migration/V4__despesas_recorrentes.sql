-- =========================================================
-- Despesas recorrentes (água, luz, condomínio...) — um MODELO
-- por empreendimento, com rateio em PERCENTUAL (não valor fixo,
-- já que a conta varia todo mês). "Lançar" um modelo cria uma
-- despesa de verdade em tb_despesa, vinculada a ele e a uma
-- competência (mês de referência) — nunca duas vezes para o
-- mesmo mês (índice único parcial abaixo).
-- =========================================================

create table tb_despesa_recorrente (
    dr_id bigint generated always as identity primary key,
    tenant_id varchar(40) not null references tb_tenant(tn_id),
    dr_empreendimento_id bigint not null references tb_empreendimento(ep_id),
    dr_categoria_id bigint not null references tb_categoria(ct_id),
    dr_fornecedor_id bigint references tb_fornecedor(fo_id),
    dr_descricao varchar(255) not null,
    dr_observacao text,
    dr_valor_padrao numeric(14,2), -- sugestão de valor; opcional, a conta real varia todo mês
    dr_dia_vencimento smallint, -- só informativo, não gera cobrança nem lembrete
    dr_status varchar(20) not null default 'ATIVO',
    dr_ultima_competencia date, -- último mês (dia 1) já lançado a partir deste modelo
    dr_ultimo_valor numeric(14,2), -- valor do último lançamento, exibido na lista como referência
    dr_created_at timestamp not null default now(),
    constraint ck_dr_dia_vencimento check (dr_dia_vencimento is null or dr_dia_vencimento between 1 and 31)
);
create index ix_dr_tenant on tb_despesa_recorrente(tenant_id);
create index ix_dr_empreendimento on tb_despesa_recorrente(dr_empreendimento_id);

create table tb_pagador_recorrente (
    pr_id bigint generated always as identity primary key,
    pr_recorrencia_id bigint not null references tb_despesa_recorrente(dr_id) on delete cascade,
    pr_investidor_id bigint not null references tb_investidor(iv_id),
    pr_percentual numeric(5,2) not null,
    constraint uk_pr_recorrencia_investidor unique (pr_recorrencia_id, pr_investidor_id),
    constraint ck_pr_percentual check (pr_percentual > 0 and pr_percentual <= 100)
);
create index ix_pr_recorrencia on tb_pagador_recorrente(pr_recorrencia_id);

alter table tb_despesa add column de_recorrencia_id bigint references tb_despesa_recorrente(dr_id) on delete set null;
alter table tb_despesa add column de_competencia date;

-- Impede lançar a mesma recorrência duas vezes para o mesmo mês. Parcial
-- (só quando de_recorrencia_id não é nulo) porque despesas avulsas, sem
-- origem numa recorrência, não têm competência alguma.
create unique index uk_de_recorrencia_competencia on tb_despesa(de_recorrencia_id, de_competencia)
    where de_recorrencia_id is not null;
