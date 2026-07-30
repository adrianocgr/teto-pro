-- =========================================================
-- O percentual de participação deixou de ser obrigatório ao
-- vincular um investidor a um empreendimento — pode ser
-- preenchido depois. A constraint de faixa (0-100) continua
-- valendo quando um valor é informado (CHECK é satisfeita
-- automaticamente quando a coluna é nula).
-- =========================================================

alter table tb_participacao alter column pa_percentual drop not null;
