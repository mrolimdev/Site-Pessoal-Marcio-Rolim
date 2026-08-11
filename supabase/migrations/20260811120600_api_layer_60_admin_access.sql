-- ============================================================================
-- 20260811120600_api_layer_60_admin_access.sql
--
-- COMO O PAINEL ADMIN CONSULTA ISSO SEM VARRER A TABELA INTEIRA
--
-- O schema `api` não está exposto na Data API, então o painel não fala com as
-- tabelas: fala com este arquivo. São três mecanismos, cada um resolvendo um
-- tipo de varredura:
--
--   PROBLEMA 1 — "carregar tudo e paginar no cliente".
--   SOLUÇÃO: paginação KEYSET (seek). `?offset=10000` obriga o Postgres a ler
--   e descartar 10.000 linhas; o custo cresce com a profundidade da página.
--   O keyset passa a última linha vista como cursor e vira um range scan de
--   custo constante, idêntico na página 1 e na página 500:
--       where (received_at, id) < ($cursor_ts, $cursor_id)
--       order by received_at desc, id desc
--       limit 50
--   A comparação de tupla `(a,b) < (x,y)` é o que casa exatamente com o índice
--   composto (received_at desc, id desc) — comparar coluna a coluna com AND/OR
--   normalmente derruba o uso do índice.
--
--   PROBLEMA 2 — "COUNT(*) para mostrar o total".
--   Um count exato lê a tabela inteira, e no PostgREST `Prefer: count=exact`
--   faz isso a CADA página. O painel deve usar `count=planned` (estimativa do
--   planner, custo zero) ou, para números que aparecem em tela, a tabela de
--   rollup diário abaixo. Contagem exata só depois de filtrar por período curto.
--
--   PROBLEMA 3 — "gráfico dos últimos 30 dias agregando o log cru".
--   SOLUÇÃO: api.inbound_events_daily, um rollup incremental mantido por cron.
--   O dashboard lê ~30 linhas por endpoint em vez de agregar centenas de
--   milhares de eventos, e continua correto depois que a retenção apagar o
--   log cru — que é o ponto: o gráfico anual sobrevive à política de 180 dias.
--
-- As views usam `security_invoker = true` (PG15+). Sem isso, a view rodaria com
-- os privilégios do dono e a RLS avaliada seria a DELE, não a de quem consulta
-- — uma view em `public` viraria um furo silencioso na RLS. Com invoker, a
-- policy `is_admin()` da tabela base continua valendo para cada leitor.
-- ============================================================================


-- ============================================================================
-- Rollup diário (PROBLEMA 3)
-- ============================================================================
create table api.inbound_events_daily (
  day             date        not null,
  endpoint_id     uuid,
  endpoint_slug   text        not null,
  status          text        not null,

  events          bigint      not null default 0,
  total_bytes     bigint      not null default 0,
  avg_ms          numeric(10,2),
  p95_ms          integer,
  max_ms          integer,

  refreshed_at    timestamptz not null default now(),

  -- Tabela real, não MATERIALIZED VIEW: MV só sabe recalcular tudo
  -- (REFRESH varre todo o histórico), e sem CONCURRENTLY ainda bloqueia
  -- leitura durante o refresh. Com tabela + PK dá para fazer UPSERT apenas dos
  -- dias afetados.
  primary key (day, endpoint_slug, status)
);

comment on table api.inbound_events_daily is
  'Agregado diário de inbound_events. Alimenta os gráficos do dashboard e '
  'preserva a série histórica depois que a retenção apagar o log cru.';

-- O dashboard quase sempre pede "últimos N dias, todos os endpoints".
create index inbound_events_daily_day_idx
  on api.inbound_events_daily (day desc);

alter table api.inbound_events_daily enable row level security;

create policy inbound_events_daily_admin_select
  on api.inbound_events_daily
  for select
  to authenticated
  using ((select api.is_admin()));

revoke all on api.inbound_events_daily from anon, authenticated;
grant select on api.inbound_events_daily to authenticated;


-- api.refresh_inbound_events_daily() -----------------------------------------
-- Recalcula apenas os últimos p_days dias (default 3): cobre eventos que
-- chegaram atrasados e a virada de fuso, sem tocar no histórico consolidado.
create or replace function api.refresh_inbound_events_daily(p_days integer default 3)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from date := (now() - make_interval(days => p_days))::date;
  v_rows integer;
begin
  insert into api.inbound_events_daily as d (
    day, endpoint_id, endpoint_slug, status,
    events, total_bytes, avg_ms, p95_ms, max_ms, refreshed_at
  )
  select e.received_at::date,
         -- Agrupamos por endpoint_slug (que sobrevive ao DELETE do endpoint),
         -- mas queremos carregar o uuid junto. `min(endpoint_id)` NÃO serve:
         -- o Postgres não tem agregado min/max para uuid. array_agg + [1]
         -- pega qualquer um dos ids do grupo, que é o mesmo para todos.
         (array_agg(e.endpoint_id) filter (where e.endpoint_id is not null))[1],
         e.endpoint_slug,
         e.status,
         count(*),
         coalesce(sum(e.payload_bytes), 0),
         round(avg(e.processing_ms)::numeric, 2),
         percentile_disc(0.95) within group (order by e.processing_ms)::integer,
         max(e.processing_ms),
         now()
    from api.inbound_events e
   where e.received_at >= v_from          -- usa inbound_events_received_desc_idx
   group by e.received_at::date, e.endpoint_slug, e.status
  on conflict (day, endpoint_slug, status) do update
     set endpoint_id  = excluded.endpoint_id,
         events       = excluded.events,
         total_bytes  = excluded.total_bytes,
         avg_ms       = excluded.avg_ms,
         p95_ms       = excluded.p95_ms,
         max_ms       = excluded.max_ms,
         refreshed_at = excluded.refreshed_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function api.refresh_inbound_events_daily(integer) from public;
grant execute on function api.refresh_inbound_events_daily(integer) to service_role;


-- ============================================================================
-- Views para o painel (schema `public`, que É exposto na Data API)
--
-- Servem às telas de lista simples via supabase-js. As colunas sensíveis
-- (hash, payload, ponteiro de Vault) nem constam — e mesmo que constassem, os
-- grants de coluna dos arquivos 10..40 já impediriam a leitura.
-- ============================================================================

create view public.admin_api_keys
with (security_invoker = true) as
select k.id,
       k.name,
       k.description,
       k.environment,
       k.key_prefix,
       k.last_four,
       k.scopes,
       k.owner_id,
       k.rate_limit_per_minute,
       k.created_at,
       k.expires_at,
       k.revoked_at,
       k.revoked_reason,
       k.last_used_at,
       k.last_used_ip,
       k.usage_count,
       api.api_key_is_usable(k.revoked_at, k.expires_at) as is_usable
  from api.api_keys k;

comment on view public.admin_api_keys is
  'Chaves de API sem o hash. security_invoker: a RLS avaliada é a de quem lê.';

grant select on public.admin_api_keys to authenticated;
revoke all on public.admin_api_keys from anon;


create view public.admin_webhook_endpoints
with (security_invoker = true) as
select e.id,
       e.slug,
       e.name,
       e.description,
       e.action,
       e.is_active,
       e.require_signature,
       e.require_api_key,
       e.required_scope,
       e.rate_limit_requests,
       e.rate_limit_window_seconds,
       e.max_payload_bytes,
       e.require_idempotency_key,
       e.retain_payload_days,
       e.retain_event_days,
       e.secret_rotated_at,
       e.previous_secret_valid_until,
       e.last_event_at,
       e.created_at,
       e.updated_at
  from api.webhook_endpoints e;

grant select on public.admin_webhook_endpoints to authenticated;
revoke all on public.admin_webhook_endpoints from anon;


create view public.admin_outbound_subscriptions
with (security_invoker = true) as
select s.id,
       s.name,
       s.description,
       s.target_url,
       s.event_types,
       s.is_active,
       s.max_attempts,
       s.timeout_ms,
       s.consecutive_failures,
       s.failure_threshold,
       s.disabled_at,
       s.disabled_reason,
       s.last_success_at,
       s.last_failure_at,
       s.created_at
  from api.outbound_subscriptions s;

grant select on public.admin_outbound_subscriptions to authenticated;
revoke all on public.admin_outbound_subscriptions from anon;


create view public.admin_inbound_events_daily
with (security_invoker = true) as
select d.day,
       d.endpoint_slug,
       d.status,
       d.events,
       d.total_bytes,
       d.avg_ms,
       d.p95_ms,
       d.max_ms
  from api.inbound_events_daily d;

grant select on public.admin_inbound_events_daily to authenticated;
revoke all on public.admin_inbound_events_daily from anon;


-- ============================================================================
-- RPCs de paginação keyset (PROBLEMA 1)
--
-- Ficam em `public` porque o PostgREST só expõe funções de schema exposto.
-- São SECURITY INVOKER (o default para funções): a RLS da tabela base continua
-- valendo, e a checagem de admin não depende de lembrar de chamar assert_admin.
-- ============================================================================

-- public.admin_inbound_events_page ------------------------------------------
-- Chamada do painel:
--   const { data } = await supabase.rpc('admin_inbound_events_page', {
--     p_endpoint_id: endpointId ?? null,
--     p_status:      statusFiltro ?? null,
--     p_cursor_received_at: ultimo?.received_at ?? null,
--     p_cursor_id:          ultimo?.id ?? null,
--     p_limit: 50
--   })
-- Sem cursor = primeira página. Passar a última linha da página anterior
-- avança. `payload` NÃO vem aqui — a lista não precisa dele, e trazê-lo
-- transformaria 50 linhas em megabytes de JSON.
create or replace function public.admin_inbound_events_page(
  p_endpoint_id        uuid        default null,
  p_status             text        default null,
  p_since              timestamptz default null,
  p_cursor_received_at timestamptz default null,
  p_cursor_id          bigint      default null,
  p_limit              integer     default 50
)
returns table (
  id              bigint,
  public_id       uuid,
  endpoint_slug   text,
  action          text,
  status          text,
  http_method     text,
  source_ip       inet,
  api_key_prefix  text,
  signature_valid boolean,
  idempotency_key text,
  payload_bytes   integer,
  processing_ms   integer,
  error_code      text,
  error_message   text,
  received_at     timestamptz,
  processed_at    timestamptz
)
language sql
stable
set search_path = ''
as $$
  select e.id, e.public_id, e.endpoint_slug, e.action, e.status,
         e.http_method, e.source_ip, e.api_key_prefix, e.signature_valid,
         e.idempotency_key, e.payload_bytes, e.processing_ms,
         e.error_code, e.error_message, e.received_at, e.processed_at
    from api.inbound_events e
   where (p_endpoint_id is null or e.endpoint_id = p_endpoint_id)
     and (p_status      is null or e.status      = p_status)
     and (p_since       is null or e.received_at >= p_since)
     -- Comparação de TUPLA: é o que permite ao planner usar o índice composto
     -- (received_at desc, id desc) em um único range scan. Reescrever como
     -- "received_at < x or (received_at = x and id < y)" costuma virar filtro
     -- pós-scan e perder o índice.
     and (
       p_cursor_received_at is null
       or (e.received_at, e.id) < (p_cursor_received_at, coalesce(p_cursor_id, 9223372036854775807))
     )
   order by e.received_at desc, e.id desc
   limit least(coalesce(p_limit, 50), 200);   -- teto: nenhuma chamada do painel
$$;                                           -- pode pedir a tabela inteira

comment on function public.admin_inbound_events_page is
  'Feed de eventos com paginação keyset. Custo constante independente da '
  'profundidade da página. Sem payload — use admin_inbound_event_detail.';

-- Ordem obrigatória: REVOKE ... FROM public ANTES do grant. Toda função nasce
-- com EXECUTE concedido a PUBLIC, e `anon` herda por aí — revogar só de `anon`
-- não tira nada, porque o privilégio dele vem de PUBLIC, não de um grant
-- direto. Isso vale para todas as funções deste arquivo.
revoke all on function public.admin_inbound_events_page(
  uuid, text, timestamptz, timestamptz, bigint, integer) from public;
grant execute on function public.admin_inbound_events_page(
  uuid, text, timestamptz, timestamptz, bigint, integer) to authenticated;


-- public.admin_inbound_event_detail -----------------------------------------
-- Único caminho para o payload e os headers crus. SECURITY DEFINER (o grant de
-- coluna do arquivo 30 não inclui `payload`), logo a checagem de admin é
-- obrigatória e explícita. Busca por public_id, não pelo id sequencial.
create or replace function public.admin_inbound_event_detail(p_public_id uuid)
returns table (
  id              bigint,
  public_id       uuid,
  endpoint_slug   text,
  action          text,
  status          text,
  headers         jsonb,
  payload         jsonb,
  payload_bytes   integer,
  payload_sha256  text,
  payload_purged_at timestamptz,
  result          jsonb,
  error_code      text,
  error_message   text,
  error_detail    jsonb,
  source_ip       inet,
  user_agent      text,
  api_key_prefix  text,
  signature_valid boolean,
  idempotency_key text,
  attempts        integer,
  processing_ms   integer,
  received_at     timestamptz,
  processed_at    timestamptz
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  perform api.assert_admin();

  return query
    select e.id, e.public_id, e.endpoint_slug, e.action, e.status,
           e.headers, e.payload, e.payload_bytes,
           encode(e.payload_sha256, 'hex'), e.payload_purged_at,
           e.result, e.error_code, e.error_message, e.error_detail,
           e.source_ip, e.user_agent, e.api_key_prefix, e.signature_valid,
           e.idempotency_key, e.attempts, e.processing_ms,
           e.received_at, e.processed_at
      from api.inbound_events e
     where e.public_id = p_public_id;     -- inbound_events_public_id_uidx
end;
$$;

revoke all on function public.admin_inbound_event_detail(uuid) from public;
grant execute on function public.admin_inbound_event_detail(uuid) to authenticated;


-- public.admin_outbound_deliveries_page -------------------------------------
create or replace function public.admin_outbound_deliveries_page(
  p_subscription_id   uuid        default null,
  p_status            text        default null,
  p_cursor_created_at timestamptz default null,
  p_cursor_id         uuid        default null,
  p_limit             integer     default 50
)
returns table (
  id              uuid,
  subscription_id uuid,
  event_type      text,
  event_id        uuid,
  status          text,
  attempt         integer,
  max_attempts    integer,
  response_status integer,
  duration_ms     integer,
  error_message   text,
  next_attempt_at timestamptz,
  last_attempt_at timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz
)
language sql
stable
set search_path = ''
as $$
  select d.id, d.subscription_id, d.event_type, d.event_id, d.status,
         d.attempt, d.max_attempts, d.response_status, d.duration_ms,
         d.error_message, d.next_attempt_at, d.last_attempt_at,
         d.completed_at, d.created_at
    from api.outbound_deliveries d
   where (p_subscription_id is null or d.subscription_id = p_subscription_id)
     and (p_status          is null or d.status          = p_status)
     and (
       p_cursor_created_at is null
       or (d.created_at, d.id) < (p_cursor_created_at,
                                  coalesce(p_cursor_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
     )
   order by d.created_at desc, d.id desc      -- outbound_deliveries_subscription_idx
   limit least(coalesce(p_limit, 50), 200);
$$;

revoke all on function public.admin_outbound_deliveries_page(
  uuid, text, timestamptz, uuid, integer) from public;
grant execute on function public.admin_outbound_deliveries_page(
  uuid, text, timestamptz, uuid, integer) to authenticated;


-- public.admin_api_overview -------------------------------------------------
-- Os números do topo do dashboard, em uma chamada.
--
-- `total_events_estimado` vem de pg_class.reltuples (estimativa mantida pelo
-- autovacuum): custo O(1) contra o Seq Scan de um count(*) exato. Os demais
-- números são exatos porque saem do rollup ou de índices parciais que contêm
-- pouquíssimas linhas — a contagem "com problema" percorre
-- inbound_events_problem_idx, que em operação saudável está quase vazio.
create or replace function public.admin_api_overview()
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v jsonb;
begin
  perform api.assert_admin();

  select jsonb_build_object(
    'total_events_estimado',
      (select greatest(c.reltuples, 0)::bigint
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'api' and c.relname = 'inbound_events'),

    'eventos_24h',
      (select count(*) from api.inbound_events
        where received_at >= now() - interval '24 hours'),

    'com_problema',
      (select count(*) from api.inbound_events
        where status in ('failed', 'received', 'processing')),

    'rejeitados_24h',
      (select count(*) from api.inbound_events
        where status = 'rejected' and received_at >= now() - interval '24 hours'),

    'chaves_ativas',
      (select count(*) from api.api_keys
        where revoked_at is null and (expires_at is null or expires_at > now())),

    'chaves_expirando_7d',
      (select count(*) from api.api_keys
        where revoked_at is null
          and expires_at between now() and now() + interval '7 days'),

    'endpoints_ativos',
      (select count(*) from api.webhook_endpoints where is_active),

    'fila_saida',
      (select count(*) from api.outbound_deliveries
        where status in ('pending', 'failed')),

    'entregas_esgotadas_7d',
      (select count(*) from api.outbound_deliveries
        where status = 'exhausted' and completed_at >= now() - interval '7 days'),

    'assinaturas_desativadas',
      (select count(*) from api.outbound_subscriptions where not is_active)
  ) into v;

  return v;
end;
$$;

revoke all on function public.admin_api_overview() from public;
grant execute on function public.admin_api_overview() to authenticated;
