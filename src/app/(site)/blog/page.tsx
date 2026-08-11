import type { Metadata } from 'next'
import Image from 'next/image'

import { CabecalhoBlog, CascaBlog } from '@/components/blog/casca-blog'
import { PostCard, PostCardDestaque } from '@/components/blog/post-card'
import { MEDIA, SITE, urlAbsoluta } from '@/content/site'
import { listarPostsAgrupadosPorSecoes } from '@/lib/blog/queries'

export const revalidate = 60

const TITULO = 'Blog do Marcio Rolim'
const DESCRICAO =
  'Artigos sobre inteligência artificial, automação e desenvolvimento de software, lado a lado com reflexões sobre fé, sabedoria e vida cristã.'

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
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
          {/* Foto de Perfil */}
          <div className="relative group flex-none">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500 opacity-75 blur transition duration-500 group-hover:opacity-100" />
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white shadow-xl dark:border-slate-800 md:h-32 md:w-32">
              <Image
                src={MEDIA.profileImageUrl}
                alt={SITE.name}
                fill
                sizes="(min-width: 768px) 8rem, 7rem"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </div>
          </div>

          {/* Informações do Autor */}
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                Consultor de Tecnologia
              </span>
              <span className="w-fit rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                Pastor Evangélico
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
              {SITE.name}
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              {DESCRICAO}
            </p>

            {/* Badges de Navegação por Área */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <a
                href="#tecnologia"
                className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 font-mono text-xs font-bold text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-500/20 dark:text-sky-300"
              >
                <span>💻</span> Tecnologia & Automação ({totalTecnologia})
              </a>
              <a
                href="#vida-crista"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-mono text-xs font-bold text-amber-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-500/20 dark:text-amber-300"
              >
                <span>✝️</span> Vida Cristã & Fé ({totalVidaCrista})
              </a>
            </div>
          </div>
        </div>
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
