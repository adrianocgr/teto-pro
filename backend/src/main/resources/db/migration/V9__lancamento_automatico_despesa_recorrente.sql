-- =========================================================
-- Lançamento automático de despesas recorrentes: cada modelo pode
-- optar por ter sua despesa do mês criada sozinha por um job noturno
-- (ver LancamentoAutomaticoDespesaRecorrenteJob), em vez de exigir que
-- alguém clique em "Lançar" manualmente. Desligado por padrão.
-- =========================================================

alter table tb_despesa_recorrente
    add column dr_lancamento_automatico boolean not null default false;
