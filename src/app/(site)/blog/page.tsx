import type { Metadata } from 'next'
import Image from 'next/image'

import { CabecalhoBlog, CascaBlog } from '@/components/blog/casca-blog'
import { ConteudoBlogAbas } from '@/components/blog/conteudo-blog-abas'
import { MEDIA, SITE, urlAbsoluta } from '@/content/site'
import { listarPostsAgrupadosPorSecoes, obterEstatisticasWidgets } from '@/lib/blog/queries'

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
  const [{ postsTecnologia, postsVidaCrista }, dadosWidgets] = await Promise.all([
    listarPostsAgrupadosPorSecoes(),
    obterEstatisticasWidgets(),
  ])

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
          </div>
        </div>
      </CabecalhoBlog>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <ConteudoBlogAbas
          postsTecnologia={postsTecnologia}
          postsVidaCrista={postsVidaCrista}
          dadosWidgets={dadosWidgets}
        />
      </main>
    </CascaBlog>
  )
}
