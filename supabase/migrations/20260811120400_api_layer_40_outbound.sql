-- ============================================================================
-- 20260811120400_api_layer_40_outbound.sql
--
-- Webhooks de SAÍDA: o site avisa terceiros (um cenário no Make, um canal no
-- Discord, um índice de busca) quando algo acontece — post publicado,
-- mensagem de contato recebida, rollup diário fechado.
--
-- POR QUE TRÊS TABELAS E NÃO DUAS
-- O pedido era `outbound_subscriptions` + `outbound_deliveries`. A entrega
-- porém tem duas naturezas conflitantes no mesmo registro:
--   - estado MUTÁVEL: em que tentativa está, quando tentar de novo, acabou?
--   - histórico IMUTÁVEL: o que o servidor remoto respondeu na tentativa 3?
-- Juntar os dois numa linha só dá uma de duas perdas: ou cada retry sobrescreve
-- a resposta anterior (some o diagnóstico justamente do caso interessante), ou
-- a linha vira log e a fila passa a precisar de "última tentativa por entrega"
-- — um DISTINCT ON em cada ciclo do worker.
-- Então:
--   outbound_deliveries        = fila + estado atual (tem attempt, status,
--                                response_status e next_attempt_at, como pedido)
--   outbound_delivery_attempts = log append-only, uma linha por tentativa
-- Se preferir estritamente duas tabelas, basta não criar a terceira: nada
-- depende dela, e o custo é perder o histórico por tentativa.
-- ============================================================================


-- ============================================================================
-- api.outbound_subscriptions — quem quer ser avisado do quê.
-- ============================================================================
create table api.outbound_subscriptions (
  id                    uuid        primary key default gen_random_uuid(),

  name                  text        not null,
  description           text,
  target_url            text        not null,

  -- Quais eventos disparam esta assinatura (catálogo no arquivo 00).
  event_types           text[]      not null,

  is_active             boolean     not null default true,

  -- Assinatura de saída: o destino confere que a chamada veio mesmo daqui.
  -- Mesmo raciocínio dos endpoints de entrada — precisa do valor em claro para
  -- assinar, logo vive no Vault, não em coluna.
  signing_secret_id     uuid,
  signature_header      text        not null default 'x-mr-signature',

  -- Headers estáticos extras (ex.: {"x-make-apikey":"…"}). Documentado como
  -- não-secreto; credencial de terceiro também deveria ir para o Vault.
  custom_headers        jsonb       not null default '{}'::jsonb,

  -- Política de retry, por assinatura: um webhook para o Discord pode desistir
  -- rápido; um que alimenta faturamento, não.
  max_attempts          integer     not null default 6,
  timeout_ms            integer     not null default 10000,
  backoff_base_seconds  integer     not null default 30,   -- 30s,1m,2m,4m,8m,16m
  backoff_max_seconds   integer     not null default 3600,

  -- Circuit breaker. Endpoint de parceiro que morreu não pode gerar fila
  -- infinita: depois de N falhas seguidas a assinatura se auto-desativa.
  consecutive_failures  integer     not null default 0,
  failure_threshold     integer     not null default 20,
  disabled_at           timestamptz,
  disabled_reason       text,

  last_success_at       timestamptz,
  last_failure_at       timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid        references auth.users (id) on delete set null,
  metadata              jsonb       not null default '{}'::jsonb,

  constraint outbound_subs_name_len_chk
    check (char_length(name) between 1 and 120),

  -- Só HTTPS. Webhook em http:// entrega o payload assinado em texto claro.
  constraint outbound_subs_https_chk
    check (target_url ~* '^https://[a-z0-9]'),
  constraint outbound_subs_url_len_chk
    check (char_length(target_url) between 12 and 2048),

  constraint outbound_subs_event_types_chk
    check (
      cardinality(event_types) between 1 and 32
      and event_types <@ array[
        'post.published', 'post.updated', 'post.unpublished',
        'contact.received', 'analytics.daily_rollup'
      ]::text[]
    ),

  constraint outbound_subs_retry_chk
    check (
      max_attempts between 1 and 20
      and timeout_ms between 1000 and 60000
      and backoff_base_seconds between 1 and 3600
      and backoff_max_seconds between backoff_base_seconds and 86400
      and failure_threshold between 1 and 1000
      and consecutive_failures >= 0
    ),

  constraint outbound_subs_disabled_chk
    check (disabled_at is not null or disabled_reason is null)
);

comment on table api.outbound_subscriptions is
  'Assinantes externos dos eventos do site. Auto-desativa após '
  'failure_threshold falhas seguidas para não acumular fila contra um destino '
  'morto.';

create trigger outbound_subs_set_updated_at
  before update on api.outbound_subscriptions
  for each row execute function api.set_updated_at();

-- Índices ---------------------------------------------------------------

-- (1) FAN-OUT — a query executada toda vez que um post é publicado:
--       select id, target_url, ... from api.outbound_subscriptions
--        where is_active and event_types @> array['post.published'];
--     GIN é o índice certo para o operador de contenção em array (@>), e o
--     parcial em is_active mantém fora as assinaturas desligadas.
--     HONESTIDADE SOBRE ESTE ÍNDICE: com poucas dezenas de assinaturas o
--     planner vai preferir Seq Scan, e está certo — foi o que aconteceu ao
--     medir com 50 linhas. O índice é barato (a tabela quase não recebe
--     escrita) e passa a ser usado sozinho quando a tabela crescer; se o
--     projeto se estabilizar em meia dúzia de assinantes, dá para removê-lo
--     sem perda nenhuma.
create index outbound_subs_event_types_gin
  on api.outbound_subscriptions using gin (event_types)
  where is_active;

-- (2) Listagem do painel.
create index outbound_subs_created_idx
  on api.outbound_subscriptions (created_at desc);

-- (3) Alerta "assinaturas em sofrimento" no dashboard. Parcial: em regime
--     normal o índice está vazio.
create index outbound_subs_failing_idx
  on api.outbound_subscriptions (consecutive_failures desc)
  where consecutive_failures > 0;

-- RLS -------------------------------------------------------------------
alter table api.outbound_subscriptions enable row level security;

create policy outbound_subs_admin_select
  on api.outbound_subscriptions
  for select
  to authenticated
  using ((select api.is_admin()));

revoke all on api.outbound_subscriptions from anon, authenticated;

grant select (
  id, name, description, target_url, event_types, is_active,
  signature_header,
  max_attempts, timeout_ms, backoff_base_seconds, backoff_max_seconds,
  consecutive_failures, failure_threshold, disabled_at, disabled_reason,
  last_success_at, last_failure_at,
  created_at, updated_at, created_by
) on api.outbound_subscriptions to authenticated;
-- signing_secret_id e custom_headers ficam fora de propósito.


-- ============================================================================
-- api.outbound_deliveries — a fila. Uma linha por (assinatura, evento).
-- ============================================================================
create table api.outbound_deliveries (
  -- uuid aqui, e não identity, porque este id vai no header X-MR-Delivery-Id
  -- e é a chave de idempotência DO LADO DE LÁ: o destino usa para descartar
  -- reentrega. Sequencial exposto contaria volume para terceiros.
  id                uuid        primary key default gen_random_uuid(),

  subscription_id   uuid        not null
                                references api.outbound_subscriptions (id)
                                on delete cascade,

  event_type        text        not null,
  -- Origem do evento no domínio (id do post, do contato…). Junto com
  -- subscription_id + event_type forma a chave anti-duplicidade do fan-out.
  event_id          uuid,
  -- Elo com o webhook de entrada que originou isto, quando houver — fecha o
  -- rastro n8n -> site -> terceiro numa consulta só.
  source_event_id   bigint      references api.inbound_events (id) on delete set null,

  -- Snapshot do corpo. Congelado no momento do enfileiramento: uma reentrega
  -- feita amanhã tem que mandar o que o assinante deveria ter recebido hoje,
  -- não o estado atual do post.
  payload           jsonb       not null,
  target_url        text        not null,   -- snapshot: a URL pode mudar depois

  -- Estado ------------------------------------------------------------------
  status            text        not null default 'pending',
  attempt           integer     not null default 0,
  max_attempts      integer     not null default 6,   -- snapshot da assinatura

  -- Resultado da ÚLTIMA tentativa (o histórico completo fica em
  -- outbound_delivery_attempts).
  response_status   integer,
  response_body     text,
  duration_ms       integer,
  error_message     text,

  -- Agendamento -------------------------------------------------------------
  scheduled_at      timestamptz not null default now(),
  next_attempt_at   timestamptz not null default now(),
  last_attempt_at   timestamptz,
  completed_at      timestamptz,

  -- Lock do worker. Route Handler em serverless pode ser morto no meio da
  -- entrega; `locked_until` é o visibility timeout que devolve o item para a
  -- fila se o worker sumir sem finalizar.
  locked_at         timestamptz,
  locked_until      timestamptz,
  locked_by         text,

  created_at        timestamptz not null default now(),

  constraint outbound_deliveries_status_chk
    check (status in (
      'pending',    -- na fila, aguardando next_attempt_at
      'in_flight',  -- worker segurando o lock, requisição em curso
      'succeeded',  -- 2xx
      'failed',     -- erro, ainda dentro de max_attempts -> volta para a fila
      'exhausted',  -- estourou max_attempts, desistiu
      'canceled'    -- cancelada manualmente ou assinatura desativada
    )),

  constraint outbound_deliveries_attempt_chk
    check (attempt >= 0 and attempt <= max_attempts and max_attempts between 1 and 20),

  constraint outbound_deliveries_http_status_chk
    check (response_status is null or response_status between 100 and 599),

  -- Corpo da resposta é para diagnóstico, não para arquivo: guardar 4 KB de
  -- uma página de erro HTML é o suficiente para entender o problema. Truncar
  -- na aplicação; a constraint é a rede de segurança.
  constraint outbound_deliveries_body_len_chk
    check (response_body is null or char_length(response_body) <= 4096),

  constraint outbound_deliveries_duration_chk
    check (duration_ms is null or duration_ms >= 0),

  constraint outbound_deliveries_terminal_chk
    check ((status in ('succeeded', 'exhausted', 'canceled')) = (completed_at is not null)),

  constraint outbound_deliveries_lock_chk
    check ((locked_at is null) = (locked_until is null)),

  constraint outbound_deliveries_https_chk
    check (target_url ~* '^https://[a-z0-9]')
);

comment on table api.outbound_deliveries is
  'Fila de entregas de saída: um item por (assinatura, evento), com estado '
  'atual e agendamento do próximo retry.';
comment on column api.outbound_deliveries.payload is
  'Congelado no enfileiramento — reentrega manda o corpo original, não o '
  'estado atual da entidade.';

-- Índices ---------------------------------------------------------------

-- (1) O ÍNDICE MAIS QUENTE DESTE ARQUIVO — a claim query do worker, que roda a
--     cada poucos segundos:
--       select id from api.outbound_deliveries
--        where status in ('pending','failed') and next_attempt_at <= now()
--        order by next_attempt_at
--        limit 20
--        for update skip locked;
--     Parcial nos dois estados enfileiráveis: entregas concluídas — que são
--     ~100% da tabela em regime saudável — não aparecem aqui. O índice tende a
--     ficar do tamanho da fila real (dezenas de linhas), não da tabela.
create index outbound_deliveries_due_idx
  on api.outbound_deliveries (next_attempt_at, id)
  where status in ('pending', 'failed');

-- (2) ANTI-DUPLICIDADE DO FAN-OUT. Publicar o mesmo post duas vezes (retry do
--     Server Action, duplo clique, replay de webhook) não pode gerar duas
--     entregas para o mesmo assinante. Parcial porque nem todo evento tem
--     entidade associada (ex.: analytics.daily_rollup).
--       insert into api.outbound_deliveries (...)
--       on conflict (subscription_id, event_type, event_id)
--         where event_id is not null
--       do nothing;
create unique index outbound_deliveries_dedupe_uidx
  on api.outbound_deliveries (subscription_id, event_type, event_id)
  where event_id is not null;

-- (3) Tela "entregas desta assinatura", com paginação keyset por
--     (created_at desc, id desc).
create index outbound_deliveries_subscription_idx
  on api.outbound_deliveries (subscription_id, created_at desc, id desc);

-- (4) Painel de problemas + reenvio manual em lote. Parcial e pequeno.
create index outbound_deliveries_dead_idx
  on api.outbound_deliveries (completed_at desc)
  where status = 'exhausted';

-- (5) Recuperação de lock órfão: worker morto no meio deixa 'in_flight' com
--     locked_until vencido. Um job devolve esses itens para 'failed'.
create index outbound_deliveries_stale_lock_idx
  on api.outbound_deliveries (locked_until)
  where status = 'in_flight';

-- (6) Rastro reverso: "o webhook de entrada #123 disparou quais entregas?".
create index outbound_deliveries_source_event_idx
  on api.outbound_deliveries (source_event_id)
  where source_event_id is not null;

-- RLS -------------------------------------------------------------------
alter table api.outbound_deliveries enable row level security;

create policy outbound_deliveries_admin_select
  on api.outbound_deliveries
  for select
  to authenticated
  using ((select api.is_admin()));

revoke all on api.outbound_deliveries from anon, authenticated;

grant select (
  id, subscription_id, event_type, event_id, source_event_id,
  target_url, status, attempt, max_attempts,
  response_status, duration_ms, error_message,
  scheduled_at, next_attempt_at, last_attempt_at, completed_at, created_at
) on api.outbound_deliveries to authenticated;
-- payload e response_body só via RPC de detalhe (arquivo 60).


-- ============================================================================
-- api.outbound_delivery_attempts — log append-only, uma linha por tentativa.
-- (Opcional: ver a nota do cabeçalho.)
-- ============================================================================
create table api.outbound_delivery_attempts (
  id               bigint      generated always as identity primary key,
  delivery_id      uuid        not null
                               references api.outbound_deliveries (id)
                               on delete cascade,

  attempt          integer     not null,
  status           text        not null,
  response_status  integer,
  response_headers jsonb,
  response_body    text,
  duration_ms      integer,
  error_message    text,

  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  next_attempt_at  timestamptz,   -- o que foi agendado APÓS esta tentativa

  constraint outbound_attempts_status_chk
    check (status in ('succeeded', 'failed', 'timeout', 'network_error')),
  constraint outbound_attempts_attempt_chk
    check (attempt between 1 and 20),
  constraint outbound_attempts_http_status_chk
    check (response_status is null or response_status between 100 and 599),
  constraint outbound_attempts_body_len_chk
    check (response_body is null or char_length(response_body) <= 4096),
  constraint outbound_attempts_duration_chk
    check (duration_ms is null or duration_ms >= 0)
);

comment on table api.outbound_delivery_attempts is
  'Histórico imutável por tentativa. Responde "o que o servidor remoto devolveu '
  'na 3ª tentativa?" — pergunta que a linha mutável da fila não consegue '
  'responder.';

-- (1) Timeline de uma entrega na tela de detalhe. UNIQUE de quebra: barra
--     gravação dupla da mesma tentativa quando o worker é reexecutado.
create unique index outbound_attempts_delivery_uidx
  on api.outbound_delivery_attempts (delivery_id, attempt);

-- (2) Retenção e gráfico de latência/erro por período no dashboard.
create index outbound_attempts_started_idx
  on api.outbound_delivery_attempts (started_at desc);

alter table api.outbound_delivery_attempts enable row level security;

create policy outbound_attempts_admin_select
  on api.outbound_delivery_attempts
  for select
  to authenticated
  using ((select api.is_admin()));

revoke all on api.outbound_delivery_attempts from anon, authenticated;

grant select (
  id, delivery_id, attempt, status, response_status, duration_ms,
  error_message, started_at, finished_at, next_attempt_at
) on api.outbound_delivery_attempts to authenticated;


-- ----------------------------------------------------------------------------
-- api.claim_outbound_deliveries() — o worker pega o próximo lote.
--
-- `FOR UPDATE SKIP LOCKED` é o que permite rodar várias instâncias do cron da
-- Vercel em paralelo sem entregar o mesmo webhook duas vezes: cada transação
-- pula as linhas já travadas por outra em vez de esperar por elas.
-- `locked_until` cobre o caso em que a função serverless é morta depois do
-- COMMIT do claim e antes de reportar o resultado.
-- ----------------------------------------------------------------------------
create or replace function api.claim_outbound_deliveries(
  p_limit           integer default 20,
  p_worker          text    default 'vercel-cron',
  p_lock_seconds    integer default 120
)
returns setof api.outbound_deliveries
language sql
security definer
set search_path = ''
as $$
  with due as (
    select d.id
      from api.outbound_deliveries d
     where d.status in ('pending', 'failed')
       and d.next_attempt_at <= now()
     order by d.next_attempt_at
     limit p_limit
     for update skip locked
  )
  update api.outbound_deliveries d
     set status       = 'in_flight',
         attempt      = d.attempt + 1,
         locked_at    = now(),
         locked_until = now() + make_interval(secs => p_lock_seconds),
         locked_by    = p_worker,
         last_attempt_at = now()
    from due
   where d.id = due.id
  returning d.*;
$$;

revoke all on function api.claim_outbound_deliveries(integer, text, integer) from public;
grant execute on function api.claim_outbound_deliveries(integer, text, integer) to service_role;


-- ----------------------------------------------------------------------------
-- api.record_outbound_attempt() — resultado de uma tentativa.
--
-- Concentra em um lugar só: gravar o histórico, decidir retry x desistência,
-- calcular o backoff exponencial e mexer no circuit breaker da assinatura.
-- Espalhar essa lógica pelo TypeScript é como surgem filas que reentregam para
-- sempre.
-- ----------------------------------------------------------------------------
create or replace function api.record_outbound_attempt(
  p_delivery_id     uuid,
  p_ok              boolean,
  p_response_status integer default null,
  p_response_body   text    default null,
  p_duration_ms     integer default null,
  p_error_message   text    default null,
  p_attempt_status  text    default null   -- failed | timeout | network_error
)
returns text                                -- status final da entrega
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery   api.outbound_deliveries;
  v_sub        api.outbound_subscriptions;
  v_next_at    timestamptz;
  v_new_status text;
  v_backoff    integer;
begin
  select * into v_delivery from api.outbound_deliveries where id = p_delivery_id for update;
  if not found then
    raise exception 'entrega % não encontrada', p_delivery_id using errcode = 'P0002';
  end if;

  select * into v_sub from api.outbound_subscriptions where id = v_delivery.subscription_id;

  if p_ok then
    v_new_status := 'succeeded';
    v_next_at    := null;
  elsif v_delivery.attempt >= v_delivery.max_attempts then
    v_new_status := 'exhausted';
    v_next_at    := null;
  else
    v_new_status := 'failed';
    -- Backoff exponencial com teto: 30s, 1m, 2m, 4m, 8m, ... até
    -- backoff_max_seconds. O jitter (+/- 10%) evita que uma rajada de
    -- entregas que falharam juntas volte toda no mesmo instante e derrube o
    -- destino de novo assim que ele se recuperar.
    v_backoff := least(
      coalesce(v_sub.backoff_base_seconds, 30) * power(2, greatest(v_delivery.attempt - 1, 0))::integer,
      coalesce(v_sub.backoff_max_seconds, 3600)
    );
    v_next_at := now() + make_interval(secs => (v_backoff * (0.9 + random() * 0.2))::integer);
  end if;

  insert into api.outbound_delivery_attempts (
    delivery_id, attempt, status, response_status, response_body,
    duration_ms, error_message, finished_at, next_attempt_at
  )
  values (
    p_delivery_id, v_delivery.attempt,
    case when p_ok then 'succeeded' else coalesce(p_attempt_status, 'failed') end,
    p_response_status, left(p_response_body, 4096),
    p_duration_ms, left(p_error_message, 2000), now(), v_next_at
  )
  on conflict (delivery_id, attempt) do nothing;   -- worker reexecutado

  update api.outbound_deliveries
     set status          = v_new_status,
         response_status = p_response_status,
         response_body   = left(p_response_body, 4096),
         duration_ms     = p_duration_ms,
         error_message   = left(p_error_message, 2000),
         next_attempt_at = coalesce(v_next_at, next_attempt_at),
         completed_at    = case when v_new_status in ('succeeded', 'exhausted')
                                then now() end,
         locked_at       = null,
         locked_until    = null,
         locked_by       = null
   where id = p_delivery_id;

  -- Circuit breaker da assinatura.
  if p_ok then
    update api.outbound_subscriptions
       set consecutive_failures = 0,
           last_success_at      = now()
     where id = v_delivery.subscription_id;
  else
    update api.outbound_subscriptions
       set consecutive_failures = consecutive_failures + 1,
           last_failure_at      = now(),
           is_active       = case when consecutive_failures + 1 >= failure_threshold
                                  then false else is_active end,
           disabled_at     = case when consecutive_failures + 1 >= failure_threshold
                                  then coalesce(disabled_at, now()) else disabled_at end,
           disabled_reason = case when consecutive_failures + 1 >= failure_threshold
                                  then coalesce(disabled_reason,
                                                'auto: ' || (consecutive_failures + 1) ||
                                                ' falhas consecutivas')
                                  else disabled_reason end
     where id = v_delivery.subscription_id;
  end if;

  return v_new_status;
end;
$$;

revoke all on function api.record_outbound_attempt(uuid, boolean, integer, text, integer, text, text) from public;
grant execute on function api.record_outbound_attempt(uuid, boolean, integer, text, integer, text, text) to service_role;
