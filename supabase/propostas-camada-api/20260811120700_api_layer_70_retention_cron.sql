-- ============================================================================
-- 20260811120700_api_layer_70_retention_cron.sql
--
-- POLÍTICA DE RETENÇÃO
--
-- Dado de integração envelhece em dois tempos, e a política separa os dois:
--
--   FASE 1 — PURGE DO PAYLOAD (padrão: 30 dias, configurável por endpoint)
--   `payload`, `headers` e `error_detail` são zerados; a linha permanece com
--   status, timing, hash e ids. É onde está quase todo o volume em bytes e
--   todo o risco de dado pessoal. Depois disso o painel ainda responde "o
--   webhook X rodou, deu certo, levou 240ms e criou o post Y" — que é o que
--   de fato se pergunta sobre um evento de um mês atrás. O `payload_sha256`
--   sobrevive ao purge, então ainda dá para provar QUAL corpo foi processado
--   sem guardar o corpo.
--
--   FASE 2 — DELETE DA LINHA (padrão: 180 dias, configurável por endpoint)
--   O metadado sai. A série histórica não se perde porque
--   api.inbound_events_daily (arquivo 60) já consolidou os agregados — o
--   gráfico anual do dashboard continua funcionando sobre uma tabela que só
--   guarda meio ano de linhas.
--
-- Prazos por endpoint, em webhook_endpoints.retain_payload_days /
-- retain_event_days, porque o custo e o risco de guardar não são os mesmos:
--   contact.message.create  -> payload  7d   (LGPD: dado pessoal, minimização)
--   analytics.event.ingest  -> payload  3d   (volume alto, sem valor unitário)
--   blog.post.draft.create  -> payload 90d   (útil para reprocessar rascunho)
--
-- ----------------------------------------------------------------------------
-- POR QUE A ESTRUTURA É "FUNÇÃO DE LOTE + PROCEDURE QUE COMMITA"
--
-- Um `delete from inbound_events where received_at < ...` pegando meio milhão
-- de linhas segura uma transação por minutos, infla o WAL, atrasa o autovacuum
-- e pode estourar o statement_timeout — e aí não apaga NADA, porque reverte
-- tudo. Precisa ser em lotes, com COMMIT entre eles.
--
-- Só que em PL/pgSQL:
--   - FUNÇÃO não pode dar COMMIT. Um loop dentro de uma função roda inteiro
--     numa transação só, ou seja, "lote" ali é ilusão.
--   - PROCEDURE pode dar COMMIT via CALL no topo, mas NÃO se for
--     SECURITY DEFINER: o Postgres rejeita com 2D000 (invalid transaction
--     termination).
--
-- Daí a divisão:
--   api.*_batch(...)      FUNÇÃO SECURITY DEFINER. Faz UM lote e retorna. Cada
--                         chamada é uma transação curta. É o que a rota de
--                         cron da Vercel chama em laço, se for esse o caminho.
--   api.run_retention()   PROCEDURE, deliberadamente SEM security definer,
--                         chamada por `CALL` no pg_cron (que roda como
--                         `postgres`, dono das tabelas). Encadeia os lotes e
--                         commita entre eles.
--
-- Consequência prática: `CALL api.run_retention()` NÃO funciona via supabase-js
-- .rpc(), porque o PostgREST abre transação — e procedure com COMMIT exige
-- estar no topo. Pelo PostgREST, chame as funções *_batch em laço.
--
-- ALTERNATIVA ESTRUTURAL: partições mensais + DROP TABLE apaga em tempo
-- constante, sem lote nenhum. Ver arquivo 80 — vale a troca quando
-- inbound_events passar da casa dos milhões de linhas.
-- ============================================================================

-- pg_cron em bloco tolerante: em alguns projetos a extensão só pode ser
-- habilitada pelo Dashboard, e um erro aqui derrubaria toda a migration —
-- inclusive as funções de retenção, que funcionam sem pg_cron nenhum
-- (ver Vercel Cron no rodapé).
do $$
begin
  execute 'create extension if not exists pg_cron';
exception
  when others then
    raise warning 'não foi possível habilitar pg_cron (%). Habilite em '
                  'Database > Extensions ou use Vercel Cron.', sqlerrm;
end;
$$;


-- ============================================================================
-- FASE 1 — purge do payload (um lote)
-- ============================================================================
create or replace function api.purge_inbound_payloads_batch(
  p_batch_size integer default 5000
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  with alvo as (
    select e.id
      from api.inbound_events e
      join api.webhook_endpoints w on w.id = e.endpoint_id
     where e.payload is not null                        -- índice parcial (8)
       and e.received_at < now() - make_interval(days => w.retain_payload_days)
     -- Ordem cronológica: percorre o índice parcial na ordem física e ataca
     -- sempre o mais antigo, então a fila drena de verdade em vez de ficar
     -- reprocessando o meio dela.
     order by e.received_at
     limit p_batch_size
     -- skip locked: duas rodadas concorrentes (retry do cron sobrepondo a
     -- execução anterior) dividem o trabalho em vez de brigar pelas mesmas
     -- linhas.
     for update of e skip locked
  )
  update api.inbound_events e
     set payload           = null,
         headers           = '{}'::jsonb,
         error_detail      = null,
         payload_purged_at = now()
    from alvo
   where e.id = alvo.id;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

comment on function api.purge_inbound_payloads_batch(integer) is
  'Fase 1, um lote: zera payload/headers respeitando retain_payload_days do '
  'endpoint. Retorna quantas linhas tocou; 0 = nada pendente.';

revoke all on function api.purge_inbound_payloads_batch(integer) from public;
grant execute on function api.purge_inbound_payloads_batch(integer) to service_role;


-- Eventos órfãos: endpoint apagado deixou endpoint_id NULL, então o JOIN acima
-- nunca os alcança e eles guardariam payload para sempre. Prazo fixo
-- conservador, statement único.
create or replace function api.purge_orphan_payloads()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  update api.inbound_events
     set payload = null, headers = '{}'::jsonb, error_detail = null,
         payload_purged_at = now()
   where payload is not null
     and endpoint_id is null
     and received_at < now() - interval '30 days';
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function api.purge_orphan_payloads() from public;
grant execute on function api.purge_orphan_payloads() to service_role;


-- ============================================================================
-- FASE 2 — delete da linha (um lote)
--
-- PRÉ-CONDIÇÃO: o rollup diário precisa estar em dia antes de apagar o cru,
-- senão a série histórica perde os dias ainda não consolidados. Quem garante
-- isso é api.run_retention(), que chama o refresh antes de entrar neste loop.
-- ============================================================================
create or replace function api.purge_inbound_events_batch(
  p_batch_size integer default 5000
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  delete from api.inbound_events e
   where e.id in (
     select x.id
       from api.inbound_events x
       join api.webhook_endpoints w on w.id = x.endpoint_id
      where x.received_at < now() - make_interval(days => w.retain_event_days)
      order by x.received_at
      limit p_batch_size
      for update of x skip locked
   );
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function api.purge_inbound_events_batch(integer) from public;
grant execute on function api.purge_inbound_events_batch(integer) to service_role;


create or replace function api.purge_orphan_events()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  delete from api.inbound_events
   where endpoint_id is null
     and received_at < now() - interval '180 days';
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function api.purge_orphan_events() from public;
grant execute on function api.purge_orphan_events() to service_role;


-- ============================================================================
-- Retenção do lado de saída (um lote)
--
-- Assimetria proposital: sucesso some rápido (30 dias — já cumpriu sua função),
-- fracasso fica muito mais tempo (180 dias), porque é exatamente a evidência
-- que se consulta quando um parceiro reclama que "nunca recebeu nada".
-- O ON DELETE CASCADE leva junto outbound_delivery_attempts, por isso não há
-- um segundo lote para aquela tabela.
-- ============================================================================
create or replace function api.purge_outbound_history_batch(
  p_batch_size integer default 5000
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  delete from api.outbound_deliveries d
   where d.id in (
     select x.id
       from api.outbound_deliveries x
      where (x.status = 'succeeded'
             and x.completed_at < now() - interval '30 days')
         or (x.status in ('exhausted', 'canceled')
             and x.completed_at < now() - interval '180 days')
      limit p_batch_size
      for update of x skip locked
   );
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function api.purge_outbound_history_batch(integer) from public;
grant execute on function api.purge_outbound_history_batch(integer) to service_role;


-- ============================================================================
-- Manutenção operacional — statements únicos, sem necessidade de lote
-- ============================================================================

-- Contadores de rate limit vencidos: é o "TTL" que o Redis daria de graça.
-- Usa o índice BRIN em expires_at (arquivo 50).
create or replace function api.purge_rate_limit_counters()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  delete from api.rate_limit_counters where expires_at < now();
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function api.purge_rate_limit_counters() from public;
grant execute on function api.purge_rate_limit_counters() to service_role;


-- Encerra a janela de rotação e descarta o segredo antigo do Vault. Sem este
-- job, o segredo anterior aceitaria assinaturas para sempre e a "rotação"
-- teria apenas criado mais uma credencial válida.
create or replace function api.expire_rotated_endpoint_secrets()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer := 0;
  r      record;
begin
  for r in
    select id, previous_signing_secret_id
      from api.webhook_endpoints
     where previous_signing_secret_id is not null
       and previous_secret_valid_until < now()      -- índice parcial (4), arq.20
  loop
    update api.webhook_endpoints
       set previous_signing_secret_id  = null,
           previous_secret_valid_until = null
     where id = r.id;

    delete from vault.secrets where id = r.previous_signing_secret_id;
    v_rows := v_rows + 1;
  end loop;

  return v_rows;
end;
$$;

revoke all on function api.expire_rotated_endpoint_secrets() from public;
grant execute on function api.expire_rotated_endpoint_secrets() to service_role;


-- Devolve para a fila entregas cujo worker morreu segurando o lock — função
-- serverless encerrada pelo timeout da Vercel depois do claim e antes do
-- record. Sem isto, o item ficaria 'in_flight' para sempre.
create or replace function api.requeue_stale_deliveries()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  update api.outbound_deliveries
     set status          = case when attempt >= max_attempts
                                then 'exhausted' else 'failed' end,
         completed_at    = case when attempt >= max_attempts then now() end,
         error_message   = coalesce(error_message, 'worker perdeu o lock (timeout)'),
         next_attempt_at = now() + interval '1 minute',
         locked_at = null, locked_until = null, locked_by = null
   where status = 'in_flight'
     and locked_until < now();                      -- índice parcial (5), arq.40

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function api.requeue_stale_deliveries() from public;
grant execute on function api.requeue_stale_deliveries() to service_role;


-- Marca como revogadas as chaves que passaram da validade, para que a listagem
-- do painel e os índices parciais reflitam a realidade.
create or replace function api.expire_api_keys()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  update api.api_keys
     set revoked_at     = now(),
         revoked_reason = 'expirada automaticamente'
   where revoked_at is null
     and expires_at is not null
     and expires_at <= now();                       -- índice parcial (5), arq.10
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function api.expire_api_keys() from public;
grant execute on function api.expire_api_keys() to service_role;


-- ============================================================================
-- api.run_retention() — orquestração com COMMIT entre lotes.
--
-- PROCEDURE e SEM security definer, pelos dois motivos explicados no cabeçalho:
-- só procedure pode commitar, e security definer proibiria o COMMIT (2D000).
-- Roda como o papel que chamou — no pg_cron, `postgres`, dono das tabelas.
--
-- p_max_rows por fase impede que uma rodada atrasada tente recuperar meses de
-- backlog de uma vez; o que sobrar é resolvido na noite seguinte.
-- ============================================================================
create or replace procedure api.run_retention(
  p_batch_size integer default 5000,
  p_max_rows   integer default 200000
)
language plpgsql
as $$
declare
  v_batch integer;
  v_done  integer;
begin
  -- FASE 1 --------------------------------------------------------------
  v_done := 0;
  loop
    v_batch := api.purge_inbound_payloads_batch(p_batch_size);
    v_done  := v_done + v_batch;
    commit;                       -- fecha a transação do lote; libera WAL e
                                  -- deixa o autovacuum trabalhar
    exit when v_batch = 0 or v_done >= p_max_rows;
  end loop;
  raise notice 'retenção fase 1 (payloads): % linhas', v_done;

  perform api.purge_orphan_payloads();
  commit;

  -- Rollup ANTES do delete: consolida o que está prestes a sumir.
  perform api.refresh_inbound_events_daily(7);
  commit;

  -- FASE 2 --------------------------------------------------------------
  v_done := 0;
  loop
    v_batch := api.purge_inbound_events_batch(p_batch_size);
    v_done  := v_done + v_batch;
    commit;
    exit when v_batch = 0 or v_done >= p_max_rows;
  end loop;
  raise notice 'retenção fase 2 (eventos): % linhas', v_done;

  perform api.purge_orphan_events();
  commit;

  -- SAÍDA ---------------------------------------------------------------
  v_done := 0;
  loop
    v_batch := api.purge_outbound_history_batch(p_batch_size);
    v_done  := v_done + v_batch;
    commit;
    exit when v_batch = 0 or v_done >= p_max_rows;
  end loop;
  raise notice 'retenção saída: % linhas', v_done;

  perform api.expire_api_keys();
  commit;
end;
$$;

comment on procedure api.run_retention(integer, integer) is
  'Executa toda a retenção em lotes com COMMIT entre eles. Chamar apenas via '
  'CALL no topo (pg_cron ou psql) — pelo PostgREST use as funções *_batch, '
  'que não commitam.';

-- Sem grant para papel de cliente: como é INVOKER, quem chamasse precisaria de
-- privilégio próprio nas tabelas — e ninguém além do dono tem.
revoke all on procedure api.run_retention(integer, integer) from public;


-- ============================================================================
-- Agendamento (pg_cron)
--
-- Horários em UTC — o pg_cron do Supabase ignora o TimeZone da sessão. Os jobs
-- pesados rodam de madrugada em São Paulo (UTC-3): 03:20 UTC ≈ 00:20 BRT.
--
-- O bloco é idempotente: desagenda antes de agendar, então reaplicar a
-- migration não duplica job. E degrada com aviso se pg_cron não estiver
-- habilitado, em vez de derrubar a migration inteira.
-- ============================================================================
do $$
declare
  j    record;
  i    integer;
  jobs constant text[][] := array[
    -- nome                        schedule       comando
    ['api-retencao',               '20 3 * * *',  'call api.run_retention();'],
    ['api-expira-segredos',        '10 * * * *',  'select api.expire_rotated_endpoint_secrets();'],
    ['api-rollup-diario',          '5 * * * *',   'select api.refresh_inbound_events_daily(3);'],
    ['api-purga-rate-limit',       '*/5 * * * *', 'select api.purge_rate_limit_counters();'],
    ['api-requeue-entregas',       '*/2 * * * *', 'select api.requeue_stale_deliveries();']
  ];
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise warning
      'pg_cron indisponível: habilite em Database > Extensions e reaplique '
      'esta migration, ou agende as funções por Vercel Cron (ver rodapé).';
    return;
  end if;

  for i in 1 .. array_length(jobs, 1) loop
    for j in select jobid from cron.job where jobname = jobs[i][1] loop
      perform cron.unschedule(j.jobid);
    end loop;
    perform cron.schedule(jobs[i][1], jobs[i][2], jobs[i][3]);
  end loop;
end;
$$;


-- ============================================================================
-- ALTERNATIVA SEM pg_cron: Vercel Cron
--
-- Rota protegida por CRON_SECRET, cliente service_role, laço sobre as funções
-- de LOTE (nunca CALL api.run_retention(), que exige transação de topo):
--
--   let total = 0
--   for (let i = 0; i < 40; i++) {
--     const { data } = await supabaseAdmin.rpc('purge_inbound_payloads_batch',
--                                              { p_batch_size: 5000 })
--     total += data
--     if (data === 0) break          // cada rpc = sua própria transação curta
--   }
--
-- vercel.json:
--   { "crons": [
--       { "path": "/api/cron/retention", "schedule": "20 3 * * *" },
--       { "path": "/api/cron/queue",     "schedule": "*/2 * * * *" }
--   ]}
--
-- Todas as funções são idempotentes e limitadas por lote, então rodar duas
-- vezes, ou pelos dois caminhos ao mesmo tempo, não causa dano — o
-- `for update ... skip locked` cuida da concorrência.
-- ============================================================================
