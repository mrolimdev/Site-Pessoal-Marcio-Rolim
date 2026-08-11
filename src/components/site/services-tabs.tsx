'use client'

import { useState, type ReactNode } from 'react'

import { CodeIcon, HeartIcon } from '@/components/icons'
import { SERVICES, SKILLS_BY_TAB, type ServicesTabId } from '@/content/home'

/**
 * Seletor de abas (Tecnologia / Pastoral) e a grade de cards que ele controla.
 * Origem: App.tsx:518-556.
 *
 * O cabeçalho da seção (olho, título e subtítulo) chega por `children`: é texto
 * estático, renderizado no servidor, e só passa por aqui porque no markup
 * original ele divide a mesma `<div className="text-center mb-14">` com as abas.
 * Manter isso preserva a árvore de DOM sem levar o texto para o bundle.
 */

const FUNDO_ABAS =
  'bg-stone-100 border-stone-200/60 dark:bg-slate-800/60 dark:border-slate-700/40'
const ABA_ATIVA = 'bg-white shadow-lg dark:bg-slate-700'
const ABA_INATIVA =
  'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'

const COR_ABA_ATIVA: Record<ServicesTabId, string> = {
  tech: 'text-emerald-600 dark:text-emerald-400',
  pastoral: 'text-amber-600 dark:text-amber-400',
}

const ICONE_ABA = {
  tech: CodeIcon,
  pastoral: HeartIcon,
} as const satisfies Record<ServicesTabId, (props: { className?: string }) => ReactNode>

const CARTAO =
  'bg-white/80 border-stone-200/80 dark:bg-slate-900/60 dark:border-slate-800/60'
const CARTAO_HOVER =
  'hover:bg-white hover:border-stone-300 dark:hover:bg-slate-800/80 dark:hover:border-slate-700/60'

export function ServicesTabs({ children }: { children: ReactNode }) {
  const [abaAtiva, setAbaAtiva] = useState<ServicesTabId>(SERVICES.defaultTab)

  return (
    <>
      <div className="text-center mb-14">
        {children}

        <div className={`inline-flex ${FUNDO_ABAS} border p-1.5 rounded-full`}>
          {SERVICES.tabs.map((aba) => {
            const Icone = ICONE_ABA[aba.id]
            const ativa = abaAtiva === aba.id
            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => setAbaAtiva(aba.id)}
                aria-pressed={ativa}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${
                  ativa ? `${ABA_ATIVA} ${COR_ABA_ATIVA[aba.id]}` : ABA_INATIVA
                }`}
              >
                <Icone className="h-4 w-4" />
                {aba.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SKILLS_BY_TAB[abaAtiva].map((skill, indice) => (
          <div
            key={skill.title}
            className={`group ${CARTAO} border rounded-2xl p-6 transition-all duration-300 ${CARTAO_HOVER} hover:shadow-xl hover:-translate-y-1`}
            style={{ animationDelay: `${indice * 80}ms` }}
          >
            <div className="text-4xl mb-5">{skill.icon}</div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
              {skill.title}
            </h3>
            <p className="text-stone-500 dark:text-slate-400 text-sm leading-relaxed">
              {skill.description}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
