-- =========================================================
-- Usuário administrador da plataforma — não pertence a nenhuma
-- empresa (não tem linha em tb_usuario_empresa; PLATAFORMA_ADMIN é
-- só uma realm role no Keycloak). O us_keycloak_id abaixo precisa
-- ser exatamente o mesmo id configurado para o usuário
-- "admin.plataforma" no realm do Keycloak (realm-tetopro-obra.json),
-- para que o vínculo entre o login e este registro funcione desde
-- o primeiro acesso.
-- =========================================================

insert into tb_usuario (us_nome, us_username, us_email, us_status, us_keycloak_id)
values (
    'Admin Plataforma',
    'admin.plataforma',
    'admin@tetoproobra.com.br',
    'ATIVO',
    'fc9ed64d-0e64-499c-b2e9-acd2f1ce0e19'
);
