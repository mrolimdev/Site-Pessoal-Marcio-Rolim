import Link from 'next/link'

import { ArrowLeftIcon, ChevronRightIcon } from '@/components/icons'

/**
 * Paginação da listagem.
 *
 * A página 1 aponta para o caminho limpo (`/blog`), sem `?pagina=1`: duas URLs
 * com o mesmo conteúdo é conteúdo duplicado para o buscador, e o canonical da
 * listagem aponta para a URL limpa.
 */
function href(caminhoBase: string, pagina: number): string {
  return pagina <= 1 ? caminhoBase : `${caminhoBase}?pagina=${pagina}`
}

/**
 * Janela de números: primeira, última, a atual e as vizinhas. O resto vira
 * reticências — com 40 posts publicados a barra continua do mesmo tamanho.
 */
function janela(pagina: number, totalPaginas: number): (number | 'gap')[] {
  const paginas = new Set<number>([1, totalPaginas, pagina - 1, pagina, pagina + 1])
  const visiveis = [...paginas].filter((n) => n >= 1 && n <= totalPaginas).sort((a, b) => a - b)

  const comLacunas: (number | 'gap')[] = []
  let anterior = 0

  for (const n of visiveis) {
    if (anterior && n - anterior > 1) comLacunas.push('gap')
    comLacunas.push(n)
    anterior = n
  }

  return comLacunas
}

const BOTAO =
  'flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border px-3 text-sm font-medium transition-all'
const BOTAO_INATIVO =
  'border-slate-200 bg-white/70 text-slate-600 hover:border-amber-500/40 hover:text-amber-700 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:text-amber-400'
const BOTAO_ATUAL =
  'border-transparent bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
const BOTAO_DESABILITADO =
  'cursor-not-allowed border-slate-200/60 bg-transparent text-slate-300 dark:border-slate-800 dark:text-slate-700'

export function Paginacao({
  pagina,
  totalPaginas,
  caminhoBase = '/blog',
}: {
  pagina: number
  totalPaginas: number
  caminhoBase?: string
}) {
  if (totalPaginas <= 1) return null

  const temAnterior = pagina > 1
  const temProxima = pagina < totalPaginas

  return (
    <nav aria-label="Paginação do blog" className="flex flex-wrap items-center justify-center gap-2">
      {temAnterior ? (
        <Link href={href(caminhoBase, pagina - 1)} rel="prev" className={`${BOTAO} ${BOTAO_INATIVO}`}>
          <ArrowLeftIcon className="h-4 w-4" />
          Anterior
        </Link>
      ) : (
        <span aria-hidden="true" className={`${BOTAO} ${BOTAO_DESABILITADO}`}>
          <ArrowLeftIcon className="h-4 w-4" />
          Anterior
        </span>
      )}

      {janela(pagina, totalPaginas).map((item, i) =>
        item === 'gap' ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="px-1 text-slate-400 dark:text-slate-600"
          >
            …
          </span>
        ) : item === pagina ? (
          <span key={item} aria-current="page" className={`${BOTAO} ${BOTAO_ATUAL}`}>
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={href(caminhoBase, item)}
            aria-label={`Página ${item}`}
            className={`${BOTAO} ${BOTAO_INATIVO}`}
          >
            {item}
          </Link>
        ),
      )}

      {temProxima ? (
        <Link href={href(caminhoBase, pagina + 1)} rel="next" className={`${BOTAO} ${BOTAO_INATIVO}`}>
          Próxima
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${BOTAO} ${BOTAO_DESABILITADO}`}>
          Próxima
          <ChevronRightIcon className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
