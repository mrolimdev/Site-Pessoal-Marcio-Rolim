-- ============================================================================
-- 20260811120100_api_layer_10_api_keys.sql
--
-- api.api_keys — credenciais entregues a terceiros (n8n, Make, scripts).
--
-- FORMATO DA CHAVE (gerado no servidor, mostrado UMA vez):
--
--     mrk_live_a1b2c3d4_9f8e7d6c5b4a39281706f5e4d3c2b1a0
--     └─┬─┘ └─┬┘ └──┬───┘ └──────────────┬──────────────┘
--       │    │      │                    └ segredo, 32 chars base62 (~190 bits)
--       │    │      └ identificador público, 8 chars — vira `key_prefix`
--       │    └ ambiente ('live' | 'test')
--       └ marca do projeto
--
-- O QUE VAI PARA O BANCO:
--   key_prefix  = 'mrk_live_a1b2c3d4'  → identificação no painel e nos logs
--   last_four   = '1a0'…'b1a0'          → o usuário confere qual chave é a sua
--   key_hash    = HMAC-SHA256(pepper, chave_inteira) → 32 bytes, bytea
--
-- Por que HMAC com pepper e não bcrypt/argon2: a verificação acontece em TODA
-- requisição de webhook. bcrypt custa dezenas de milissegundos de propósito —
-- inviável no caminho quente e um vetor de DoS. A chave já tem ~190 bits de
-- entropia aleatória, então não há dicionário a proteger; o risco real é
-- vazamento do dump do banco, e o pepper (env var API_KEY_PEPPER, fora do
-- Postgres) cobre exatamente esse caso. O hash é determinístico, então a
-- autenticação é um único lookup por índice único.
--
-- O HMAC é calculado no Node (crypto.createHmac), nunca no Postgres — o pepper
-- não deve trafegar em statement algum, senão vaza para pg_stat_statements e
-- para os logs de query.
-- ============================================================================

create table api.api_keys (
  id                      uuid primary key default gen_random_uuid(),

  -- Identificação -----------------------------------------------------------
  name                    text        not null,
  description             text,
  environment             text        not null default 'live',

  -- Parte pública da credencial. UNIQUE porque é o identificador humano da
  -- chave em telas e logs de auditoria; colisão tornaria o log ambíguo.
  key_prefix              text        not null,
  last_four               text        not null,

  -- Parte secreta. UNIQUE serve a dois propósitos: é o índice de autenticação
  -- (lookup O(1) no caminho quente) e impede que duas linhas representem a
  -- mesma credencial.
  key_hash                bytea       not null,

  -- Autorização -------------------------------------------------------------
  scopes                  text[]      not null default '{}',
  owner_id                uuid        references auth.users (id) on delete set null,

  -- Rate limit específico desta chave. NULL = usa o limite do endpoint.
  -- Uma chave concedida a um parceiro barulhento pode ser estrangulada sem
  -- mexer no endpoint, que é compartilhado.
  rate_limit_per_minute   integer,

  -- Restrição de origem opcional. n8n Cloud e Make publicam faixas de saída;
  -- quando o parceiro tem IP fixo, isto elimina a maior parte do abuso antes
  -- mesmo do rate limit. NULL/vazio = sem restrição.
  allowed_ip_ranges       cidr[],

  -- Ciclo de vida -----------------------------------------------------------
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid        references auth.users (id) on delete set null,

  expires_at              timestamptz,

  revoked_at              timestamptz,
  revoked_reason          text,
  revoked_by              uuid        references auth.users (id) on delete set null,

  -- Telemetria de uso. Ver nota sobre escrita throttled logo abaixo da tabela.
  last_used_at            timestamptz,
  last_used_ip            inet,
  last_used_endpoint      text,
  usage_count             bigint      not null default 0,

  metadata                jsonb       not null default '{}'::jsonb,

  -- Constraints -------------------------------------------------------------
  constraint api_keys_name_len_chk
    check (char_length(name) between 1 and 120),

  constraint api_keys_environment_chk
    check (environment in ('live', 'test')),

  -- O prefixo tem formato fixo e precisa concordar com `environment`; sem isso
  -- dá para criar uma chave marcada como 'test' cujo prefixo diz 'live', e o
  -- log de auditoria passa a mentir.
  constraint api_keys_prefix_format_chk
    check (key_prefix ~ '^mrk_(live|test)_[A-Za-z0-9]{8}$'),
  constraint api_keys_prefix_matches_env_chk
    check (key_prefix like 'mrk_' || environment || '_%'),

  constraint api_keys_last_four_chk
    check (last_four ~ '^[A-Za-z0-9]{4}$'),

  -- HMAC-SHA256 tem exatamente 32 bytes. Barra qualquer tentativa de guardar
  -- a chave em claro nessa coluna.
  constraint api_keys_hash_len_chk
    check (octet_length(key_hash) = 32),

  -- cardinality() em vez de array_length(): array_length('{}', 1) devolve NULL
  -- e CHECK com NULL PASSA, o que deixaria passar chave sem escopo nenhum.
  constraint api_keys_scopes_chk
    check (
      cardinality(scopes) between 1 and 32
      and scopes <@ array[
        'blog:read', 'blog:write', 'blog:publish',
        'media:write',
        'analytics:read', 'analytics:write',
        'webhooks:read', 'webhooks:manage'
      ]::text[]
    ),

  constraint api_keys_expires_after_creation_chk
    check (expires_at is null or expires_at > created_at),

  -- Motivo e autor da revogação só fazem sentido em chave revogada.
  constraint api_keys_revocation_coherent_chk
    check (
      (revoked_at is not null)
      or (revoked_reason is null and revoked_by is null)
    ),

  constraint api_keys_rate_limit_chk
    check (rate_limit_per_minute is null or rate_limit_per_minute between 1 and 100000)
);

comment on table api.api_keys is
  'Credenciais de terceiros. Escrita exclusivamente pelo servidor via '
  'service_role; o hash nunca é concedido a papel de cliente.';
comment on column api.api_keys.key_hash is
  'HMAC-SHA256(API_KEY_PEPPER, chave_completa), 32 bytes. Calculado no Node — '
  'nunca passar o pepper para o Postgres.';
comment on column api.api_keys.usage_count is
  'Aproximado: incrementado junto com o UPDATE throttled de last_used_at, '
  'não a cada requisição. Para número exato use api.inbound_events.';

create trigger api_keys_set_updated_at
  before update on api.api_keys
  for each row execute function api.set_updated_at();


-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

-- (1) CAMINHO QUENTE — autenticação. Toda requisição faz exatamente:
--       select id, scopes, rate_limit_per_minute, revoked_at, expires_at,
--              allowed_ip_ranges
--         from api.api_keys where key_hash = $1;
--     Index Only Scan de uma linha. É o índice mais importante do arquivo.
create unique index api_keys_key_hash_uidx
  on api.api_keys (key_hash);

-- (2) Identificação pelo prefixo: suporte ("minha chave mrk_live_a1b2c3d4
--     parou"), e a tela de detalhe do painel, que navega por prefixo em vez de
--     expor o uuid interno.
create unique index api_keys_key_prefix_uidx
  on api.api_keys (key_prefix);

-- (3) Listagem padrão do painel: chaves vivas, mais novas primeiro.
--     Parcial: chave revogada sai do índice, então a lista principal continua
--     com o mesmo custo mesmo depois de anos de rotação.
create index api_keys_active_created_idx
  on api.api_keys (created_at desc)
  where revoked_at is null;

-- (4) Aba "por dono", quando houver mais de um usuário no painel.
create index api_keys_owner_idx
  on api.api_keys (owner_id, created_at desc)
  where owner_id is not null;

-- (5) Varredura do job diário que avisa "sua chave expira em 7 dias" e marca
--     as vencidas. Parcial e minúsculo: só chaves vivas COM validade.
create index api_keys_expiring_idx
  on api.api_keys (expires_at)
  where revoked_at is null and expires_at is not null;


-- ----------------------------------------------------------------------------
-- RLS
--
-- Escrita: nenhuma policy. `service_role` tem BYPASSRLS e escreve; qualquer
-- outro papel é negado por default-deny. Criação de chave é RPC (abaixo),
-- porque o segredo precisa ser gerado no servidor e devolvido uma única vez.
--
-- Leitura: só o admin. Note que o grant é POR COLUNA — `key_hash` e
-- `metadata` ficam de fora, de modo que nem um bug de policy nem uma exposição
-- acidental do schema entregam o material de autenticação.
-- ----------------------------------------------------------------------------
alter table api.api_keys enable row level security;

create policy api_keys_admin_select
  on api.api_keys
  for select
  to authenticated
  using ((select api.is_admin()));

revoke all on api.api_keys from anon, authenticated;

grant select (
  id, name, description, environment,
  key_prefix, last_four,
  scopes, owner_id, rate_limit_per_minute, allowed_ip_ranges,
  created_at, updated_at, created_by,
  expires_at, revoked_at, revoked_reason, revoked_by,
  last_used_at, last_used_ip, last_used_endpoint, usage_count
) on api.api_keys to authenticated;


-- ----------------------------------------------------------------------------
-- api.api_key_is_usable() — regra única de "esta chave vale agora?".
--
-- Não pode ser coluna GENERATED porque depende de now(), que não é IMMUTABLE.
-- Como função STABLE, o painel, os índices de relatório e a rota de auth usam
-- exatamente o mesmo critério.
-- ----------------------------------------------------------------------------
create or replace function api.api_key_is_usable(
  p_revoked_at timestamptz,
  p_expires_at timestamptz
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_revoked_at is null
     and (p_expires_at is null or p_expires_at > now());
$$;

revoke all on function api.api_key_is_usable(timestamptz, timestamptz) from public;
grant execute on function api.api_key_is_usable(timestamptz, timestamptz)
  to authenticated, service_role;


-- ----------------------------------------------------------------------------
-- api.touch_api_key() — atualiza last_used_at COM THROTTLE.
--
-- Por que existe: um UPDATE por requisição em `api_keys` significa uma versão
-- morta por requisição na mesma linha. Com tráfego constante em uma única
-- chave, essa linha vira o ponto mais quente do banco — bloat, autovacuum
-- perseguindo a tabela e, pior, todo request serializando no lock da linha.
--
-- Solução: só grava se já passou `p_min_interval` desde a última gravação. O
-- WHERE embutido faz o filtro dentro do próprio UPDATE, sem SELECT prévio e
-- sem corrida. A granularidade fina de uso vem de api.inbound_events, que é
-- append-only e barata de escrever.
-- ----------------------------------------------------------------------------
create or replace function api.touch_api_key(
  p_key_id        uuid,
  p_ip            inet     default null,
  p_endpoint      text     default null,
  p_min_interval  interval default interval '60 seconds'
)
returns void
language sql
security definer
set search_path = ''
as $$
  update api.api_keys
     set last_used_at       = now(),
         last_used_ip       = coalesce(p_ip, last_used_ip),
         last_used_endpoint = coalesce(p_endpoint, last_used_endpoint),
         usage_count        = usage_count + 1
   where id = p_key_id
     and (last_used_at is null or last_used_at < now() - p_min_interval);
$$;

comment on function api.touch_api_key(uuid, inet, text, interval) is
  'Grava last_used_at no máximo 1x por minuto por chave, evitando linha quente '
  'e bloat. Só service_role executa.';

revoke all on function api.touch_api_key(uuid, inet, text, interval) from public;
grant execute on function api.touch_api_key(uuid, inet, text, interval) to service_role;


-- ----------------------------------------------------------------------------
-- api.revoke_api_key() — revogação pelo painel.
--
-- Existe como RPC em vez de UPDATE direto para que `authenticated` continue
-- com privilégio de leitura apenas. SECURITY DEFINER, portanto a primeira
-- linha é a checagem de admin — sem ela, a função seria um bypass de RLS
-- concedido a todo usuário logado.
-- ----------------------------------------------------------------------------
create or replace function api.revoke_api_key(
  p_key_id uuid,
  p_reason text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revoked_at timestamptz;
begin
  perform api.assert_admin();

  update api.api_keys
     set revoked_at     = coalesce(revoked_at, now()),  -- idempotente
         revoked_reason = coalesce(revoked_reason, p_reason),
         revoked_by     = coalesce(revoked_by, auth.uid())
   where id = p_key_id
  returning revoked_at into v_revoked_at;

  if v_revoked_at is null then
    raise exception 'chave % não encontrada', p_key_id using errcode = 'P0002';
  end if;

  return v_revoked_at;
end;
$$;

revoke all on function api.revoke_api_key(uuid, text) from public;
grant execute on function api.revoke_api_key(uuid, text) to authenticated, service_role;
