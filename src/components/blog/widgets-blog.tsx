'use client'

import { useState } from 'react'
import Link from 'next/link'

import type { RamoCategoria, TagComContagem } from '@/lib/blog/queries'

/**
 * Card 1: Nuvem de Tags
 */
export function CardNuvemDeTags({ tags }: { tags: TagComContagem[] }) {
  if (!tags || tags.length === 0) return null

  // Maior contagem para calcular escala relativa
  const maxCount = Math.max(...tags.map((t) => t.count), 1)

  return (
    <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-base text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
          🏷️
        </span>
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Nuvem de Tags
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {tags.map((t) => {
          // Varia o tamanho visual de acordo com a frequência
          const peso = t.count / maxCount
          const tamanho = peso > 0.6 ? 'text-sm font-bold' : peso > 0.3 ? 'text-xs font-semibold' : 'text-[0.75rem] font-medium'

          return (
            <Link
              key={t.nome}
              href={`/blog/tag/${encodeURIComponent(t.nome)}`}
              className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 ${tamanho} text-slate-700 transition-all hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/20 dark:hover:text-amber-300`}
            >
              <span>#{t.nome}</span>
              <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 font-mono text-[0.65rem] text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                {t.count}
              </span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}

/**
 * Card 2: Árvore de Categorias
 */
export function CardArvoreDeCategorias({ ramos }: { ramos: RamoCategoria[] }) {
  const [ramosAbertos, setRamosAbertos] = useState<Record<string, boolean>>({
    'Tecnologia & Inovação': true,
    'Vida Cristã & Fé': true,
  })

  const alternarRamo = (titulo: string) => {
    setRamosAbertos((prev) => ({ ...prev, [titulo]: !prev[titulo] }))
  }

  if (!ramos || ramos.length === 0) return null

  return (
    <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-base text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
          🌳
        </span>
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Árvore de Categorias
        </h3>
      </div>

      <div className="flex flex-col gap-3 font-mono text-sm">
        {ramos.map((ramo) => {
          const aberto = ramosAbertos[ramo.titulo] ?? true

          return (
            <div key={ramo.titulo} className="flex flex-col gap-1.5">
              {/* Tronco Principal do Ramo */}
              <button
                type="button"
                onClick={() => alternarRamo(ramo.titulo)}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-slate-100/80 px-3 py-2 text-left font-bold text-slate-800 transition-colors hover:bg-slate-200/80 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span>{aberto ? '📂' : '📁'}</span>
                  <span>
                    {ramo.icone} {ramo.titulo}
                  </span>
                </div>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-600 shadow-xs dark:bg-slate-900 dark:text-slate-400">
                  {ramo.totalRamo}
                </span>
              </button>

              {/* Galhos / Subcategorias */}
              {aberto && (
                <div className="ml-3 flex flex-col border-l-2 border-slate-200 pl-3 dark:border-slate-800">
                  {ramo.subcategorias.map((sub, idx) => {
                    const eUltimo = idx === ramo.subcategorias.length - 1
                    return (
                      <div
                        key={sub.chave}
                        className="flex items-center justify-between py-1.5 text-xs transition-colors hover:text-amber-600 dark:hover:text-amber-400"
                      >
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="text-slate-400 dark:text-slate-600">
                            {eUltimo ? '└─' : '├─'}
                          </span>
                          <span>{sub.rotulo}</span>
                        </div>
                        <span className="font-semibold text-slate-500 dark:text-slate-500">
                          ({sub.count})
                        </span>
                      </div>
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
