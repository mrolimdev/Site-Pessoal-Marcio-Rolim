-- =============================================================================
-- 0003 — Analytics próprio
-- =============================================================================
-- Princípio de privacidade que sustenta a base legal de legítimo interesse:
-- IP e User-Agent ENTRAM na função de ingestão e saem dela como um hash. Nunca
-- são gravados. O salt que produz esse hash é rotacionado por dia e destruído
-- em 48h, o que torna o identificador irreversível e impede correlacionar o
-- mesmo visitante entre dias.
--
-- Consequência assumida: "visitantes únicos no mês" e "novos vs. recorrentes"
-- deixam de ser calculáveis. É o preço do desenho, e está documentado na UI.
--
-- Princípio de integridade: NENHUM cliente escreve aqui. Sem grants para anon,
-- sem política de INSERT. A escrita é exclusivamente pela função SECURITY
-- DEFINER, chamada pelo Route Handler com a chave secreta. O RLS fica ligado
-- como defesa em profundidade.
-- =============================================================================

create table private.analytics_salt (
  day        date  primary key default current_date,
  salt       bytea not null default extensions.gen_random_bytes(32),
  created_at timestamptz not null default now()
);
revoke all on table private.analytics_salt from anon, authenticated;

create table public.analytics_session (
  id           uuid primary key default gen_random_uuid(),
  visitor_id   uuid not null,
  day          date not null default current_date,
  started_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),

  entry_path      text,
  exit_path       text,
  referrer_domain text,
  referrer_path   text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,

  browser         text,
  browser_version text,
  os              text,
  device          text check (device in ('desktop','mobile','tablet','unknown')),
  screen          text,
  viewport        text,
  language        text,

  -- Só país. Sem cidade, sem região, sem coordenada, sem IP: minimização.
  country char(2),

  pageviews  integer  not null default 0,
  events     integer  not null default 0,
  active_ms  bigint   not null default 0,
  max_scroll smallint not null default 0,

  is_bot      boolean not null default false,
  bot_reason  text,
  is_internal boolean not null default false,

  -- Coluna gerada: o dashboard nunca recalcula rejeição.
  is_bounce boolean generated always as (pageviews <= 1) stored
);

create table public.analytics_event (
  id         bigint generated always as identity primary key,
  session_id uuid not null references public.analytics_session(id) on delete cascade,
  visitor_id uuid not null,
  -- Sempre do servidor. O cliente não tem como forjar o instante.
  created_at timestamptz not null default now(),

  kind smallint not null default 1,   -- 1 pageview | 2 custom | 3 engajamento
  name text check (name is null or length(name) <= 64),

  path  text not null check (length(path) <= 500),
  query text check (length(query) <= 500),
  title text check (length(title) <= 300),

  -- Aquisição desnormalizada: evita join com session no rollup.
  referrer_domain text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,

  duration_ms  integer,
  scroll_depth smallint check (scroll_depth between 0 and 100),
  href  text check (href  is null or length(href)  <= 500),
  label text check (label is null or length(label) <= 120),
  props jsonb check (props is null or pg_column_size(props) < 2048)
);

-- BRIN na coluna de tempo: o dado chega ordenado por inserção, então o índice
-- fica em KBs onde um B-tree teria MBs.
create index analytics_event_time_brin on public.analytics_event
  using brin (created_at) with (pages_per_range = 32);
create index analytics_event_path_idx    on public.analytics_event (created_at, path);
create index analytics_event_session_idx on public.analytics_event (session_id, created_at);
create index analytics_event_custom_idx  on public.analytics_event (created_at, name) where kind = 2;

create index analytics_session_time_idx    on public.analytics_session (started_at desc);
create index analytics_session_visitor_idx on public.analytics_session (visitor_id, last_seen_at desc);
-- Quase toda consulta do dashboard olha só tráfego limpo.
create index analytics_session_clean_idx   on public.analytics_session (started_at desc)
  where not is_bot and not is_internal;

-- ── Rollup: o dashboard NUNCA varre analytics_event ──────────────────────────
create table public.analytics_daily (
  day       date not null,
  dimension text not null,   -- total|path|referrer|country|device|browser|utm_source|event
  value     text not null,   -- '' quando dimension = 'total'
  pageviews bigint not null default 0,
  events    bigint not null default 0,
  sessions  bigint not null default 0,
  bounces   bigint not null default 0,
  active_ms bigint not null default 0,
  visitors  bigint not null default 0,   -- distintos DENTRO do dia
  primary key (day, dimension, value)
);
create index analytics_daily_dim_idx on public.analytics_daily (dimension, day desc);

-- ── GRANTs + RLS ─────────────────────────────────────────────────────────────
-- anon não recebe nada: nem select, nem insert.
grant select on table public.analytics_session, public.analytics_event, public.analytics_daily
  to authenticated;

alter table public.analytics_session enable row level security;
alter table public.analytics_event   enable row level security;
alter table public.analytics_daily   enable row level security;

create policy "so admin le sessoes" on public.analytics_session for select to authenticated
  using ((select public.is_admin()));
create policy "so admin le eventos" on public.analytics_event for select to authenticated
  using ((select public.is_admin()));
create policy "so admin le rollup" on public.analytics_daily for select to authenticated
  using ((select public.is_admin()));
-- Sem política de INSERT/UPDATE/DELETE para ninguém: append-only pela função.
