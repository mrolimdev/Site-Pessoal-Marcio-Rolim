'use client'

import { useState } from 'react'
import Link from 'next/link'

import type { RamoCategoria, TagComContagem } from '@/lib/blog/queries'

/**
 * Card 1: Nuvem de Tags com Estética Premium
 */
export function CardNuvemDeTags({ tags }: { tags: TagComContagem[] }) {
  if (!tags || tags.length === 0) return null

  // Limita à caixa de 30 tags
  const tagsExibidas = tags.slice(0, 30)

  return (
    <aside className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-slate-300 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80 dark:hover:border-slate-700">
      {/* Mancha de brilho de fundo */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />

      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800/80">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-base text-amber-600 shadow-xs dark:from-amber-500/30 dark:to-orange-500/20 dark:text-amber-400">
          🏷️
        </span>
        <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          Nuvem de Tags
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-3">
        {tagsExibidas.map((t) => {
          const eTech = t.origem === 'tecnologia'
          const eFe = t.origem === 'fe'

          let classeCor = 'text-emerald-700 hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200'
          if (eTech) {
            classeCor = 'text-sky-700 hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200'
          } else if (eFe) {
            classeCor = 'text-amber-700 hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200'
          }

          return (
            <Link
              key={t.nome}
              href={`/blog/tag/${encodeURIComponent(t.nome)}`}
              className={`text-sm font-semibold ${classeCor} transition-all duration-200 hover:scale-110 hover:underline decoration-current/40 underline-offset-4`}
              title={`${t.count} ${t.count === 1 ? 'post' : 'posts'} (${t.origem === 'tecnologia' ? 'Tecnologia' : t.origem === 'fe' ? 'Vida Cristã' : 'Geral'})`}
            >
              #{t.nome}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}

/**
 * Card 2: Árvore de Categorias Interativa com Filtro ao Clicar na Linha
 */
export function CardArvoreDeCategorias({
  ramos,
  categoriaSelecionada,
  onSelecionarCategoria,
}: {
  ramos: RamoCategoria[]
  categoriaSelecionada?: string | null
  onSelecionarCategoria?: (categoriaChave: string | null) => void
}) {
  const [ramosAbertos, setRamosAbertos] = useState<Record<string, boolean>>({
    'Tecnologia & Inovação': true,
    'Vida Cristã & Fé': true,
  })

  const alternarRamo = (titulo: string) => {
    setRamosAbertos((prev) => ({ ...prev, [titulo]: !prev[titulo] }))
  }

  if (!ramos || ramos.length === 0) return null

  return (
    <aside className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-slate-300 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80 dark:hover:border-slate-700">
      {/* Mancha de brilho de fundo */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl transition-all group-hover:bg-sky-500/20" />

      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 text-base text-sky-600 shadow-xs dark:from-sky-500/30 dark:to-blue-500/20 dark:text-sky-400">
            🌳
          </span>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Árvore de Categorias
          </h3>
        </div>

        {categoriaSelecionada && onSelecionarCategoria && (
          <button
            type="button"
            onClick={() => onSelecionarCategoria(null)}
            className="cursor-pointer font-mono text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-3 font-mono text-sm">
        {ramos.map((ramo) => {
          const aberto = ramosAbertos[ramo.titulo] ?? true

          return (
            <div key={ramo.titulo} className="flex flex-col gap-1.5">
              {/* Tronco Principal do Ramo */}
              <button
                type="button"
                onClick={() => alternarRamo(ramo.titulo)}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-slate-100/90 px-3.5 py-2.5 text-left font-bold text-slate-800 shadow-2xs transition-all hover:bg-slate-200/90 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{aberto ? '📂' : '📁'}</span>
                  <span className="text-xs font-bold">
                    {ramo.icone} {ramo.titulo}
                  </span>
                </div>
                <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[0.7rem] text-slate-600 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                  {ramo.totalRamo}
                </span>
              </button>

              {/* Galhos / Subcategorias Clicáveis */}
              {aberto && (
                <div className="ml-3.5 flex flex-col border-l-2 border-slate-200/80 pl-3.5 dark:border-slate-800">
                  {ramo.subcategorias.map((sub, idx) => {
                    const eUltimo = idx === ramo.subcategorias.length - 1
                    const selecionado = categoriaSelecionada === sub.chave

                    return (
                      <button
                        type="button"
                        key={sub.chave}
                        onClick={() => {
                          if (onSelecionarCategoria) {
                            onSelecionarCategoria(selecionado ? null : sub.chave)
                          }
                        }}
                        className={`group/linha flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-left transition-all ${
                          selecionado
                            ? 'bg-amber-500/15 font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                            : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 transition-colors group-hover/linha:text-amber-500 dark:text-slate-600">
                            {eUltimo ? '└─' : '├─'}
                          </span>
                          <span
                            className={`text-xs transition-colors ${
                              selecionado
                                ? 'font-bold text-amber-700 dark:text-amber-300'
                                : 'text-slate-600 group-hover/linha:text-slate-900 dark:text-slate-300 dark:group-hover/linha:text-white'
                            }`}
                          >
                            {sub.rotulo}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-[0.7rem] ${
                            selecionado
                              ? 'font-bold text-amber-700 dark:text-amber-300'
                              : 'text-slate-400 group-hover/linha:text-slate-600 dark:text-slate-500 dark:group-hover/linha:text-slate-400'
                          }`}
                        >
                          ({sub.count})
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
