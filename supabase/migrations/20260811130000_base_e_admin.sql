-- =============================================================================
-- 0001 — Base, schema privado e identificação do admin
-- =============================================================================
-- Duas decisões estruturais aqui:
--
-- 1. Existe um schema `private`, fora da Data API do Supabase. Nada nele é
--    alcançável por PostgREST, com ou sem RLS. É onde ficam o salt do
--    analytics e a lista de admins — dados que nenhum cliente deve enxergar.
--
-- 2. Revogamos os GRANTs automáticos que o Supabase dá a `anon` e
--    `authenticated` em objetos futuros de `public`. A partir daqui, todo
--    acesso via API é explícito, tabela por tabela. É a diferença entre
--    "esqueci de proteger" e "esqueci de liberar" — o segundo erro é barulhento
--    e inofensivo, o primeiro é silencioso e vaza dados.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Admin
-- -----------------------------------------------------------------------------
-- O usuário é criado à mão no painel (Authentication > Users) e promovido por
-- uma migration com o UUID dele. Não existe rota de auto-promoção: se existisse,
-- seria a rota de escalonamento de privilégio.

create table private.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on table private.admins from anon, authenticated;

-- `set search_path = ''` é obrigatório em SECURITY DEFINER: sem isso, um
-- search_path controlado pelo chamador pode fazer a função resolver
-- `private.admins` para uma tabela plantada por ele. Todos os nomes internos
-- ficam qualificados.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admins a where a.user_id = (select auth.uid())
  )
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
  'Verdadeiro se o usuário autenticado está em private.admins. Usada nas políticas de RLS.';
