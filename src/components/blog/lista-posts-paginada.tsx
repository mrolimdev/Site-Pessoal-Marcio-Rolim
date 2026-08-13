'use client'

import { useState } from 'react'

import { PostCard } from '@/components/blog/post-card'
import { ChevronDownIcon } from '@/components/icons'
import type { IconProps } from '@/components/icons'
import type { PostResumo } from '@/lib/blog/queries'

/**
 * Listagem de posts em grade, seis por vez, com "Carregar mais".
 *
 * ─── Por que grade e não a esteira ──────────────────────────────────────────
 *
 * A esteira infinita (`CarrosselPosts`) é boa para passear, e ruim para
 * procurar: não tem começo nem fim visíveis, e não há onde encaixar um botão de
 * "carregar mais" numa fita que dá a volta. Quem filtrou por categoria ou tag
 * quer ver o que existe e saber quanto falta — isso é uma lista.
 *
 * ─── Por que o corte é no cliente ───────────────────────────────────────────
 *
 * Os posts já chegam todos: `/blog` filtra por aba, busca e categoria na
 * memória do navegador, e a página de tag é pré-renderizada. Buscar de novo no
 * banco a cada clique seria uma ida à rede para mostrar dado que já está aqui —
 * e, em `/blog/tag`, jogaria a rota para dinâmica e apagaria o pré-render.
 */

/** Quantos posts entram por vez — os primeiros e os de cada clique. */
const POR_PAGINA = 6

const ACENTOS = {
  ceu: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400',
  ambar: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400',
} as const

export function ListaPostsPaginada({
  posts,
  titulo,
  descricao,
  Icone,
  acento,
  prioridadeNoPrimeiro = false,
}: {
  /**
   * Precisa ser estável entre renders (`useMemo` no pai): mudar a identidade da
   * lista é o sinal de "filtro novo", e a contagem volta para os seis primeiros.
   */
  posts: PostResumo[]
  titulo: string
  descricao: string
  /** Selo de área no cabeçalho, quando a lista é de uma área só. */
  Icone?: (props: IconProps) => React.JSX.Element
  acento?: keyof typeof ACENTOS
  /** `true` quando esta é a primeira lista da página: pré-carrega a capa. */
  prioridadeNoPrimeiro?: boolean
}) {
  const [visiveis, setVisiveis] = useState(POR_PAGINA)

  // Trocar de aba, buscar ou filtrar troca a lista, e a contagem tem de voltar
  // ao começo — senão quem tinha carregado 30 posts cai numa categoria de 4 já
  // com tudo aberto, e o botão some sem nunca ter sido clicado.
  //
  // Ajuste durante a renderização, e não num efeito: assim o React já
  // re-renderiza com o número certo, sem passar um quadro pela tela errada. É o
  // mesmo padrão do `BannerDestaques`.
  const [listaVista, setListaVista] = useState(posts)
  if (listaVista !== posts) {
    setListaVista(posts)
    setVisiveis(POR_PAGINA)
  }

  if (posts.length === 0) return null

  const exibidos = posts.slice(0, visiveis)
  const restantes = posts.length - exibidos.length

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-3">
          {Icone && acento && (
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACENTOS[acento]}`}
            >
              <Icone className="h-5 w-5" />
            </span>
          )}

          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {titulo}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {posts.length}
              </span>
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{descricao}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {exibidos.map((post, i) => (
          <PostCard
            key={post.slug}
            post={post}
            prioridade={prioridadeNoPrimeiro && i === 0}
          />
        ))}
      </div>

      {restantes > 0 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setVisiveis((n) => n + POR_PAGINA)}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-500/20 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:border-amber-400/30 dark:text-amber-300"
          >
            Carregar mais
            <span className="tabular-nums opacity-70">
              ({Math.min(POR_PAGINA, restantes)} de {restantes})
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>

          {/* Dizer onde a pessoa está na lista é o que o botão sozinho não diz:
              sem isto, "Carregar mais" não distingue faltar 2 de faltar 200. */}
          <p className="text-xs text-slate-400 tabular-nums dark:text-slate-500">
            Mostrando {exibidos.length} de {posts.length}
          </p>
        </div>
      )}
    </section>
  )
}
