-- =============================================================================
-- 0002 — Blog
-- =============================================================================
-- Formato do conteúdo: `content_json` (documento ProseMirror do Tiptap) é a
-- fonte da verdade. `content_html` e `content_text` são DERIVADOS no servidor,
-- no momento do save, e nunca aceitos do browser — aceitar HTML do cliente é
-- entregar XSS armazenado.
-- =============================================================================

create table public.posts (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique
           check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 120),
  title    text not null check (length(title) between 3 and 200),
  excerpt  text check (length(excerpt) <= 320),

  content_json jsonb not null,
  content_html text  not null default '',
  content_text text  not null default '',

  cover_url text,
  cover_alt text,                       -- exigido na UI do admin (acessibilidade)

  category text not null default 'tecnologia'
           check (category in ('tecnologia','ia','automacao','negocios','fe')),
  tags     text[] not null default '{}',
  reading_minutes smallint not null default 1,

  status       text not null default 'draft'
               check (status in ('draft','scheduled','published','archived')),
  published_at timestamptz,

  seo_title       text,
  seo_description text check (length(seo_description) <= 200),
  noindex         boolean not null default false,

  author_id  uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Sem data não há como a política de leitura comparar com now(): um post
  -- 'published' sem published_at vazaria por não satisfazer nenhum filtro de tempo.
  constraint posts_published_needs_date
    check (status not in ('published','scheduled') or published_at is not null),

  search_tsv tsvector generated always as (
       setweight(to_tsvector('portuguese', coalesce(title, '')),        'A')
    || setweight(to_tsvector('portuguese', coalesce(excerpt, '')),      'B')
    || setweight(to_tsvector('portuguese', coalesce(content_text, '')), 'C')
  ) stored
);

-- Histórico de edição: barato, e evita perder trabalho por engano no editor.
create table public.post_revisions (
  id           bigint generated always as identity primary key,
  post_id      uuid not null references public.posts(id) on delete cascade,
  title        text not null,
  content_json jsonb not null,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger posts_touch
before update on public.posts
for each row execute function private.touch_updated_at();

-- ── Índices ──────────────────────────────────────────────────────────────────
-- Parcial, casando exatamente com a política de leitura pública: o índice só
-- indexa as linhas que o público pode ver.
create index posts_public_idx on public.posts (published_at desc) where status = 'published';
create index posts_tags_idx   on public.posts using gin (tags);
create index posts_search_idx on public.posts using gin (search_tsv);
create index posts_status_idx on public.posts (status, updated_at desc);
create index post_revisions_post_idx on public.post_revisions (post_id, created_at desc);

-- ── Camada 1: GRANTs ─────────────────────────────────────────────────────────
grant select                 on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;
grant select, insert         on table public.post_revisions to authenticated;

-- ── Camada 2: RLS ────────────────────────────────────────────────────────────
alter table public.posts          enable row level security;
alter table public.post_revisions enable row level security;

-- Políticas PERMISSIVE combinam com OR: o público vê o publicado, o admin vê tudo.
-- `published_at <= now()` é o que impede um post agendado de vazar antes da hora.
create policy "publico le posts publicados"
on public.posts for select to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

-- O (select public.is_admin()) faz o Postgres avaliar uma vez por statement em
-- vez de uma vez por linha.
create policy "admin le tudo" on public.posts for select to authenticated
  using ((select public.is_admin()));
create policy "admin insere" on public.posts for insert to authenticated
  with check ((select public.is_admin()));
create policy "admin atualiza" on public.posts for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin apaga" on public.posts for delete to authenticated
  using ((select public.is_admin()));

create policy "admin le revisoes" on public.post_revisions for select to authenticated
  using ((select public.is_admin()));
create policy "admin cria revisoes" on public.post_revisions for insert to authenticated
  with check ((select public.is_admin()));
