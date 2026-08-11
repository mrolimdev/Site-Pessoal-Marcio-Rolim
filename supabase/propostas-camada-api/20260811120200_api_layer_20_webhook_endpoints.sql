-- ============================================================================
-- 20260811120200_api_layer_20_webhook_endpoints.sql
--
-- api.webhook_endpoints — os endpoints de ENTRADA que o site expõe.
--
-- Uma linha aqui = uma URL pública:
--     POST https://marciorolim.com.br/api/hooks/<slug>
--
-- Um único Route Handler dinâmico do Next.js (app/api/hooks/[slug]/route.ts)
-- atende todos: ele carrega a linha pelo slug, valida assinatura/IP/tamanho,
-- consulta o rate limit e despacha conforme `action`. Adicionar integração
-- nova no n8n vira INSERT, não deploy.
--
-- ONDE FICA O SEGREDO DE HMAC
-- Diferente de api_keys, o segredo do webhook NÃO pode ser hasheado: para
-- conferir a assinatura o servidor precisa recomputar o HMAC, ou seja,
-- precisa do segredo em claro. Guardar texto puro numa coluna significa que
-- todo dump, backup e réplica de leitura carrega credencial ativa.
-- Por isso a tabela guarda apenas `signing_secret_id` — um ponteiro para o
-- Supabase Vault, onde o valor fica cifrado em repouso e só sai por
-- `vault.decrypted_secrets`, legível apenas pelo service_role.
--
--   -- criar (no servidor, com service_role)
--   select vault.create_secret(
--            encode(gen_random_bytes(32), 'hex'),
--            'webhook:blog-draft',
--            'HMAC do endpoint /api/hooks/blog-draft');
--   -- ler
--   select decrypted_secret from vault.decrypted_secrets where id = $1;
--
-- ROTAÇÃO SEM JANELA DE ERRO
-- `previous_signing_secret_id` + `previous_secret_valid_until` permitem aceitar
-- as duas assinaturas por algumas horas enquanto os cenários do n8n/Make são
-- atualizados um a um. Sem esse par, rotacionar derruba as automações.
-- ============================================================================

create table api.webhook_endpoints (
  id                          uuid        primary key default gen_random_uuid(),

  -- Identidade --------------------------------------------------------------
  -- O slug é o caminho da URL. Formato restrito porque ele entra em rota,
  -- log e nome de secret do Vault.
  slug                        text        not null,
  name                        text        not null,
  description                 text,

  -- Despacho ----------------------------------------------------------------
  -- Qual handler roda quando este endpoint recebe algo. Ver catálogo no
  -- arquivo 00.
  action                      text        not null,
  -- Parâmetros fixos do handler, ex.:
  --   {"default_category":"ia","author_id":"…","auto_publish":false}
  -- Permite dois endpoints com a mesma `action` e comportamentos distintos
  -- (um feed de IA e um feed de infra criando rascunhos em categorias
  -- diferentes) sem duplicar código.
  action_config               jsonb       not null default '{}'::jsonb,

  is_active                   boolean     not null default true,

  -- Autenticação da requisição ---------------------------------------------
  require_signature           boolean     not null default true,
  signing_secret_id           uuid,        -- vault.secrets(id)
  signature_header            text        not null default 'x-mr-signature',
  signature_algo              text        not null default 'hmac-sha256',
  -- Header com o unix timestamp assinado junto ao corpo. Sem ele, um payload
  -- assinado capturado uma vez pode ser reenviado para sempre.
  timestamp_header            text        not null default 'x-mr-timestamp',
  -- Janela de tolerância de replay.
  tolerance_seconds           integer     not null default 300,

  previous_signing_secret_id  uuid,
  previous_secret_valid_until timestamptz,
  secret_rotated_at           timestamptz,

  -- Exige também uma chave de api_keys, além da assinatura. Útil para
  -- endpoints que aceitam múltiplos parceiros e precisam saber quem é quem.
  require_api_key             boolean     not null default false,
  required_scope              text,

  allowed_ip_ranges           cidr[],

  -- Defesa de recurso -------------------------------------------------------
  max_payload_bytes           integer     not null default 1048576,   -- 1 MiB
  rate_limit_requests         integer     not null default 60,
  rate_limit_window_seconds   integer     not null default 60,

  -- Idempotência ------------------------------------------------------------
  -- Header de onde sai a chave de idempotência. n8n e Make reexecutam nós em
  -- caso de timeout; sem isso, um timeout de rede vira post duplicado.
  idempotency_header          text        not null default 'x-idempotency-key',
  require_idempotency_key     boolean     not null default false,

  -- Retenção (aplicada pelos jobs do arquivo 70) ----------------------------
  -- Por endpoint, porque o custo de guardar difere: `contact.message.create`
  -- carrega dado pessoal (LGPD, minimização) e deve perder o payload rápido;
  -- `analytics.event.ingest` é volumoso e descartável.
  retain_payload_days         integer     not null default 30,
  retain_event_days           integer     not null default 180,

  -- Auditoria ---------------------------------------------------------------
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  created_by                  uuid        references auth.users (id) on delete set null,
  last_event_at               timestamptz,

  metadata                    jsonb       not null default '{}'::jsonb,

  -- Constraints -------------------------------------------------------------
  constraint webhook_endpoints_slug_format_chk
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'),

  constraint webhook_endpoints_name_len_chk
    check (char_length(name) between 1 and 120),

  constraint webhook_endpoints_action_chk
    check (action in (
      'blog.post.draft.create',
      'blog.post.update',
      'blog.post.publish',
      'blog.post.unpublish',
      'media.asset.ingest',
      'analytics.event.ingest',
      'contact.message.create',
      'newsletter.subscriber.upsert',
      'noop.echo'
    )),

  constraint webhook_endpoints_signature_algo_chk
    check (signature_algo in ('hmac-sha256', 'hmac-sha512')),

  -- Coerência de configuração: exigir assinatura sem ter segredo cadastrado
  -- resultaria em endpoint que rejeita 100% do tráfego — falha silenciosa e
  -- confusa de diagnosticar às 2h da manhã.
  constraint webhook_endpoints_secret_required_chk
    check (not require_signature or signing_secret_id is not null),

  -- O mesmo para o par de rotação: os dois campos andam juntos.
  constraint webhook_endpoints_previous_secret_chk
    check (
      (previous_signing_secret_id is null and previous_secret_valid_until is null)
      or (previous_signing_secret_id is not null and previous_secret_valid_until is not null)
    ),

  constraint webhook_endpoints_require_api_key_chk
    check (require_api_key or required_scope is null),

  constraint webhook_endpoints_tolerance_chk
    check (tolerance_seconds between 30 and 3600),

  constraint webhook_endpoints_payload_size_chk
    check (max_payload_bytes between 1024 and 10485760),   -- 1 KiB .. 10 MiB

  constraint webhook_endpoints_rate_limit_chk
    check (
      rate_limit_requests between 1 and 100000
      and rate_limit_window_seconds between 1 and 86400
    ),

  -- Payload não pode sobreviver à própria linha de evento.
  constraint webhook_endpoints_retention_chk
    check (
      retain_payload_days between 0 and 3650
      and retain_event_days between 1 and 3650
      and retain_payload_days <= retain_event_days
    )
);

comment on table api.webhook_endpoints is
  'Endpoints de entrada expostos em /api/hooks/<slug>. Uma linha configura '
  'rota, autenticação, limites e ação — integração nova é INSERT, não deploy.';
comment on column api.webhook_endpoints.signing_secret_id is
  'Ponteiro para vault.secrets. O segredo HMAC nunca é gravado em claro nesta '
  'tabela porque a verificação exige o valor original.';

create trigger webhook_endpoints_set_updated_at
  before update on api.webhook_endpoints
  for each row execute function api.set_updated_at();


-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

-- (1) CAMINHO QUENTE — resolução da rota. Primeira query de toda requisição:
--       select * from api.webhook_endpoints where slug = $1 and is_active;
--     UNIQUE também garante a regra de negócio: um slug, uma rota.
--     (Este resultado é cacheável por alguns segundos em memória no Node; o
--     índice cobre o cache miss e o cold start.)
create unique index webhook_endpoints_slug_uidx
  on api.webhook_endpoints (slug);

-- (2) Listagem do painel e enumeração dos endpoints vivos pelo job de
--     manutenção. Parcial em is_active: endpoint desativado é histórico e não
--     deve pesar na tela principal.
create index webhook_endpoints_active_idx
  on api.webhook_endpoints (created_at desc)
  where is_active;

-- (3) Filtro "quais endpoints alimentam o blog?" no painel, e uso pelo job de
--     retenção, que agrupa por ação para aplicar políticas distintas.
create index webhook_endpoints_action_idx
  on api.webhook_endpoints (action);

-- (4) Job que encerra a janela de rotação e limpa o segredo antigo. Parcial:
--     em regime normal a tabela inteira está fora deste índice.
create index webhook_endpoints_rotation_window_idx
  on api.webhook_endpoints (previous_secret_valid_until)
  where previous_signing_secret_id is not null;


-- ----------------------------------------------------------------------------
-- RLS
--
-- Mesmo padrão de api_keys: leitura só para admin, escrita só via service_role.
-- Os grants de coluna omitem `signing_secret_id`, `previous_signing_secret_id`
-- e `action_config` — o painel não precisa nem do ponteiro do Vault (que
-- combinado com um vazamento do service_role encurtaria o caminho do atacante)
-- nem da config, que pode carregar ids internos.
-- ----------------------------------------------------------------------------
alter table api.webhook_endpoints enable row level security;

create policy webhook_endpoints_admin_select
  on api.webhook_endpoints
  for select
  to authenticated
  using ((select api.is_admin()));

revoke all on api.webhook_endpoints from anon, authenticated;

grant select (
  id, slug, name, description,
  action, is_active,
  require_signature, signature_header, signature_algo, timestamp_header,
  tolerance_seconds, secret_rotated_at, previous_secret_valid_until,
  require_api_key, required_scope, allowed_ip_ranges,
  max_payload_bytes, rate_limit_requests, rate_limit_window_seconds,
  idempotency_header, require_idempotency_key,
  retain_payload_days, retain_event_days,
  created_at, updated_at, created_by, last_event_at
) on api.webhook_endpoints to authenticated;


-- ----------------------------------------------------------------------------
-- api.rotate_endpoint_secret() — rotação com sobreposição.
--
-- Gera o segredo novo no Vault, empurra o atual para o slot "anterior" e
-- devolve o valor em claro UMA vez, para ser copiado no n8n/Make. Depois de
-- `p_overlap`, o job do arquivo 70 limpa o slot anterior.
--
-- SECURITY DEFINER porque precisa escrever no Vault; por isso a checagem de
-- admin vem antes de qualquer outra coisa.
-- ----------------------------------------------------------------------------
create or replace function api.rotate_endpoint_secret(
  p_endpoint_id uuid,
  p_overlap     interval default interval '48 hours'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug       text;
  v_current    uuid;
  v_new_secret text;
  v_new_id     uuid;
begin
  perform api.assert_admin();

  select slug, signing_secret_id
    into v_slug, v_current
    from api.webhook_endpoints
   where id = p_endpoint_id
   for update;

  if not found then
    raise exception 'endpoint % não encontrado', p_endpoint_id using errcode = 'P0002';
  end if;

  v_new_secret := encode(extensions.gen_random_bytes(32), 'hex');

  v_new_id := vault.create_secret(
    v_new_secret,
    'webhook:' || v_slug || ':' || to_char(now(), 'YYYYMMDDHH24MISS'),
    'Segredo HMAC do endpoint /api/hooks/' || v_slug
  );

  update api.webhook_endpoints
     set signing_secret_id           = v_new_id,
         previous_signing_secret_id  = v_current,
         previous_secret_valid_until = case
                                         when v_current is null then null
                                         else now() + p_overlap
                                       end,
         secret_rotated_at           = now()
   where id = p_endpoint_id;

  -- Retorno em claro: única oportunidade de copiar o valor.
  return v_new_secret;
end;
$$;

comment on function api.rotate_endpoint_secret(uuid, interval) is
  'Gera segredo HMAC novo no Vault mantendo o anterior válido por p_overlap, '
  'para atualizar os cenários do n8n/Make sem derrubar a integração.';

revoke all on function api.rotate_endpoint_secret(uuid, interval) from public;
grant execute on function api.rotate_endpoint_secret(uuid, interval)
  to authenticated, service_role;
