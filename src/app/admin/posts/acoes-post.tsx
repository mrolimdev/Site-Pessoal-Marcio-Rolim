'use client'

import { useActionState } from 'react'

import { despublicarPost, excluirPost, publicarPost } from '@/actions/posts'
import type { StatusPost } from '@/lib/blog/constantes'

type Props = {
  id: string
  titulo: string
  status: StatusPost
}

const CLASSE_ICONE_BOTAO =
  'cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50'

export function AcoesPost({ id, titulo, status }: Props) {
  const publicado = status === 'published'

  const [estadoStatus, alternarStatus, pendenteStatus] = useActionState(
    publicado ? despublicarPost : publicarPost,
    {}
  )

  const [estadoExcluir, excluir, pendenteExcluir] = useActionState(excluirPost, {})

  const erro = estadoStatus.erro ?? estadoExcluir.erro

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {/* BOTÃO DISCRETO DE ALTERNAR PUBLICAÇÃO */}
        <form action={alternarStatus}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pendenteStatus}
            title={publicado ? 'Despublicar artigo' : 'Publicar artigo agora'}
            className={`${CLASSE_ICONE_BOTAO} ${
              publicado
                ? 'border border-slate-200 bg-slate-100 text-slate-600 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
            }`}
          >
            {pendenteStatus ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : publicado ? (
              '⚡'
            ) : (
              '🚀'
            )}
          </button>
        </form>

        {/* BOTÃO DISCRETO DE EXCLUIR */}
        <form
          action={excluir}
          onSubmit={(evento) => {
            if (!window.confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`)) {
              evento.preventDefault()
            }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pendenteExcluir}
            title="Excluir artigo"
            className={`${CLASSE_ICONE_BOTAO} border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-500 hover:text-white dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white`}
          >
            {pendenteExcluir ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              '🗑️'
            )}
          </button>
        </form>
      </div>

      {erro && (
        <p role="alert" className="text-[0.65rem] font-bold text-rose-600 dark:text-rose-400">
          ⚠️ {erro}
        </p>
      )}
    </div>
  )
}
