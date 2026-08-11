import type { Metadata } from 'next'

import { CabecalhoBlog, CascaBlog } from '@/components/blog/casca-blog'
import { PostCard, PostCardDestaque } from '@/components/blog/post-card'
import { SITE, urlAbsoluta } from '@/content/site'
import { listarPostsAgrupadosPorSecoes } from '@/lib/blog/queries'

export const revalidate = 3600

const TITULO = 'Blog'
const DESCRICAO =
  'Artigos sobre inteligência artificial, automação e negócios, lado a lado com reflexões sobre fé e vida cristã.'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITULO,
    description: DESCRICAO,
    alternates: {
      canonical: '/blog',
      types: { 'application/rss+xml': '/blog/rss.xml' },
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'website',
      url: urlAbsoluta('/blog'),
      title: `${TITULO} | ${SITE.name}`,
      description: DESCRICAO,
      siteName: SITE.siteName,
      locale: SITE.locale,
    },
  }
}

export default async function BlogPage() {
  const { postsTecnologia, postsVidaCrista, totalTecnologia, totalVidaCrista } =
    await listarPostsAgrupadosPorSecoes()

  const destaqueTech = postsTecnologia[0]
  const demaisTech = postsTecnologia.slice(1)

  const destaqueFe = postsVidaCrista[0]
  const demaisFe = postsVidaCrista.slice(1)

  return (
    <CascaBlog voltar={{ href: '/', rotulo: 'Início' }}>
      <CabecalhoBlog>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="#tecnologia"
            className="w-fit rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-sky-700 transition-all hover:bg-sky-500/20 dark:text-sky-300"
          >
            💻 Tecnologia & Automação ({totalTecnologia})
          </a>
          <a
            href="#vida-crista"
            className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-amber-700 transition-all hover:bg-amber-500/20 dark:text-amber-300"
          >
            ✝️ Vida Cristã & Fé ({totalVidaCrista})
          </a>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {TITULO}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          {DESCRICAO}
        </p>
      </CabecalhoBlog>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-12">
        {/* ─── SEÇÃO 1: TECNOLOGIA & INOVAÇÃO ─── */}
        <section id="tecnologia" className="scroll-mt-24 flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-xl text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                💻
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Tecnologia, IA & Automação
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Engenharia de software, inteligência artificial, agentes e automação de processos
                </p>
              </div>
            </div>
          </div>

          {postsTecnologia.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum post em tecnologia ainda.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {destaqueTech && <PostCardDestaque post={destaqueTech} />}
              {demaisTech.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {demaisTech.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ─── SEÇÃO 2: VIDA CRISTÃ & FÉ ─── */}
        <section
          id="vida-crista"
          className="scroll-mt-24 flex flex-col gap-8 rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-500/5 via-amber-500/[0.02] to-transparent p-6 sm:p-8 dark:from-amber-950/20 dark:via-amber-950/5 dark:to-transparent"
        >
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-xl text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                ✝️
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Vida Cristã & Reflexões
                </h2>
                <p className="text-sm text-amber-900/80 dark:text-amber-300/80">
                  Fé, propósito, sabedoria e vida com Deus no mundo hiperconectado
                </p>
              </div>
            </div>
          </div>

          {postsVidaCrista.length === 0 ? (
            <p className="text-sm text-slate-500">Em breve reflexões sobre fé e vida cristã.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {destaqueFe && <PostCardDestaque post={destaqueFe} />}
              {demaisFe.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {demaisFe.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </CascaBlog>
  )
}
