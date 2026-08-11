-- ============================================================================
-- 20260811120500_api_layer_50_rate_limit.sql
--
-- api.rate_limit_counters — contagem de janela fixa DENTRO do Postgres.
--
-- A PERGUNTA "PostgreSQL OU Redis?"
--
-- Contar rate limit no Postgres custa uma ida ao banco por requisição, e é um
-- UPDATE, então gera WAL, tupla morta e trabalho de autovacuum. Em API de alto
-- tráfego a resposta correta é Redis/Upstash: o INCR+EXPIRE resolve em memória,
-- fala HTTP (serve edge e serverless sem pool de conexão) e expira sozinho, sem
-- job de limpeza.
--
-- Para ESTE projeto o Postgres ganha, por três motivos concretos:
--   1. Volume. Webhooks de n8n/Make são dezenas a poucos milhares por dia. Um
--      UPSERT a mais por requisição é ruído diante do INSERT em inbound_events
--      que a requisição já faz de qualquer forma.
--   2. A rota já abriu conexão com o Postgres para resolver o endpoint e
--      autenticar a chave. O contador pega carona; o Redis seria uma segunda
--      dependência de rede no caminho quente, com a própria latência e o
--      próprio modo de falha.
--   3. Consistência. Limite e decisão vivem na mesma transação do log — não
--      existe estado "contei no Redis mas o INSERT falhou".
--
-- Três mitigações fazem o custo caber:
--   (a) UNLOGGED. Sem WAL, sem replicação para réplicas de leitura, sem entrar
--       nos backups. Perder o contador num restart significa que uma janela de
--       60s é reiniciada — irrelevante para a finalidade, e enorme em economia
--       de I/O. É por isso que esta é a única tabela UNLOGGED do conjunto.
--   (b) `fillfactor = 70`. A tabela só sofre UPDATE na mesma linha. Deixar 30%
--       livre em cada página habilita HOT updates: a nova versão da tupla cabe
--       na própria página e os índices não precisam ser reescritos.
--   (c) Purga por pg_cron a cada 5 minutos (arquivo 70). É o "TTL" que o Redis
--       daria de graça.
--
-- Se um dia o tráfego justificar, a migração é limpa: o rate limit já está
-- atrás de uma função (api.rate_limit_hit) com a mesma assinatura que o
-- @upstash/ratelimit expõe — troca-se a implementação, não as rotas.
--
-- ALGORITMO: janela fixa. Aceita, no pior caso, 2x o limite na virada da
-- janela (rajada no fim de uma + rajada no começo da seguinte). Para proteger
-- contra abuso de webhook isso é perfeitamente adequado, e é muito mais barato
-- que sliding window log, que exigiria uma linha por requisição.
-- ============================================================================

create unlogged table api.rate_limit_counters (
  -- Identificador do balde. Convenção de prefixo, para que uma inspeção do
  -- conteúdo já diga o que está sendo limitado:
  --   'key:<uuid>'      por chave de API
  --   'ep:<slug>'       por endpoint (limite global da rota)
  --   'ip:<endereço>'   por origem, para endpoint sem autenticação
  --   'ep:<slug>:ip:<endereço>'  combinação, o mais comum na prática
  bucket          text        not null,

  -- Início da janela, alinhado a múltiplos de window_seconds (não ao instante
  -- da primeira requisição). Alinhar é o que torna a chave determinística:
  -- qualquer instância serverless calcula a mesma janela sem coordenação.
  window_start    timestamptz not null,
  window_seconds  integer     not null,

  hits            integer     not null default 0,

  -- Quando esta linha pode ser apagada. Guardado como coluna em vez de
  -- derivado no WHERE do purge para que o índice de limpeza seja um range scan
  -- direto, sem expressão.
  expires_at      timestamptz not null,

  -- A PK é a chave de UPSERT. A ordem importa: `bucket` primeiro porque é a
  -- coluna de igualdade em 100% dos acessos.
  primary key (bucket, window_seconds, window_start),

  constraint rate_limit_window_seconds_chk
    check (window_seconds between 1 and 86400),
  constraint rate_limit_hits_chk
    check (hits >= 0),
  constraint rate_limit_bucket_len_chk
    check (char_length(bucket) between 1 and 200),
  constraint rate_limit_expiry_chk
    check (expires_at > window_start)
);

alter table api.rate_limit_counters set (fillfactor = 70);

comment on table api.rate_limit_counters is
  'Contadores de janela fixa. UNLOGGED de propósito: perder isso num restart '
  'reinicia uma janela de segundos e economiza WAL em toda requisição. Nunca '
  'guardar aqui nada que precise sobreviver a um restart.';


-- ----------------------------------------------------------------------------
-- Índice
--
-- A PK já serve o caminho quente (lookup e UPSERT por igualdade completa).
-- O único índice adicional é o do purge:
--   delete from api.rate_limit_counters where expires_at < now();
-- Sem ele, cada rodada do cron (a cada 5 min) faria Seq Scan na tabela inteira.
-- BRIN em vez de B-tree: as linhas são inseridas em ordem cronológica, então a
-- correlação física com expires_at é praticamente perfeita — é o caso ideal do
-- BRIN. Ocupa alguns kilobytes contra alguns megabytes do B-tree, e o custo de
-- manutenção por INSERT é quase zero, o que importa numa tabela escrita em
-- toda requisição.
-- ----------------------------------------------------------------------------
create index rate_limit_counters_expires_brin
  on api.rate_limit_counters using brin (expires_at)
  with (pages_per_range = 32);


-- ----------------------------------------------------------------------------
-- RLS
--
-- Nenhuma policy, nenhum grant: a tabela é invisível para anon e authenticated.
-- Nem o painel lê daqui — o que o admin quer ver ("quem está batendo no
-- limite?") vem de api.inbound_events com status='rejected', que é durável.
-- Só o service_role (BYPASSRLS) escreve, e apenas pela função abaixo.
-- ----------------------------------------------------------------------------
alter table api.rate_limit_counters enable row level security;

revoke all on api.rate_limit_counters from anon, authenticated;


-- ----------------------------------------------------------------------------
-- api.rate_limit_hit() — consome uma unidade e diz se pode passar.
--
-- Um único statement: INSERT ... ON CONFLICT DO UPDATE ... RETURNING. O
-- incremento é atômico sob o lock de linha do Postgres, então duas instâncias
-- concorrentes da Vercel não conseguem "ler 9, escrever 10" as duas.
--
-- Retorna o suficiente para montar os headers padrão da resposta:
--   X-RateLimit-Limit / X-RateLimit-Remaining / X-RateLimit-Reset  e, no 429,
--   Retry-After = extract(epoch from reset_at - now())
--
-- Nota de contenção: requisições do MESMO balde serializam no lock da linha.
-- É exatamente o comportamento desejado (é isso que torna a contagem correta),
-- e o custo só apareceria com milhares de req/s no mesmo balde — cenário em
-- que a recomendação já seria mover para o Redis.
-- ----------------------------------------------------------------------------
create or replace function api.rate_limit_hit(
  p_bucket         text,
  p_limit          integer,
  p_window_seconds integer default 60,
  p_cost           integer default 1
)
returns table (
  allowed   boolean,
  used      integer,
  remaining integer,
  reset_at  timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_hits         integer;
begin
  -- Alinhamento determinístico: floor(epoch / janela) * janela. clock_timestamp()
  -- e não now(), porque now() é o início da transação — em transação longa,
  -- várias requisições cairiam na mesma janela já vencida.
  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into api.rate_limit_counters as c
         (bucket, window_start, window_seconds, hits, expires_at)
  values (p_bucket, v_window_start, p_window_seconds, p_cost,
          v_window_start + make_interval(secs => p_window_seconds * 2))
  on conflict (bucket, window_seconds, window_start)
  do update set hits = c.hits + p_cost
  returning c.hits into v_hits;

  return query
    select v_hits <= p_limit,
           v_hits,
           greatest(p_limit - v_hits, 0),
           v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

comment on function api.rate_limit_hit(text, integer, integer, integer) is
  'Janela fixa atômica. p_cost permite cobrar mais de uma unidade por '
  'requisição pesada (ex.: payload grande vale 5).';

revoke all on function api.rate_limit_hit(text, integer, integer, integer) from public;
grant execute on function api.rate_limit_hit(text, integer, integer, integer) to service_role;


-- ----------------------------------------------------------------------------
-- api.rate_limit_peek() — consulta sem consumir.
--
-- Para exibir o estado atual no painel e para checagens que não devem debitar
-- a cota (health check, preflight).
-- ----------------------------------------------------------------------------
create or replace function api.rate_limit_peek(
  p_bucket         text,
  p_window_seconds integer default 60
)
returns table (used integer, reset_at timestamptz)
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(c.hits, 0), v.window_start + make_interval(secs => p_window_seconds)
    from (
      select to_timestamp(
               floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
             ) as window_start
    ) v
    left join api.rate_limit_counters c
      on c.bucket = p_bucket
     and c.window_seconds = p_window_seconds
     and c.window_start = v.window_start;
$$;

revoke all on function api.rate_limit_peek(text, integer) from public;
grant execute on function api.rate_limit_peek(text, integer) to service_role;
