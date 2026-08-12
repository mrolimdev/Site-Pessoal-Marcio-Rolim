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
    <CascaBlog semBarraFlutuante>
      {/*
        O cabeçalho é Server Component e entra como filho da ilha de cliente:
        assim a barra `sticky` de navegação pode ser renderizada acima dele sem
        que a foto e o texto virem JavaScript enviado ao navegador.
      */}
      <ConteudoBlogAbas
        postsTecnologia={postsTecnologia}
        postsVidaCrista={postsVidaCrista}
        dadosWidgets={dadosWidgets}
      >
        <CabecalhoBlog compacto>
          {/* Lado a lado desde o celular: empilhado e centralizado, este bloco
              sozinho custava uns 300px antes de aparecer a primeira publicação. */}
          <div className="flex items-center gap-4 text-left sm:gap-6">
            <div className="group relative flex-none">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500 opacity-75 blur transition duration-500 group-hover:opacity-100" />
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-xl sm:h-24 sm:w-24 md:h-28 md:w-28 dark:border-slate-800">
                <Image
                  src={MEDIA.profileImageUrl}
                  alt={SITE.name}
                  fill
                  sizes="(min-width: 768px) 7rem, (min-width: 640px) 6rem, 4rem"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-amber-700 sm:px-3 sm:py-1 sm:text-xs dark:text-amber-300">
                  Consultor de Tecnologia
                </span>
                <span className="w-fit rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-sky-700 sm:px-3 sm:py-1 sm:text-xs dark:text-sky-300">
                  Pastor Evangélico
                </span>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                {SITE.name}
              </h1>
            </div>
          </div>

          {/* Fora do bloco da foto para ocupar a largura toda no celular, em vez
              de espremer numa coluna estreita ao lado do retrato. */}
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
            {DESCRICAO}
          </p>
        </CabecalhoBlog>
      </ConteudoBlogAbas>
    </CascaBlog>
  )
}
