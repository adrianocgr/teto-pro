alter table tb_despesa
    add column de_desconto numeric(14,2) not null default 0;

alter table tb_despesa
    add constraint ck_de_desconto check (de_desconto >= 0);
