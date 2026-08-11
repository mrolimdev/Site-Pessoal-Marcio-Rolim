'use client'

import { useActionState } from 'react'

import { despublicarPost, excluirPost, publicarPost } from '@/actions/posts'
import type { StatusPost } from '@/lib/blog/constantes'

/**
 * Ações de uma linha da tabela de posts.
 *
 * Recebe só id/título/status — nunca a linha crua do banco. O `id` viaja num
 * input escondido e é revalidado na action: os botões escondidos aqui não
 * protegem nada, porque o POST da Server Action pode ser feito à mão.
 */
type Props = {
  id: string
  titulo: string
  status: StatusPost
}

const CLASSE_ACAO =
  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export function AcoesPost({ id, titulo, status }: Props) {
  const publicado = status === 'published'

  // A action troca conforme o status. `useActionState` lê a função no momento
  // do dispatch, então alternar entre as duas entre renders é seguro.
  const [estadoStatus, alternarStatus, pendenteStatus] = useActionState(
    publicado ? despublicarPost : publicarPost,
    {},
  )

  const [estadoExcluir, excluir, pendenteExcluir] = useActionState(excluirPost, {})

  const erro = estadoStatus.erro ?? estadoExcluir.erro

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <form action={alternarStatus}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pendenteStatus}
            className={`${CLASSE_ACAO} ${
              publicado
                ? 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {pendenteStatus ? '…' : publicado ? 'Despublicar' : 'Publicar'}
          </button>
        </form>

        <form
          action={excluir}
          onSubmit={(evento) => {
            // Exclusão apaga o post e todas as revisões dele (ON DELETE CASCADE).
            if (!window.confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`)) {
              evento.preventDefault()
            }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pendenteExcluir}
            className={`${CLASSE_ACAO} border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950`}
          >
            {pendenteExcluir ? '…' : 'Excluir'}
          </button>
        </form>
      </div>

      {erro && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {erro}
        </p>
      )}
    </div>
  )
}
