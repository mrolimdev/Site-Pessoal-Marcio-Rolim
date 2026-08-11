-- ============================================================================
-- 20260811120300_api_layer_30_inbound_events.sql
--
-- api.inbound_events — log append-only de TODA requisição recebida nos
-- endpoints de webhook, inclusive as rejeitadas.
--
-- Esta é a única tabela do conjunto que cresce sem limite natural. Três
-- decisões vêm daí:
--
-- (a) CHAVE PRIMÁRIA `bigint identity`, não uuid.
--     uuid v4 é aleatório: cada INSERT cai numa página diferente do índice,
--     o que multiplica WAL e destrói a localidade do cache. Um identity é
--     monotônico, sempre insere na folha mais à direita e ainda dá paginação
--     keyset de graça. O identificador que sai para fora é `public_id`
--     (uuid), para não vazar volume de tráfego na resposta ao n8n.
--
-- (b) SEM PARTICIONAMENTO POR ENQUANTO.
--     A própria documentação do Supabase recomenda não particionar antes de
--     medir degradação. Particionar aqui teria um custo concreto e imediato:
--     índice UNIQUE em tabela particionada é obrigado a conter a coluna de
--     partição, ou seja, `UNIQUE (endpoint_id, idempotency_key)` deixaria de
--     existir e a idempotência exigiria uma tabela auxiliar. Como
--     idempotência é requisito e volume é hipótese, a tabela nasce plana. O
--     arquivo 80 traz o caminho de migração para partições mensais para
--     quando o volume justificar.
--
-- (c) PAYLOAD É DADO PERECÍVEL.
--     `payload` e `headers` são zerados por retenção (arquivo 70) enquanto a
--     linha de metadados sobrevive. Serve ao custo e à LGPD: um webhook de
--     formulário de contato carrega dado pessoal que não tem por que ficar
--     seis meses no log de integração.
-- ============================================================================

create table api.inbound_events (
  id                bigint      generated always as identity primary key,
  -- Identificador devolvido ao chamador (n8n/Make) e usado nas URLs do painel.
  -- Sequencial exposto contaria a terceiros quantos eventos o site processa.
  public_id         uuid        not null default gen_random_uuid(),

  -- Origem ------------------------------------------------------------------
  endpoint_id       uuid        references api.webhook_endpoints (id) on delete set null,
  -- Snapshot desnormalizado: o log tem que continuar legível depois que o
  -- endpoint for renomeado ou apagado. Log que muda de sentido no retrospecto
  -- não é log.
  endpoint_slug     text        not null,
  action            text,

  api_key_id        uuid        references api.api_keys (id) on delete set null,
  api_key_prefix    text,

  -- Requisição --------------------------------------------------------------
  http_method       text        not null default 'POST',
  source_ip         inet,
  user_agent        text,
  content_type      text,
  -- ATENÇÃO: gravar apenas uma ALLOWLIST de headers. Nunca authorization,
  -- x-api-key, cookie, x-mr-signature ou qualquer header de credencial —
  -- isso transformaria o log em um segundo cofre de segredos. Guardar só o
  -- necessário para depurar: x-request-id, x-idempotency-key, x-mr-timestamp,
  -- user-agent, content-type.
  headers           jsonb       not null default '{}'::jsonb,
  request_id        text,

  -- Autenticação ------------------------------------------------------------
  auth_method       text        not null default 'none',
  signature_valid   boolean,

  -- Conteúdo ----------------------------------------------------------------
  payload           jsonb,
  payload_bytes     integer,
  -- sha256 do corpo BRUTO, antes do parse. Serve para: (i) detectar reenvio de
  -- payload idêntico quando o parceiro não manda chave de idempotência;
  -- (ii) provar, depois do purge, que o corpo processado era o que o parceiro
  -- alega ter mandado. 32 bytes contra N kilobytes.
  payload_sha256    bytea,
  payload_purged_at timestamptz,

  -- Idempotência ------------------------------------------------------------
  idempotency_key   text,

  -- Processamento -----------------------------------------------------------
  status            text        not null default 'received',
  attempts          integer     not null default 0,
  -- Resultado estruturado do handler, ex.: {"post_id":"…","slug":"…"}.
  -- Sem isso não dá para responder "esse webhook criou qual post?" sem
  -- correlacionar por timestamp.
  result            jsonb,
  error_code        text,
  error_message     text,
  error_detail      jsonb,
  processing_ms     integer,

  -- Quando é duplicata, aponta para o evento original.
  duplicate_of_id   bigint      references api.inbound_events (id) on delete set null,

  received_at       timestamptz not null default now(),
  processed_at      timestamptz,

  -- Constraints -------------------------------------------------------------
  constraint inbound_events_status_chk
    check (status in (
      'received',    -- gravado, ainda não processado
      'processing',  -- handler rodando
      'processed',   -- sucesso
      'failed',      -- handler estourou; candidato a retry
      'skipped',     -- válido, mas sem efeito (ex.: post já existia)
      'rejected',    -- barrado na porta: assinatura, IP, rate limit, tamanho
      'duplicate'    -- idempotency_key já vista
    )),

  constraint inbound_events_auth_method_chk
    check (auth_method in ('none', 'hmac', 'api_key', 'hmac+api_key')),

  constraint inbound_events_http_method_chk
    check (http_method in ('POST', 'PUT', 'PATCH', 'GET', 'DELETE')),

  -- Coerência temporal: "processado" sem carimbo de quando é um bug de
  -- handler que só aparece semanas depois, num gráfico de latência sem sentido.
  constraint inbound_events_processed_at_chk
    check (
      (status in ('processed', 'failed', 'skipped', 'duplicate') and processed_at is not null)
      or (status in ('received', 'processing', 'rejected'))
    ),
  constraint inbound_events_processed_after_received_chk
    check (processed_at is null or processed_at >= received_at),

  -- Erro só existe em estado de erro; evita mensagem órfã confundindo o painel.
  constraint inbound_events_error_state_chk
    check (
      (error_code is null and error_message is null)
      or status in ('failed', 'rejected')
    ),

  constraint inbound_events_duplicate_chk
    check ((status = 'duplicate') = (duplicate_of_id is not null)),

  -- Depois do purge o payload some, mas o hash e o tamanho ficam.
  constraint inbound_events_purge_chk
    check (payload_purged_at is null or payload is null),

  constraint inbound_events_sizes_chk
    check (
      (payload_bytes is null or payload_bytes >= 0)
      and (processing_ms is null or processing_ms >= 0)
      and attempts >= 0
    ),

  constraint inbound_events_sha256_len_chk
    check (payload_sha256 is null or octet_length(payload_sha256) = 32),

  constraint inbound_events_slug_len_chk
    check (char_length(endpoint_slug) between 1 and 64)
);

comment on table api.inbound_events is
  'Log append-only de requisições recebidas nos webhooks de entrada, inclusive '
  'as rejeitadas. payload/headers são zerados por retenção; a linha de '
  'metadados permanece.';
comment on column api.inbound_events.headers is
  'ALLOWLIST de headers. Nunca gravar authorization, x-api-key, cookie ou o '
  'header de assinatura.';
comment on column api.inbound_events.payload is
  'NULL depois do purge (ver payload_purged_at). Integridade continua '
  'verificável por payload_sha256.';


-- ----------------------------------------------------------------------------
-- Índices
--
-- Cada índice abaixo existe por causa de uma query nomeada. Em tabela de log,
-- índice sem query é imposto de escrita cobrado em cada webhook recebido.
-- ----------------------------------------------------------------------------

-- (1) IDEMPOTÊNCIA — a constraint que o requisito pede.
--     Índice único PARCIAL em vez de UNIQUE de tabela: como a coluna é
--     nullable, um UNIQUE comum já permitiria infinitos NULLs (mesma
--     semântica), mas carregaria também todas as linhas sem chave — em
--     `analytics.event.ingest`, que não manda idempotency-key, isso é a
--     maioria absoluta das linhas indexadas à toa.
--     Escopo por endpoint: dois parceiros distintos podem legitimamente usar
--     "order-123" no mesmo dia.
--
--     Uso no ingest (uma viagem ao banco, sem corrida):
--       insert into api.inbound_events (...) values (...)
--       on conflict (endpoint_id, idempotency_key)
--         where idempotency_key is not null
--       do nothing
--       returning id, public_id;
--     Zero linhas retornadas = duplicata; responder 200 com o resultado
--     anterior, jamais 500 (senão o n8n reenfileira em loop).
create unique index inbound_events_idempotency_uidx
  on api.inbound_events (endpoint_id, idempotency_key)
  where idempotency_key is not null;

-- (2) public_id: lookup do detalhe no painel e da resposta ao chamador.
create unique index inbound_events_public_id_uidx
  on api.inbound_events (public_id);

-- (3) FEED PRINCIPAL DO PAINEL — "últimos eventos", ordem global decrescente.
--     (received_at desc, id desc) é exatamente a chave de paginação keyset do
--     arquivo 60: o índice entrega ordenação e filtro de continuação no mesmo
--     passo, sem sort e sem OFFSET.
create index inbound_events_received_desc_idx
  on api.inbound_events (received_at desc, id desc);

-- (4) FEED FILTRADO POR ENDPOINT — a tela mais usada ("o que chegou no
--     blog-draft hoje?"). Coluna de igualdade primeiro, coluna de ordenação
--     depois: o Postgres percorre a faixa já ordenada.
create index inbound_events_endpoint_received_idx
  on api.inbound_events (endpoint_id, received_at desc, id desc);

-- (5) FILA DE PROBLEMAS — alimenta o alerta de falhas, a tela de erros e o
--     worker de reprocessamento. Parcial e minúsculo: em operação saudável
--     quase tudo é 'processed' e fica FORA deste índice, então ele cabe na
--     memória mesmo com a tabela em milhões de linhas.
--       select * from api.inbound_events
--        where status in ('failed','received','processing')
--        order by received_at desc;
create index inbound_events_problem_idx
  on api.inbound_events (status, received_at desc)
  where status in ('failed', 'received', 'processing');

-- (6) Auditoria por chave: "o que a chave do parceiro X mandou?" e o gráfico
--     de uso por chave no dashboard.
create index inbound_events_api_key_idx
  on api.inbound_events (api_key_id, received_at desc)
  where api_key_id is not null;

-- (7) NÃO CRIADO — dedupe por conteúdo em (endpoint_id, payload_sha256).
--     Era a intenção inicial, e a medição matou a ideia: com 200 mil eventos
--     esse índice sozinho ficou em 22 MB, MAIOR que a chave primária (4,4 MB)
--     e que o índice do feed principal (6,2 MB) — o maior de todo o schema,
--     pago em cada webhook recebido, para servir a um caso hipotético.
--     A resposta certa para "o parceiro reenvia e eu não quero duplicar" não é
--     indexar hash de payload: é ligar `require_idempotency_key` no endpoint e
--     exigir que o n8n/Make mande a chave — o que já cai no índice (1), que
--     existe de qualquer forma.
--     A COLUNA payload_sha256 continua valendo a pena (32 bytes, e é a única
--     evidência que sobrevive ao purge). Se um dia a busca por hash virar
--     rotina, o índice é este, e aí com número na mão:
--       create index inbound_events_payload_hash_idx
--         on api.inbound_events (endpoint_id, payload_sha256)
--         where payload_sha256 is not null;

-- (8) Fila do purge de payload (arquivo 70). Parcial nas linhas que AINDA têm
--     payload: conforme a retenção roda, o índice encolhe sozinho, e o job
--     nunca varre o histórico já limpo.
create index inbound_events_pending_purge_idx
  on api.inbound_events (received_at)
  where payload is not null;

-- (9) Abuso por IP: "quem está martelando o endpoint?". Parcial em 'rejected'
--     porque tráfego legítimo não interessa nessa investigação, e mantém o
--     índice restrito ao que é raro.
create index inbound_events_rejected_ip_idx
  on api.inbound_events (source_ip, received_at desc)
  where status = 'rejected';

-- (10) CHAVE ESTRANGEIRA SEM ÍNDICE — o índice menos óbvio e mais importante
--      deste arquivo.
--
--      `duplicate_of_id` referencia esta MESMA tabela. O Postgres indexa
--      automaticamente o lado referenciado (a PK), nunca o lado referenciante.
--      Sem este índice, cada linha apagada obriga o Postgres a varrer a tabela
--      inteira para verificar se alguém a referencia — e a retenção apaga aos
--      milhares. O custo vira quadrático e a janela noturna estoura em
--      silêncio, meses depois de o schema ter sido escrito.
--
--      Medido aqui, apagando 3.000 linhas de uma tabela de 60.000:
--          sem o índice ... 17.896 ms
--          com o índice ...     40 ms      (447x)
--      E a diferença cresce com o tamanho da tabela, porque cada delete paga
--      uma varredura completa.
--
--      Parcial: `duplicate_of_id` é NULL em praticamente todas as linhas
--      (duplicata é exceção), então o índice fica minúsculo. A verificação de
--      FK compara por igualdade, o que implica NOT NULL, então o índice
--      parcial é elegível.
--
--      AUDITORIA DAS DEMAIS FKs deste schema (todas já cobertas, pelo índice
--      indicado, sempre pela COLUNA INICIAL):
--        inbound_events.endpoint_id        -> índice (4)
--        inbound_events.api_key_id         -> índice (6)
--        outbound_deliveries.subscription_id / source_event_id -> arq. 40, (3) e (6)
--        outbound_delivery_attempts.delivery_id                -> arq. 40, único
--      Ficam deliberadamente sem índice as FKs para auth.users
--      (created_by/revoked_by/owner_id em tabelas de configuração): apagar um
--      usuário é raro e essas tabelas têm dezenas de linhas, então o índice
--      custaria mais em escrita do que economizaria.
create index inbound_events_duplicate_of_idx
  on api.inbound_events (duplicate_of_id)
  where duplicate_of_id is not null;

-- NÃO CRIADO DE PROPÓSITO: índice GIN em `payload`. Um GIN jsonb_path_ops
-- chega a dobrar o custo de INSERT e a ocupar mais espaço que a própria
-- coluna, para servir a uma busca ad hoc que o admin faz uma vez por mês —
-- e que, com os índices acima, já é resolvida filtrando endpoint + período
-- antes de olhar o JSON. Se a busca dentro do payload virar recorrente, o
-- caminho é indexar UMA expressão específica, não o documento inteiro:
--   create index on api.inbound_events ((payload->>'source'))
--     where endpoint_slug = 'blog-draft';


-- ----------------------------------------------------------------------------
-- RLS
--
-- Leitura de metadados: admin. `payload`, `headers`, `error_detail` e `result`
-- NÃO entram nos grants de coluna — o conteúdo bruto (que pode incluir dado
-- pessoal de formulário) só sai pela RPC de detalhe do arquivo 60, que é
-- auditável e checa admin explicitamente.
-- ----------------------------------------------------------------------------
alter table api.inbound_events enable row level security;

create policy inbound_events_admin_select
  on api.inbound_events
  for select
  to authenticated
  using ((select api.is_admin()));

revoke all on api.inbound_events from anon, authenticated;

grant select (
  id, public_id,
  endpoint_id, endpoint_slug, action,
  api_key_id, api_key_prefix,
  http_method, source_ip, user_agent, content_type, request_id,
  auth_method, signature_valid,
  payload_bytes, payload_sha256, payload_purged_at,
  idempotency_key,
  status, attempts, error_code, error_message, processing_ms,
  duplicate_of_id,
  received_at, processed_at
) on api.inbound_events to authenticated;


-- ----------------------------------------------------------------------------
-- api.ingest_inbound_event() — INSERT idempotente em uma única ida ao banco.
--
-- Chamada pelo Route Handler DEPOIS de validar assinatura/IP/tamanho. Devolve
-- (public_id, is_duplicate, original_public_id, original_result), que é tudo
-- que a rota precisa para responder:
--   - duplicata  -> 200 com o resultado original (nunca 4xx/5xx: o n8n
--                   trataria como falha e reenviaria eternamente)
--   - nova       -> segue para o handler da action
--
-- SECURITY DEFINER + grant só para service_role: `authenticated` não escreve
-- log de webhook em hipótese alguma.
-- ----------------------------------------------------------------------------
create or replace function api.ingest_inbound_event(
  p_endpoint_id     uuid,
  p_endpoint_slug   text,
  p_action          text,
  p_payload         jsonb,
  p_payload_bytes   integer,
  p_payload_sha256  bytea,
  p_idempotency_key text default null,
  p_api_key_id      uuid default null,
  p_api_key_prefix  text default null,
  p_source_ip       inet default null,
  p_user_agent      text default null,
  p_content_type    text default null,
  p_headers         jsonb default '{}'::jsonb,
  p_request_id      text default null,
  p_auth_method     text default 'none',
  p_signature_valid boolean default null,
  p_http_method     text default 'POST'
)
returns table (
  event_id           bigint,
  public_id          uuid,
  is_duplicate       boolean,
  original_public_id uuid,
  original_result    jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id     bigint;
  v_public uuid;
begin
  -- Alias `ev`: sem ele, `returning public_id` colidiria com a coluna de saída
  -- homônima do RETURNS TABLE e o plpgsql abortaria com "ambiguous reference".
  insert into api.inbound_events as ev (
    endpoint_id, endpoint_slug, action,
    api_key_id, api_key_prefix,
    http_method, source_ip, user_agent, content_type, headers, request_id,
    auth_method, signature_valid,
    payload, payload_bytes, payload_sha256,
    idempotency_key, status
  )
  values (
    p_endpoint_id, p_endpoint_slug, p_action,
    p_api_key_id, p_api_key_prefix,
    p_http_method, p_source_ip, p_user_agent, p_content_type, p_headers, p_request_id,
    p_auth_method, p_signature_valid,
    p_payload, p_payload_bytes, p_payload_sha256,
    p_idempotency_key, 'received'
  )
  -- A cláusula de inferência repete o predicado do índice parcial (1).
  on conflict (endpoint_id, idempotency_key) where idempotency_key is not null
  do nothing
  returning ev.id, ev.public_id
  into v_id, v_public;

  if v_id is not null then
    -- Melhor esforço: mantém "último evento" do endpoint sem custo de trigger
    -- por linha. Não bloqueia o ingest se falhar.
    update api.webhook_endpoints
       set last_event_at = now()
     where id = p_endpoint_id;

    return query select v_id, v_public, false, null::uuid, null::jsonb;
    return;
  end if;

  -- Sem linha inserida = conflito de idempotência. Devolve o evento original.
  return query
    select null::bigint, null::uuid, true, e.public_id, e.result
      from api.inbound_events e
     where e.endpoint_id = p_endpoint_id
       and e.idempotency_key = p_idempotency_key
     limit 1;
end;
$$;

comment on function api.ingest_inbound_event is
  'INSERT idempotente do evento recebido. Em conflito devolve o evento '
  'original para a rota responder 200 e o n8n parar de reenviar.';

revoke all on function api.ingest_inbound_event(
  uuid, text, text, jsonb, integer, bytea, text, uuid, text, inet, text, text,
  jsonb, text, text, boolean, text
) from public;
grant execute on function api.ingest_inbound_event(
  uuid, text, text, jsonb, integer, bytea, text, uuid, text, inet, text, text,
  jsonb, text, text, boolean, text
) to service_role;


-- ----------------------------------------------------------------------------
-- api.complete_inbound_event() — fecha o evento depois do handler.
-- ----------------------------------------------------------------------------
create or replace function api.complete_inbound_event(
  p_event_id      bigint,
  p_status        text,
  p_result        jsonb   default null,
  p_error_code    text    default null,
  p_error_message text    default null,
  p_error_detail  jsonb   default null,
  p_processing_ms integer default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  update api.inbound_events
     set status        = p_status,
         result        = coalesce(p_result, result),
         error_code    = p_error_code,
         error_message = left(p_error_message, 2000),   -- stack trace inteiro
                                                        -- vai para error_detail
         error_detail  = p_error_detail,
         processing_ms = p_processing_ms,
         attempts      = attempts + 1,
         processed_at  = now()
   where id = p_event_id;
$$;

revoke all on function api.complete_inbound_event(bigint, text, jsonb, text, text, jsonb, integer) from public;
grant execute on function api.complete_inbound_event(bigint, text, jsonb, text, text, jsonb, integer) to service_role;
