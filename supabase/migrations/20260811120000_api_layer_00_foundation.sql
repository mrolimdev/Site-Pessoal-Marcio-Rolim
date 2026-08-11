-- ============================================================================
-- 20260811120000_api_layer_00_foundation.sql
--
-- Camada de API / Webhooks — FUNDAÇÃO
--
-- Decisões estruturais (valem para todos os arquivos 00..80):
--
-- 1) SCHEMA PRÓPRIO, NÃO EXPOSTO NA DATA API.
--    Todas as tabelas vivem em `api`, e `api` NÃO deve ser adicionado em
--    Settings > API > "Exposed schemas". O PostgREST só serve os schemas
--    listados ali; com isso, nem o `anon` nem o `authenticated` conseguem
--    fazer `from('api_keys')` — a tabela simplesmente não existe para a Data
--    API. RLS continua ligada como segunda barreira (defesa em profundidade),
--    não como única barreira.
--    O painel admin lê através de VIEWs `security_invoker` e de RPCs em
--    `public` (arquivo 60), que é o schema exposto.
--
-- 2) ESCRITA SEMPRE PELO SERVIDOR (service_role).
--    Todo INSERT/UPDATE/DELETE nessas tabelas acontece em Route Handlers /
--    Server Actions do Next.js usando SUPABASE_SERVICE_ROLE_KEY. O
--    `service_role` tem BYPASSRLS, então nenhuma policy de INSERT/UPDATE/
--    DELETE é criada para os papéis de cliente. "Sem policy" = negado.
--
-- 3) LEITURA SÓ PARA ADMIN AUTENTICADO.
--    Identificado por `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`.
--    Ficar no JWT evita um SELECT extra por linha durante a avaliação da RLS.
--    Para marcar o dono como admin (uma vez, via service_role):
--      await supabaseAdmin.auth.admin.updateUserById(userId, {
--        app_metadata: { role: 'admin' }
--      })
--    `app_metadata` não é editável pelo próprio usuário — `user_metadata` é.
--    Nunca use `user_metadata` para autorização.
--
-- 4) `text` + CHECK em vez de ENUM.
--    `ALTER TYPE ... ADD VALUE` não pode ser usado na mesma transação em que
--    foi criado, e o Supabase CLI roda migration dentro de transação. Com
--    CHECK, adicionar um status novo é um `ALTER TABLE ... DROP CONSTRAINT /
--    ADD CONSTRAINT ... NOT VALID` + `VALIDATE`, sem travar a tabela.
--
-- 5) SEM `FORCE ROW LEVEL SECURITY`.
--    Os jobs de retenção (arquivo 70) rodam via pg_cron como `postgres`, que é
--    dono das tabelas. Com FORCE, o dono também passaria a ser filtrado pela
--    RLS e os DELETEs de retenção passariam a apagar zero linhas em silêncio.
--    A proteção real aqui é o schema não exposto + ausência de grants.
--
-- Requisitos: Postgres 15+ (Supabase). Usa `sha256()` e `gen_random_uuid()`
-- nativos — nenhuma extensão além de pg_cron (arquivo 70) é necessária.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Extensões
--
-- `sha256()` e `gen_random_uuid()` são nativos no PG15+, então a única
-- dependência real é `gen_random_bytes()` (pgcrypto), usada para gerar
-- segredos de webhook dentro do banco. No Supabase o pgcrypto já vem
-- instalado no schema `extensions`; a linha abaixo é idempotente e cobre o
-- ambiente local do `supabase start`.
-- pg_cron é habilitado no arquivo 70, onde é de fato usado.
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;


-- ----------------------------------------------------------------------------
-- Schema
-- ----------------------------------------------------------------------------
create schema if not exists api;

comment on schema api is
  'Camada de integração: chaves de API, endpoints de webhook de entrada, log '
  'de eventos recebidos, fan-out de saída e contadores de rate limit. '
  'NÃO adicionar em "Exposed schemas" — o painel admin acessa via views/RPC '
  'em public.';


-- ----------------------------------------------------------------------------
-- Grants de base
--
-- `anon` não recebe absolutamente nada. `authenticated` recebe apenas USAGE no
-- schema — sem USAGE, as views `security_invoker` de `public` (arquivo 60)
-- falhariam com "permission denied for schema api". USAGE sozinho não dá
-- acesso a nenhuma tabela; os grants de SELECT são declarados tabela a tabela,
-- e em várias delas apenas em COLUNAS específicas (hash, segredo e payload
-- ficam de fora).
-- ----------------------------------------------------------------------------
revoke all on schema api from public;
revoke usage on schema api from anon;

grant usage on schema api to authenticated;
grant usage on schema api to service_role;

-- Guarda contra esquecimento: qualquer tabela/função futura criada em `api`
-- nasce sem privilégio para os papéis de cliente.
alter default privileges in schema api revoke all on tables    from anon, authenticated;
alter default privileges in schema api revoke all on functions from anon, authenticated;
alter default privileges in schema api revoke all on sequences from anon, authenticated;


-- ----------------------------------------------------------------------------
-- api.is_admin() — predicado único usado por todas as policies.
--
-- STABLE: o planner pode chamar uma vez por statement. Nas policies ela é
-- SEMPRE escrita como `(select api.is_admin())`: envolver em subquery força o
-- otimizador a materializar um InitPlan, avaliado 1x por statement em vez de
-- 1x por linha. Em tabela de log com centenas de milhares de linhas isso é a
-- diferença entre O(n) e O(1) chamadas de função.
--
-- `set search_path = ''` atende ao lint `function_search_path_mutable` do
-- Supabase e obriga a qualificar tudo (`auth.jwt()`), fechando a porta para
-- sequestro de search_path.
-- ----------------------------------------------------------------------------
create or replace function api.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    -- Admin do painel: claim gravado em app_metadata (imutável pelo usuário).
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    -- Redundante (service_role já tem BYPASSRLS), mas mantém o predicado
    -- verdadeiro se alguém rodar uma query manual com o JWT de serviço.
    or (auth.jwt() ->> 'role') = 'service_role',
    false
  );
$$;

comment on function api.is_admin() is
  'True quando o JWT corrente carrega app_metadata.role = admin. Usar sempre '
  'como (select api.is_admin()) dentro de policies para virar InitPlan.';

-- Toda função nasce com EXECUTE para PUBLIC; revogar primeiro, conceder depois.
revoke all on function api.is_admin() from public;
grant execute on function api.is_admin() to authenticated, service_role;


-- ----------------------------------------------------------------------------
-- api.assert_admin() — guarda para funções SECURITY DEFINER.
--
-- Funções DEFINER rodam com os privilégios do dono e ignoram RLS; por isso
-- cada uma delas começa chamando esta função. Sem isso, uma RPC DEFINER
-- concedida a `authenticated` viraria um bypass geral da RLS.
-- ----------------------------------------------------------------------------
create or replace function api.assert_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not api.is_admin() then
    -- 42501 = insufficient_privilege; o PostgREST traduz para HTTP 403.
    raise exception 'acesso restrito ao administrador' using errcode = '42501';
  end if;
end;
$$;

revoke all on function api.assert_admin() from public;
grant execute on function api.assert_admin() to authenticated, service_role;


-- ----------------------------------------------------------------------------
-- api.set_updated_at() — trigger genérico de updated_at.
-- ----------------------------------------------------------------------------
create or replace function api.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- Catálogos de vocabulário controlado.
--
-- Escopos de api_keys, ações de webhook_endpoints e tipos de evento de saída
-- são validados por CHECK contra estas listas. Manter as listas aqui, em um
-- único lugar comentado, evita divergência entre as três tabelas e o código
-- TypeScript. Ao adicionar um valor, atualize o CHECK correspondente e o union
-- type no front — de preferência na mesma migration/PR.
--
--   ESCOPOS (api_keys.scopes)
--     blog:read            listar/ler posts, inclusive rascunhos
--     blog:write           criar e editar rascunhos
--     blog:publish         publicar / despublicar
--     media:write          upload de imagem de capa
--     analytics:read       ler agregados do dashboard
--     analytics:write      ingerir eventos de analytics
--     webhooks:read        ler o log de inbound_events
--     webhooks:manage      criar/rotacionar endpoints e assinaturas
--
--   AÇÕES (webhook_endpoints.action)
--     blog.post.draft.create      n8n/Make cria rascunho a partir de um feed
--     blog.post.update            atualiza um rascunho existente
--     blog.post.publish           publica um post já revisado
--     blog.post.unpublish         tira do ar
--     media.asset.ingest          registra imagem/vídeo vindo de storage externo
--     analytics.event.ingest      evento bruto para o dashboard próprio
--     contact.message.create      formulário de contato via automação
--     newsletter.subscriber.upsert
--     noop.echo                   só grava e devolve 200 — usado para validar
--                                 assinatura/headers ao montar o fluxo no n8n
--
--   EVENTOS DE SAÍDA (outbound_subscriptions.event_types)
--     post.published, post.updated, post.unpublished,
--     contact.received, analytics.daily_rollup
-- ----------------------------------------------------------------------------
