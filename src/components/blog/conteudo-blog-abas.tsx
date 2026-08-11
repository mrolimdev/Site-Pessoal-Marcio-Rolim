'use client'

import { useState } from 'react'

import { PostCard, PostCardDestaque } from '@/components/blog/post-card'
import type { PostResumo } from '@/lib/blog/queries'

type Aba = 'todas' | 'tecnologia' | 'fe'

export function ConteudoBlogAbas({
  postsTecnologia,
  postsVidaCrista,
}: {
  postsTecnologia: PostResumo[]
  postsVidaCrista: PostResumo[]
}) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('todas')

  const totalTech = postsTecnologia.length
  const totalFe = postsVidaCrista.length
  const totalGeral = totalTech + totalFe

  const destaqueTech = postsTecnologia[0]
  const demaisTech = postsTecnologia.slice(1)

  const destaqueFe = postsVidaCrista[0]
  const demaisFe = postsVidaCrista.slice(1)

  return (
    <div className="flex flex-col gap-10">
      {/* ─── BARRA DE ABAS INTERATIVAS ─── */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 pb-6 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setAbaAtiva('todas')}
          className={`cursor-pointer rounded-full px-5 py-2.5 font-mono text-xs font-bold transition-all ${
            abaAtiva === 'todas'
              ? 'bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900'
              : 'border border-slate-200 bg-white/80 text-slate-600 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700'
          }`}
        >
          ✨ Todas as Publicações ({totalGeral})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('tecnologia')}
          className={`cursor-pointer rounded-full px-5 py-2.5 font-mono text-xs font-bold transition-all ${
            abaAtiva === 'tecnologia'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20 dark:bg-sky-500 dark:text-slate-950'
              : 'border border-sky-500/30 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300'
          }`}
        >
          💻 Tecnologia & Automação ({totalTech})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('fe')}
          className={`cursor-pointer rounded-full px-5 py-2.5 font-mono text-xs font-bold transition-all ${
            abaAtiva === 'fe'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 dark:bg-amber-500 dark:text-slate-950'
              : 'border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300'
          }`}
        >
          ✝️ Vida Cristã & Fé ({totalFe})
        </button>
      </div>

      {/* ─── CONTEÚDO DAS ABAS ─── */}
      <div className="flex flex-col gap-16">
        {/* SEÇÃO TECNOLOGIA */}
        {(abaAtiva === 'todas' || abaAtiva === 'tecnologia') && (
          <section id="tecnologia" className="animate-fade-in flex flex-col gap-8">
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
        )}

        {/* SEÇÃO VIDA CRISTÃ */}
        {(abaAtiva === 'todas' || abaAtiva === 'fe') && (
          <section id="vida-crista" className="animate-fade-in flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-xl text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  ✝️
                </span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Vida Cristã & Reflexões
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
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
        )}
      </div>
    </div>
  )
}
