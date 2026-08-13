-- =============================================================================
-- 0008 — Correção de segurança de public.categories
-- =============================================================================
-- Estado verificado no banco de produção antes de escrever este arquivo:
--
--   • public.categories existe, com 7 linhas (2 pais + 5 subcategorias).
--   • `anon` TEM select  → a leitura pública do blog funciona hoje.
--   • `anon` NÃO tem insert/update/delete → 42501. A escrita está fechada.
--   • O admin (marcio.rolim@gmail.com) tem app_metadata
--     {"provider":"email","providers":["email"]} — SEM a chave `role`.
--
-- PROBLEMA — SEGUNDA FONTE DE VERDADE PARA "ADMIN".
-- A migration 20260812150000 escreveu a política de escrita assim:
--
--     using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
--
-- O resto do projeto autoriza por `public.is_admin()`, que consulta
-- `private.admins`. Como o app_metadata do admin não tem `role`, essa condição é
-- FALSA para ele: a tela de categorias do painel não consegue gravar, e falha
-- em silêncio. E se um dia alguém setar app_metadata.role = 'admin' em qualquer
-- usuário, ele ganha escrita total nesta tabela sem constar em private.admins,
-- por um caminho que nenhuma outra parte do código conhece.
--
-- Uma fonte de verdade só. `is_admin()` é ela.
--
-- Sobre os GRANTs: `authenticated` também não recebeu privilégio de escrita
-- (a migration 0001 revoga os default privileges de propósito, para que liberar
-- acesso seja sempre um ato explícito). Sem o grant, a política acima nem chega
-- a ser avaliada — o Postgres nega antes. Os dois precisam estar certos.
--
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =============================================================================

-- ── Políticas ────────────────────────────────────────────────────────────────
drop policy if exists "Permitir leitura pública de categorias" on public.categories;
drop policy if exists "Permitir gestão total de categorias para admins" on public.categories;
drop policy if exists "publico le categorias" on public.categories;
drop policy if exists "admin gerencia categorias" on public.categories;

-- Categoria é rótulo de post publicado: leitura aberta é o comportamento certo,
-- e é o que já acontece hoje.
create policy "publico le categorias"
on public.categories for select to anon, authenticated
using (true);

-- `for all` cobre insert/update/delete. `with check` é o par obrigatório do
-- `using` em escrita: sem ele, um admin poderia gravar uma linha num estado que
-- a própria política recusaria depois.
--
-- `(select public.is_admin())` — com o SELECT — faz o Postgres avaliar a função
-- uma vez por statement em vez de uma vez por linha, igual às políticas de
-- public.posts.
create policy "admin gerencia categorias"
on public.categories for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ── GRANTs ───────────────────────────────────────────────────────────────────
grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;

-- Explícito de propósito, mesmo sendo o estado atual: um clique no Table Editor
-- do painel do Supabase concede privilégio sem deixar rastro em migration
-- nenhuma. Declarar a negação aqui faz o `git` ser a autoridade sobre quem
-- escreve nesta tabela.
revoke insert, update, delete on table public.categories from anon;

-- ── Integridade dos identificadores ──────────────────────────────────────────
-- A migration de categorias hierárquicas removeu `posts_category_check` para
-- permitir subcategorias dinâmicas, e não colocou nada no lugar — a coluna
-- virou texto livre. Não dá para recriar a lista fixa (o ponto era torná-la
-- dinâmica), mas dá para exigir formato de slug, que é o que impede uma string
-- arbitrária de virar categoria por um caminho que não passou pela validação da
-- aplicação. Mesmo regex de `salvarCategoriaAction`.
--
-- Conferido contra os dados reais antes de escrever: os 24 posts e os 7
-- registros de categories passam. A migration não vai falhar por dado legado.
alter table public.posts drop constraint if exists posts_category_slug;
alter table public.posts
  add constraint posts_category_slug
  check (category ~ '^[a-z0-9]+([_-][a-z0-9]+)*$' and length(category) between 2 and 40);

alter table public.categories drop constraint if exists categories_id_slug;
alter table public.categories
  add constraint categories_id_slug
  check (id ~ '^[a-z0-9]+([_-][a-z0-9]+)*$' and length(id) between 2 and 40);

-- A FK `parent_id -> categories(id)` aceita, por si só, uma linha apontar para
-- si mesma. Combinado com o `on delete cascade` da mesma coluna, isso cria uma
-- categoria que se apaga sozinha, e a montagem da árvore no painel entra em
-- laço. A aplicação já recusa em `salvarCategoriaAction`; aqui é a garantia que
-- vale para qualquer caminho, inclusive um UPDATE feito à mão no painel do
-- Supabase. Conferido: nenhum dos 7 registros atuais viola.
alter table public.categories drop constraint if exists categories_sem_auto_pai;
alter table public.categories
  add constraint categories_sem_auto_pai
  check (parent_id is null or parent_id <> id);

comment on constraint posts_category_slug on public.posts is
  'Substitui o antigo posts_category_check, removido quando as categorias viraram dinâmicas. Garante formato de slug, não a lista de valores.';
