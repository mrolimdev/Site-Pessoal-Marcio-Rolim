-- =============================================================================
-- 0005 — Promoção do administrador
-- =============================================================================
-- O usuário é criado à mão no painel (Authentication > Users) e promovido aqui,
-- por UUID. Não existe rota de auto-promoção na aplicação: se existisse, seria
-- a rota de escalonamento de privilégio.
--
-- marcio.rolim@gmail.com
-- =============================================================================

insert into private.admins (user_id)
values ('0f7413b8-0dbb-4828-b77e-8cb001a4151d')
on conflict (user_id) do nothing;
