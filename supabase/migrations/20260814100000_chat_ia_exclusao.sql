-- =============================================================================
-- Migration: Chat IA — permite ao admin excluir atendimentos pelo painel
-- =============================================================================
--
-- A policy "Admins podem gerenciar sessoes de chat" (for all) já existe desde
-- 20260814000000, mas policy e GRANT são camadas SEPARADAS no Postgres: a
-- migration anterior concedeu apenas `select` a `authenticated`, então um
-- DELETE do painel morria em "permission denied for table chat_sessoes" antes
-- mesmo de o RLS ser consultado.
--
-- Só o admin continua conseguindo apagar: o GRANT abre o verbo, o RLS decide a
-- linha, e `public.is_admin()` é quem responde.
--
-- chat_mensagens some junto por ON DELETE CASCADE. O grant abaixo não é o que
-- faz a cascata funcionar (ela roda com os privilégios do dono da tabela) — é
-- para o painel poder, no futuro, apagar mensagem avulsa sem nova migration.

grant delete on public.chat_sessoes to authenticated;
grant delete on public.chat_mensagens to authenticated;
