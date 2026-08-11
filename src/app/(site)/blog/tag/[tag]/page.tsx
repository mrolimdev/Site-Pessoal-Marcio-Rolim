import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CabecalhoBlog, CascaBlog } from '@/components/blog/casca-blog'
import { PostCard } from '@/components/blog/post-card'
import { ChevronRightIcon } from '@/components/icons'
import { SITE, urlAbsoluta } from '@/content/site'
import { listarPosts, listarTagsPublicadas } from '@/lib/blog/queries'

/**
 * Posts de uma tag.
 *
 * Página ESTÁTICA de propósito, sem `?pagina=`: ler search param jogaria a rota
 * para dinâmica e apagaria o pré-render que `generateStaticParams` acabou de
 * conquistar. Uma tag mostra as 24 mais recentes e, passando disso, manda para
 * a listagem — que é onde a paginação vive.
 */
export const revalidate = 3600

const POSTS_POR_TAG = 24

export async function generateStaticParams() {
  const tags = await listarTagsPublicadas()
  return tags.map((tag) => ({ tag }))
}

/**
 * O segmento vem da URL. Se o Next já entregou decodificado, `decodeURIComponent`
 * é inofensivo; se veio percent-encoded, é ele que devolve o texto original. Uma
 * tag com `%` solto faz a função lançar — daí o try/catch, que nesse caso
 * devolve o valor como está, que é justamente o certo.
 */
function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}

type Props = { params: Promise<{ tag: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodificar((await params).tag)
  const caminho = `/blog/tag/${encodeURIComponent(tag)}`
  const descricao = `Posts de ${SITE.name} marcados com "${tag}".`

  return {
    title: `#${tag}`,
    description: descricao,
    alternates: { canonical: caminho },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'website',
      url: urlAbsoluta(caminho),
      title: `#${tag} | ${SITE.name}`,
      description: descricao,
      siteName: SITE.siteName,
      locale: SITE.locale,
    },
  }
}

export default async function TagPage({ params }: Props) {
  const tag = decodificar((await params).tag)
  const { posts, total } = await listarPosts({ tag, porPagina: POSTS_POR_TAG })

  // Tag sem nenhum post publicado não é uma página vazia: é uma página que não
  // existe. 404 evita que endereços inventados virem conteúdo raso indexado.
  if (posts.length === 0) notFound()

  return (
    <CascaBlog voltar={{ href: '/blog', rotulo: 'Blog' }}>
      <CabecalhoBlog>
        <span className="w-fit rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-700 dark:text-amber-400">
          {total} {total === 1 ? 'post' : 'posts'}
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          <span className="text-amber-600 dark:text-amber-400">#</span>
          {tag}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          Tudo o que foi publicado sob esta tag, do mais recente para o mais antigo.
        </p>
      </CabecalhoBlog>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} prioridade={i === 0} />
          ))}
        </div>

        {total > posts.length && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Mostrando os {posts.length} posts mais recentes de {total}.{' '}
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 font-medium text-amber-700 underline decoration-amber-500/40 underline-offset-4 hover:decoration-amber-500 dark:text-amber-400"
            >
              Ver a listagem completa
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </p>
        )}
      </main>
    </CascaBlog>
  )
}
