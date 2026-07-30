-- =========================================================
-- V4 criou dr_dia_vencimento como smallint, mas a entidade Java
-- usa Integer (mapeia para "integer" no Postgres) — Hibernate
-- recusa subir com esse descompasso de tipo na validação de schema.
-- =========================================================

alter table tb_despesa_recorrente alter column dr_dia_vencimento type integer;
