'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { PostCardMinimalista } from '@/components/blog/post-card-minimalista'
import type { PostResumo } from '@/lib/blog/queries'

type Props = {
  posts: PostResumo[]
}

export function LatestPostsCarousel({ posts }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      if (container.scrollLeft <= 10) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: -360, behavior: 'smooth' })
      }
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const maxScroll = container.scrollWidth - container.clientWidth
      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: 360, behavior: 'smooth' })
      }
    }
  }

  // Rotação automática a cada 3.5 segundos
  useEffect(() => {
    if (!posts || posts.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const maxScroll = container.scrollWidth - container.clientWidth
        if (container.scrollLeft >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          container.scrollBy({ left: 360, behavior: 'smooth' })
        }
      }
    }, 3500)

    return () => clearInterval(timer)
  }, [posts, isPaused])

  if (!posts || posts.length === 0) {
    return null
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

        {/* CARROSSEL HORIZONTAL COM ROTAÇÃO AUTOMÁTICA */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex items-stretch gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {posts.map((post) => (
            <PostCardMinimalista
              key={post.slug}
              post={post}
              sizes="(max-width: 640px) 280px, 340px"
              className="w-[280px] shrink-0 snap-start sm:w-[340px]"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
