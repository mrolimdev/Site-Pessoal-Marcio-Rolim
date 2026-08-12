'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { CategoriaBadge } from '@/components/blog/categoria-badge'
import { ImagemDeCapa } from '@/components/blog/imagem-capa'
import { ROTULO_CATEGORIA } from '@/lib/blog/constantes'
import type { PostResumo } from '@/lib/blog/queries'

type Props = {
  posts: PostResumo[]
}

function formatarDataCurta(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function LatestPostsCarousel({ posts }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  if (!posts || posts.length === 0) {
    return null
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' })
    }
  }

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-stone-50/50 dark:bg-slate-900/40 border-y border-stone-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 block">
              CONTEÚDOS & REFLEXÕES
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white tracking-tight">
              Últimas Publicações do Blog
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-slate-400 leading-relaxed">
              Reflexões sobre Inteligência Artificial, Automação de Processos, Liderança Técnica e Vida Cristã.
            </p>
          </div>

          {/* NAVEGAÇÃO E BOTÃO DE VER TODOS */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Artigos anteriores"
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition-all hover:bg-stone-100 hover:scale-105 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ←
              </button>

              <button
                type="button"
                onClick={scrollRight}
                aria-label="Próximos artigos"
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition-all hover:bg-stone-100 hover:scale-105 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                →
              </button>
            </div>

            <Link
              href="/blog"
              className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-xs font-extrabold text-amber-700 transition-all hover:bg-amber-500/20 dark:text-amber-300"
            >
              <span>Ver todos os artigos</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>

        {/* CARROSSEL HORIZONTAL ESPAÇOSO E DISCRETO */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {posts.map((post) => (
            <article
              key={post.slug}
              className="snap-start group flex w-[280px] sm:w-[340px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/40"
            >
              <div className="flex flex-col gap-4">
                {/* THUMBNAIL DA CAPA */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative aspect-video w-full overflow-hidden rounded-2xl border border-stone-100 bg-stone-100 dark:border-slate-800 dark:bg-slate-950"
                >
                  {post.capaUrl ? (
                    <ImagemDeCapa
                      src={post.capaUrl}
                      alt={post.capaAlt || post.titulo}
                      sizes="(max-width: 640px) 280px, 340px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-stone-400 dark:text-slate-600">
                      Blog Márcio Rolim
                    </div>
                  )}
                </Link>

                {/* METADADOS SUPERIORES */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <CategoriaBadge categoria={post.categoria} />

                  <span className="font-mono text-[0.7rem] font-semibold text-stone-400 dark:text-slate-500">
                    ⏱️ {post.minutosDeLeitura} min
                  </span>
                </div>

                {/* TÍTULO COMPLETO */}
                <Link href={`/blog/${post.slug}`} className="group/title">
                  <h3 className="line-clamp-2 text-base font-black text-stone-900 transition-colors group-hover/title:text-amber-600 dark:text-white dark:group-hover/title:text-amber-400 leading-snug">
                    {post.titulo}
                  </h3>
                </Link>

                {/* EXCERPT RESUMIDO */}
                {post.resumo && (
                  <p className="line-clamp-2 text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                    {post.resumo}
                  </p>
                )}
              </div>

              {/* RODAPÉ DO CARD */}
              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-slate-800/80">
                <span className="text-[0.7rem] font-medium text-stone-400 dark:text-slate-500">
                  {formatarDataCurta(post.publicadoEm)}
                </span>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 group-hover:translate-x-0.5 transition-transform dark:text-amber-400"
                >
                  <span>Ler artigo</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
