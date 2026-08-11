-- =============================================================================
-- 0004 — Ingestão, rollup, retenção e direitos do titular
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Ingestão
-- -----------------------------------------------------------------------------
-- Recebe tudo num jsonb. O IP e o UA crus entram aqui, são hasheados junto com
-- o salt do dia, e são descartados: nenhuma coluna os armazena.
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
      coalesce((p->>'isInternal')::boolean, false)
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
-- Rollup
-- -----------------------------------------------------------------------------
-- Reprocessa dias inteiros em vez de acumular janelas parciais: somar
-- count(distinct) de fatias do mesmo dia superestima visitantes, e usar
-- greatest() subestima. Reprocessar é exato, e o volume de um site pessoal
-- torna o custo irrelevante.
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
    and not s.is_internal          -- filtro na origem: bot não entra no rollup
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

-- -----------------------------------------------------------------------------
-- LGPD: prova do exercício de direitos, eliminação e expurgo
-- -----------------------------------------------------------------------------
-- O ônus da prova de conformidade é do controlador (art. 8º, §2º).
create table public.privacy_log (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  action         text not null
                 check (action in ('objection','erasure','access_export','consent','withdrawal')),
  policy_version text not null,
  subject_ref    text,   -- token opaco de oposição, ou visitor_id informado pelo titular
  source         text    -- 'pagina_meus_dados' | 'email' | 'banner'
);
revoke all on table public.privacy_log from anon;
grant select on table public.privacy_log to authenticated;
alter table public.privacy_log enable row level security;
create policy "so admin le privacy_log" on public.privacy_log for select to authenticated
  using ((select public.is_admin()));

create or replace function public.privacy_log_registrar(
  p_action text, p_policy_version text, p_subject_ref text, p_source text
) returns void
language sql security definer set search_path = ''
as $$
  insert into public.privacy_log (action, policy_version, subject_ref, source)
  values (p_action, p_policy_version, p_subject_ref, p_source)
$$;
revoke execute on function public.privacy_log_registrar(text,text,text,text) from public, anon, authenticated;
grant execute on function public.privacy_log_registrar(text,text,text,text) to service_role;

-- Eliminação em um passo: os eventos caem pelo ON DELETE CASCADE. O rollup é
-- agregado e anônimo, então não é tocado.
create or replace function public.erase_visitor(p_visitor uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare n integer;
begin
  delete from public.analytics_session where visitor_id = p_visitor;
  get diagnostics n = row_count;
  return n;
end
$$;
revoke execute on function public.erase_visitor(uuid) from public, anon, authenticated;
grant execute on function public.erase_visitor(uuid) to service_role;

-- Expurgo automático. Os prazos aqui são os mesmos declarados na política:
-- se um mudar, o outro muda junto.
create or replace function public.analytics_retention()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_ev integer; v_se integer;
begin
  delete from public.analytics_event where created_at < now() - interval '180 days';
  get diagnostics v_ev = row_count;

  delete from public.analytics_session where started_at < now() - interval '180 days';
  get diagnostics v_se = row_count;

  -- Destruir o salt é o que torna o visitor_id irreversível de forma definitiva.
  delete from private.analytics_salt where day < current_date - 1;

  return jsonb_build_object('ok', true, 'eventos', v_ev, 'sessoes', v_se);
end
$$;
revoke execute on function public.analytics_retention() from public, anon, authenticated;
grant execute on function public.analytics_retention() to service_role;
