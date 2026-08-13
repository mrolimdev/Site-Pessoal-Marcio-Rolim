import 'server-only'

import { revalidatePath, updateTag } from 'next/cache'

import { TAG_CACHE_POSTS } from '@/lib/blog/queries'

/**
 * Invalidação do cache depois de escrever um post.
 *
 * ─── O que estava quebrado ───────────────────────────────────────────────────
 * As actions chamavam `revalidatePath('/blog')` e `revalidatePath('/blog/slug')`
 * e paravam aí. Só que um post publicado aparece em muito mais lugares:
 *
 *   /                 carrossel de posts recentes da home
 *   /blog/tag/*       uma página por tag
 *   /blog/rss.xml     feed, com `revalidate = 3600`
 *   /sitemap.xml      idem
 *
 * Todas com revalidação de 1 hora. Na prática: o post saía no ar em /blog na
 * hora e demorava até uma hora para existir no feed, no sitemap e na home.
 *
 * E `lib/blog/queries.ts` já tinha criado `TAG_CACHE_POSTS`, com um comentário
 * dizendo que era o "botão de publicar agora" do painel — mas `revalidateTag`
 * não era chamado em lugar nenhum do projeto. O mecanismo foi projetado e
 * esquecido; aqui ele finalmente é ligado.
 *
 * A tag é o que faz o trabalho pesado: TODA consulta pública do blog passa pelo
 * `fetchCacheado`, que a carimba. Invalidar a tag derruba o Data Cache de todas
 * elas de uma vez, independentemente da rota que as consumiu. Os
 * `revalidatePath` abaixo cuidam do Full Route Cache das páginas já renderizadas.
 *
 * ─── Por que `updateTag` e não `revalidateTag` ───────────────────────────────
 * No Next 16 são duas APIs com semânticas diferentes:
 *
 *   revalidateTag(tag, 'max')  marca como obsoleto; a próxima visita recebe o
 *                              conteúdo velho enquanto o novo carrega atrás.
 *   updateTag(tag)             expira na hora; a próxima requisição espera o
 *                              dado fresco. Só pode ser chamada de Server Action.
 *
 * Aqui é read-your-own-writes: quem clicou em "publicar" precisa ver o post
 * publicado ao voltar para o blog, não a versão anterior. Todos os chamadores
 * desta função são Server Actions, então a restrição de `updateTag` é atendida.
 * (`revalidateTag` sem o segundo argumento está DEPRECIADO nesta versão.)
 */
export function revalidarBlog(slugs: readonly (string | null | undefined)[] = []): void {
  // 1. Dados: derruba o cache de toda consulta ao PostgREST feita pelo blog.
  updateTag(TAG_CACHE_POSTS)

  // 2. Páginas: as rotas fixas.
  revalidatePath('/')
  revalidatePath('/blog')
  revalidatePath('/blog/rss.xml')
  revalidatePath('/sitemap.xml')
  // O índice que os motores generativos leem. Estava de fora: um post novo
  // levava até uma hora para existir no llms.txt, enquanto já estava no ar em
  // todo o resto do site.
  revalidatePath('/llms.txt')
  revalidatePath('/admin/posts')

  // 3. Páginas dinâmicas por parâmetro. O segundo argumento 'page' faz o Next
  // invalidar TODAS as instâncias da rota — não dá para enumerar as tags
  // afetadas sem reler o post antes e depois, e uma tag removida também precisa
  // que a página dela pare de listar o post.
  revalidatePath('/blog/tag/[tag]', 'page')

  // 4. Os slugs envolvidos. São vários porque renomear um post publicado afeta
  // DUAS URLs: a nova precisa aparecer, a antiga precisa parar de servir cache.
  for (const slug of new Set(slugs)) {
    if (slug) revalidatePath(`/blog/${slug}`)
  }
}
