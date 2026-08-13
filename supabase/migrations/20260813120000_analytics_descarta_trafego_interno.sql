-- =============================================================================
-- 0009 — Analytics: tráfego interno deixa de ser GRAVADO
-- =============================================================================
-- O QUE ESTAVA ERRADO.
--
-- `is_internal` era decidido UMA VEZ, no momento em que a sessão nascia, e nunca
-- mais revisto. O caminho que fura é o mais comum de todos:
--
--   1. Abro o site em `/`. Sessão criada, sem cookie de auth → is_internal=false.
--   2. Faço login e navego pelo painel.
--   3. Os pageviews de /admin entram na MESMA sessão (janela de 30 min), que
--      continua marcada como pública.
--   4. `analytics_rollup` filtra `not s.is_internal` — filtro de SESSÃO. Os
--      eventos de /admin passam, e o dashboard conta o próprio painel como
--      audiência.
--
-- Medido no banco antes desta migration: 68 eventos com path /admin*, 22 deles
-- em sessão não marcada como interna, e 8 dos ~18 pageviews do rollup vinham de
-- /admin. Quase metade do "tráfego" do site era eu mesmo.
--
-- O QUE MUDA.
--
-- Tráfego interno passa a ser DESCARTADO na ingestão, como já acontece com quem
-- exerceu oposição (optout) — em vez de gravado com uma marca. Duas razões:
--
--   a) marca só vale se todo consumidor lembrar de aplicá-la, e bastou um
--      (`analytics_rollup`) aplicá-la no nível errado para o número sair errado;
--   b) o dado nunca teve uso: nenhuma tela mostra tráfego interno. Guardar linha
--      que ninguém lê é custo de armazenamento e superfície de retenção à toa —
--      o oposto da minimização que a política publicada promete.
--
-- A coluna `is_internal` continua existindo: linhas antigas ainda a usam, e o
-- filtro do rollup continua valendo como defesa em profundidade.
-- =============================================================================

create or replace function public.analytics_ingest(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_salt    bytea;
  v_visitor uuid;
  v_sid     uuid;
  v_now     timestamptz := now();
  v_kind    smallint := coalesce((p->>'kind')::smallint, 1);
  v_count   integer;
begin
  -- Oposição do titular (LGPD art. 18, §2º): descarta antes de qualquer escrita.
  if coalesce((p->>'optout')::boolean, false) then
    return jsonb_build_object('ok', true, 'skipped', 'optout');
  end if;

  -- NOVO: tráfego interno também não chega a ser gravado.
  --
  -- `isInternal` é decidido no servidor por `ehInterno()` em lib/analytics/ingest.ts
  -- e cobre: ambiente que não é produção, rota privada (/admin e /auth, via
  -- `ehRotaPrivada` de src/analytics/client.ts), host localhost/127.0.0.1/::1,
  -- e requisição com cookie de sessão do Supabase.
  -- Descartar aqui é o que impede o caso da sessão que começa pública e depois
  -- entra no painel: a decisão passa a ser por EVENTO, não por sessão.
  if coalesce((p->>'isInternal')::boolean, false) then
    return jsonb_build_object('ok', true, 'skipped', 'internal');
  end if;

  insert into private.analytics_salt (day) values (current_date) on conflict (day) do nothing;
  select salt into v_salt from private.analytics_salt where day = current_date;

  -- Pseudônimo diário: 32 hex = 128 bits, convertidos para uuid.
  v_visitor := substring(
    encode(
      extensions.digest(
        v_salt || convert_to(coalesce(p->>'ip','') || '|' || coalesce(p->>'ua',''), 'UTF8'),
        'sha256'
      ), 'hex'
    ) from 1 for 32
  )::uuid;

  -- Sessão aberta = mesmo visitante com atividade nos últimos 30 minutos.
  select id into v_sid
    from public.analytics_session
   where visitor_id = v_visitor
     and last_seen_at > v_now - interval '30 minutes'
   order by last_seen_at desc
   limit 1;

  if v_sid is null then
    insert into public.analytics_session (
      visitor_id, entry_path, referrer_domain, referrer_path,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      browser, browser_version, os, device, screen, viewport, language,
      country, is_bot, bot_reason, is_internal
    ) values (
      v_visitor, p->>'path', p->>'refDomain', p->>'refPath',
      p->>'utmSource', p->>'utmMedium', p->>'utmCampaign', p->>'utmContent', p->>'utmTerm',
      p->>'browser', p->>'browserVersion', p->>'os', coalesce(p->>'device','unknown'),
      p->>'screen', p->>'viewport', p->>'language',
      p->>'country', coalesce((p->>'isBot')::boolean, false), p->>'botReason',
      false   -- só chega aqui quem não é interno
    ) returning id into v_sid;
  end if;

  -- Teto anti-flood no próprio banco: é a última linha de defesa, porque o
  -- rate limit em memória de função serverless vale por instância, não global.
  select pageviews + events into v_count from public.analytics_session where id = v_sid;
  if v_count > 600 then
    return jsonb_build_object('ok', false, 'reason', 'session_cap');
  end if;

  insert into public.analytics_event (
    session_id, visitor_id, kind, name, path, query, title,
    referrer_domain, utm_source, utm_medium, utm_campaign,
    duration_ms, scroll_depth, href, label, props
  ) values (
    v_sid, v_visitor, v_kind, p->>'name', coalesce(p->>'path','/'),
    left(p->>'query', 500), left(p->>'title', 300),
    p->>'refDomain', p->>'utmSource', p->>'utmMedium', p->>'utmCampaign',
    (p->>'durationMs')::int, (p->>'scrollDepth')::smallint,
    left(p->>'href', 500), left(p->>'label', 120), p->'props'
  );

  update public.analytics_session set
    last_seen_at = v_now,
    exit_path    = coalesce(p->>'path', exit_path),
    pageviews    = pageviews + (case when v_kind = 1 then 1 else 0 end),
    events       = events    + (case when v_kind = 1 then 0 else 1 end),
    active_ms    = active_ms + coalesce((p->>'durationMs')::int, 0),
    max_scroll   = greatest(max_scroll, coalesce((p->>'scrollDepth')::smallint, 0))
  where id = v_sid;

  return jsonb_build_object('ok', true);
end
$$;

revoke execute on function public.analytics_ingest(jsonb) from public, anon, authenticated;
grant execute on function public.analytics_ingest(jsonb) to service_role;

-- -----------------------------------------------------------------------------
-- Rollup: filtro por PATH, além do filtro por sessão
-- -----------------------------------------------------------------------------
-- Defesa em profundidade. Com a ingestão descartando, nenhum evento de painel
-- deveria existir daqui em diante — mas o filtro de sessão sozinho já provou que
-- deixa passar, e um evento que escape por qualquer caminho futuro não pode
-- virar número de audiência.
--
-- Os prefixos abaixo repetem `PREFIXOS_PRIVADOS` de src/analytics/client.ts, que
-- é a definição usada pelo tracker e pela ingestão. São dois lugares porque SQL
-- não importa TypeScript: mudou lá, mude aqui.
create or replace function public.analytics_rollup(p_dias integer default 3)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_desde date := current_date - greatest(p_dias, 0);
  v_linhas integer;
begin
  delete from public.analytics_daily where day >= v_desde;

  insert into public.analytics_daily
    (day, dimension, value, pageviews, events, sessions, bounces, active_ms, visitors)
  select
    e.created_at::date,
    case
      when grouping(e.path)            = 0 then 'path'
      when grouping(e.referrer_domain) = 0 then 'referrer'
      when grouping(s.country)         = 0 then 'country'
      when grouping(s.device)          = 0 then 'device'
      when grouping(s.browser)         = 0 then 'browser'
      when grouping(e.utm_source)      = 0 then 'utm_source'
      when grouping(e.name)            = 0 then 'event'
      else 'total'
    end,
    coalesce(e.path, e.referrer_domain, s.country, s.device,
             s.browser, e.utm_source, e.name, ''),
    count(*) filter (where e.kind = 1),
    count(*) filter (where e.kind = 2),
    count(distinct e.session_id),
    count(distinct e.session_id) filter (where s.is_bounce),
    coalesce(sum(e.duration_ms), 0),
    count(distinct e.visitor_id)
  from public.analytics_event e
  join public.analytics_session s on s.id = e.session_id
  where e.created_at >= v_desde
    and not s.is_bot
    and not s.is_internal           -- filtro por sessão
    and e.path not like '/admin%'   -- filtro por evento: painel nunca é audiência
    and e.path not like '/auth/%'   -- e a tela de login também não
  group by grouping sets (
    (e.created_at::date),
    (e.created_at::date, e.path),
    (e.created_at::date, e.referrer_domain),
    (e.created_at::date, s.country),
    (e.created_at::date, s.device),
    (e.created_at::date, s.browser),
    (e.created_at::date, e.utm_source),
    (e.created_at::date, e.name)
  );

  get diagnostics v_linhas = row_count;
  return jsonb_build_object('ok', true, 'linhas', v_linhas, 'desde', v_desde);
end
$$;

revoke execute on function public.analytics_rollup(integer) from public, anon, authenticated;
grant execute on function public.analytics_rollup(integer) to service_role;
