'use client'

import { useState } from 'react'
import Link from 'next/link'

import {
  ChevronDownIcon,
  CloseIcon,
  CodeIcon,
  CrossIcon,
  FolderTreeIcon,
  TagIcon,
} from '@/components/icons'
import type { IconProps } from '@/components/icons'
import type { RamoCategoria, TagComContagem } from '@/lib/blog/queries'

/**
 * Widgets da coluna lateral do blog: nuvem de tags e árvore de categorias.
 *
 * Os dois cartões dividem a mesma casca (`CartaoWidget`) de propósito — antes
 * cada um repetia a própria borda, sombra e cabeçalho, e as duas cópias já
 * tinham divergido. Trocar a moldura agora é um lugar só.
 *
 * Ícones vêm de `@/components/icons`, não de emoji: emoji muda de desenho por
 * sistema operacional, não herda `currentColor` e não acompanha o peso da
 * tipografia ao redor.
 */

// ─── Casca compartilhada ────────────────────────────────────────────────────

type Acento = 'ambar' | 'ceu'

const ACENTOS: Record<Acento, { brilho: string; chip: string }> = {
  ambar: {
    brilho: 'bg-amber-400/10 group-hover:bg-amber-400/20',
    chip: 'from-amber-500/25 to-orange-500/10 text-amber-600 dark:from-amber-400/25 dark:to-orange-400/10 dark:text-amber-400',
  },
  ceu: {
    brilho: 'bg-sky-400/10 group-hover:bg-sky-400/20',
    chip: 'from-sky-500/25 to-blue-500/10 text-sky-600 dark:from-sky-400/25 dark:to-blue-400/10 dark:text-sky-400',
  },
}

function CartaoWidget({
  acento,
  Icone,
  titulo,
  subtitulo,
  acao,
  children,
}: {
  acento: Acento
  Icone: (props: IconProps) => React.JSX.Element
  titulo: string
  subtitulo: string
  /** Botão opcional no canto direito do cabeçalho (ex.: "Ver todas"). */
  acao?: React.ReactNode
  children: React.ReactNode
}) {
  const cores = ACENTOS[acento]

  return (
    // `shrink-0` não é enfeite: a coluna lateral é um flex com altura máxima, e
    // item de flex com `overflow` diferente de `visible` perde o tamanho mínimo
    // automático. Sem ele o cartão encolhe abaixo do próprio conteúdo e o
    // `overflow-hidden` corta o fim em silêncio, em vez de a coluna rolar.
    <aside className="group relative shrink-0 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_16px_36px_-24px_rgba(15,23,42,0.25)] backdrop-blur-xl transition-all duration-300 hover:border-slate-300/80 hover:shadow-[0_1px_3px_rgba(15,23,42,0.05),0_24px_48px_-24px_rgba(15,23,42,0.3)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-slate-700">
      {/* Mancha de luz do acento, no canto superior direito. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-14 -right-14 h-36 w-36 rounded-full blur-2xl transition-colors duration-500 ${cores.brilho}`}
      />
      {/* Fio de luz no topo da borda — dá relevo ao vidro sem pesar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/10"
      />

      <div className="relative flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-white/50 dark:ring-white/5 ${cores.chip}`}
          >
            <Icone className="h-[1.15rem] w-[1.15rem]" />
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {titulo}
            </h3>
            <p className="truncate text-[0.7rem] font-medium tracking-wide text-slate-400 dark:text-slate-500">
              {subtitulo}
            </p>
          </div>
        </div>

        {acao}
      </div>

      <div className="relative">{children}</div>
    </aside>
  )
}

// ─── Card 1: Nuvem de tags ──────────────────────────────────────────────────

/** Quantas tags aparecem antes de o leitor pedir o resto. */
const TAGS_VISIVEIS = 24

type Origem = 'tecnologia' | 'fe' | 'ambas'

const ORIGENS: Record<Origem, { rotulo: string; ponto: string; chip: string }> = {
  tecnologia: {
    rotulo: 'Tecnologia',
    ponto: 'bg-sky-500',
    chip: 'border-sky-500/25 bg-sky-500/8 text-sky-700 hover:border-sky-500/60 hover:bg-sky-500/15 focus-visible:ring-sky-500/40 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:border-sky-400/60 dark:hover:bg-sky-400/20',
  },
  fe: {
    rotulo: 'Vida Cristã',
    ponto: 'bg-amber-500',
    chip: 'border-amber-500/25 bg-amber-500/8 text-amber-700 hover:border-amber-500/60 hover:bg-amber-500/15 focus-visible:ring-amber-500/40 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:border-amber-400/60 dark:hover:bg-amber-400/20',
  },
  ambas: {
    rotulo: 'Nos dois',
    ponto: 'bg-emerald-500',
    chip: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-700 hover:border-emerald-500/60 hover:bg-emerald-500/15 focus-visible:ring-emerald-500/40 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-400/20',
  },
}

/**
 * Escala tipográfica da nuvem: quatro degraus do assunto raro ao recorrente.
 * É o que faz a nuvem *ser* uma nuvem — na versão anterior toda tag tinha o
 * mesmo peso e o número ao lado era a única pista de volume.
 */
const DEGRAUS = [
  'text-[0.7rem] font-medium',
  'text-[0.75rem] font-semibold',
  'text-[0.8rem] font-semibold',
  'text-[0.875rem] font-bold',
]

export function CardNuvemDeTags({ tags }: { tags: TagComContagem[] }) {
  const [expandido, setExpandido] = useState(false)

  if (!tags || tags.length === 0) return null

  const tagsExibidas = expandido ? tags : tags.slice(0, TAGS_VISIVEIS)
  const restantes = tags.length - tagsExibidas.length

  // Degrau de cada tag. A faixa sai da lista inteira, não da fatia visível:
  // expandir não pode mudar o tamanho das tags que já estavam na tela.
  //
  // A escala é logarítmica porque contagem de tag é lei de potência — poucos
  // assuntos com muitos posts e uma cauda longa de assuntos com um só. Em
  // escala linear, num acervo real de 11 posts no topo e 1 na cauda, tudo
  // abaixo de 3 posts cai no mesmo degrau e a nuvem volta a ser plana.
  const contagens = tags.map((t) => t.count)
  const maior = Math.log(Math.max(...contagens))
  const menor = Math.log(Math.min(...contagens))
  const faixa = maior - menor

  const degrauDe = (count: number) => {
    // Acervo em que toda tag tem a mesma contagem: nenhuma se destaca, então
    // todas ficam no mesmo degrau intermediário em vez de no menor.
    if (faixa <= 0) return DEGRAUS[1]

    const posicao = (Math.log(count) - menor) / faixa
    return DEGRAUS[Math.min(DEGRAUS.length - 1, Math.floor(posicao * DEGRAUS.length))]
  }

  // Só entra na legenda a origem que existe na aba atual.
  const origensPresentes = (['tecnologia', 'fe', 'ambas'] as const).filter((o) =>
    tags.some((t) => (t.origem ?? 'ambas') === o)
  )

  return (
    <CartaoWidget
      acento="ambar"
      Icone={TagIcon}
      titulo="Nuvem de Tags"
      subtitulo={`${tags.length} ${tags.length === 1 ? 'assunto' : 'assuntos'} · por frequência`}
    >
      <div className="flex flex-wrap items-center gap-1.5 pt-4">
        {tagsExibidas.map((t) => {
          const origem = ORIGENS[(t.origem ?? 'ambas') as Origem]

          return (
            <Link
              key={t.nome}
              href={`/blog/tag/${encodeURIComponent(t.nome)}`}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 transition-all duration-200 sm:px-2.5 sm:py-1.5 hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none ${origem.chip} ${degrauDe(t.count)}`}
              title={`${t.count} ${t.count === 1 ? 'post' : 'posts'} · ${origem.rotulo}`}
            >
              <span className="leading-none">
                <span className="opacity-45">#</span>
                {t.nome}
              </span>
              <span className="text-[0.65rem] leading-none font-semibold tabular-nums opacity-55">
                {t.count}
              </span>
            </Link>
          )
        })}
      </div>

      {(restantes > 0 || expandido) && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-[0.7rem] font-bold text-slate-500 transition-colors hover:border-amber-500/50 hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:border-slate-800 dark:text-slate-400 dark:hover:border-amber-400/50 dark:hover:text-amber-400"
        >
          {expandido ? 'Mostrar menos' : `Mostrar mais ${restantes}`}
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform duration-300 ${expandido ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {origensPresentes.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
          {origensPresentes.map((chave) => (
            <span
              key={chave}
              className="flex items-center gap-1.5 text-[0.65rem] font-medium text-slate-400 dark:text-slate-500"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${ORIGENS[chave].ponto}`} />
              {ORIGENS[chave].rotulo}
            </span>
          ))}
        </div>
      )}
    </CartaoWidget>
  )
}

// ─── Card 2: Árvore de categorias ───────────────────────────────────────────

type EstiloRamo = {
  Icone: ((props: IconProps) => React.JSX.Element) | null
  chip: string
  barra: string
}

/**
 * O ramo chega do banco com um emoji em `ramo.icone`. Reconhecendo o título dá
 * para trocar por SVG; qualquer ramo novo que apareça cai no visual neutro e
 * ainda mostra o emoji — o widget não quebra por causa de dado desconhecido.
 */
function estiloDoRamo(ramo: RamoCategoria): EstiloRamo {
  const titulo = ramo.titulo.toLowerCase()

  if (titulo.includes('tecnolog')) {
    return {
      Icone: CodeIcon,
      chip: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400',
      barra: 'bg-sky-500/10 dark:bg-sky-400/10',
    }
  }

  if (titulo.includes('crist') || titulo.includes('fé')) {
    return {
      Icone: CrossIcon,
      chip: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400',
      barra: 'bg-amber-500/10 dark:bg-amber-400/10',
    }
  }

  return {
    Icone: null,
    chip: 'bg-slate-500/10 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300',
    barra: 'bg-slate-500/10 dark:bg-slate-400/10',
  }
}

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
    setRamosAbertos((prev) => ({ ...prev, [titulo]: !(prev[titulo] ?? true) }))
  }

  if (!ramos || ramos.length === 0) return null

  const totalPublicacoes = ramos.reduce((soma, r) => soma + r.totalRamo, 0)

  return (
    <CartaoWidget
      acento="ceu"
      Icone={FolderTreeIcon}
      titulo="Categorias"
      subtitulo={`${totalPublicacoes} ${totalPublicacoes === 1 ? 'publicação organizada' : 'publicações organizadas'}`}
      acao={
        categoriaSelecionada && onSelecionarCategoria ? (
          <button
            type="button"
            onClick={() => onSelecionarCategoria(null)}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[0.7rem] font-bold text-amber-700 transition-colors hover:bg-amber-500/20 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:border-amber-400/30 dark:text-amber-300"
          >
            <CloseIcon className="h-3 w-3" />
            Limpar
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-2.5 pt-4">
        {ramos.map((ramo) => {
          const aberto = ramosAbertos[ramo.titulo] ?? true
          const estilo = estiloDoRamo(ramo)
          const { Icone } = estilo
          const maiorSub = Math.max(...ramo.subcategorias.map((s) => s.count), 1)

          return (
            <div key={ramo.titulo} className="flex flex-col">
              {/* Tronco do ramo */}
              <button
                type="button"
                onClick={() => alternarRamo(ramo.titulo)}
                aria-expanded={aberto}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-100/80 focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${estilo.chip}`}
                >
                  {Icone ? <Icone className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                </span>

                <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                  {ramo.titulo}
                </span>

                <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[0.7rem] font-semibold tabular-nums text-slate-500 ring-1 ring-slate-200/80 ring-inset dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700/60">
                  {ramo.totalRamo}
                </span>

                <ChevronDownIcon
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${aberto ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Galhos. A altura anima por grid-template-rows: `auto` não é
                  animável, `0fr → 1fr` é — e sem chutar altura em pixel. */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  aberto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="mt-1.5 ml-5 flex flex-col">
                    {ramo.subcategorias.map((sub) => {
                      const selecionado = categoriaSelecionada === sub.chave
                      const vazio = sub.count === 0
                      const proporcao = (sub.count / maiorSub) * 100

                      return (
                        <li
                          key={sub.chave}
                          // Trilho vertical (`before`) + traço horizontal
                          // (`after`) desenhados em CSS. Antes eram os glifos
                          // `├─` e `└─` em fonte monoespaçada, que dependiam da
                          // fonte instalada e desalinhavam fora dela.
                          className="relative pl-4 before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-slate-200 after:absolute after:top-1/2 after:left-0 after:h-px after:w-3 after:bg-slate-200 last:before:h-1/2 dark:before:bg-slate-700/70 dark:after:bg-slate-700/70"
                        >
                          <button
                            type="button"
                            disabled={vazio}
                            aria-pressed={selecionado}
                            onClick={() =>
                              onSelecionarCategoria?.(selecionado ? null : sub.chave)
                            }
                            className={`group/linha relative my-0.5 flex w-full items-center justify-between gap-2 overflow-hidden rounded-lg px-2.5 py-2.5 text-left transition-colors sm:py-1.5 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none ${
                              vazio
                                ? 'cursor-not-allowed opacity-40'
                                : selecionado
                                  ? 'cursor-pointer bg-amber-500/15 ring-1 ring-amber-500/30 ring-inset dark:bg-amber-400/15 dark:ring-amber-400/30'
                                  : 'cursor-pointer hover:bg-slate-100/90 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {/* Barra de proporção: quanto a subcategoria pesa
                                dentro do ramo, lida como fundo da própria
                                linha — informação nova sem altura nova. */}
                            {!vazio && !selecionado && (
                              <span
                                aria-hidden="true"
                                style={{ width: `${proporcao}%` }}
                                className={`absolute inset-y-0 left-0 rounded-lg transition-opacity duration-300 ${estilo.barra}`}
                              />
                            )}

                            <span
                              className={`relative min-w-0 flex-1 truncate text-xs transition-colors ${
                                selecionado
                                  ? 'font-bold text-amber-700 dark:text-amber-300'
                                  : 'text-slate-600 group-hover/linha:text-slate-900 dark:text-slate-300 dark:group-hover/linha:text-white'
                              }`}
                            >
                              {sub.rotulo}
                            </span>

                            <span
                              className={`relative shrink-0 text-[0.7rem] font-semibold tabular-nums transition-colors ${
                                selecionado
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : 'text-slate-400 group-hover/linha:text-slate-600 dark:text-slate-500 dark:group-hover/linha:text-slate-400'
                              }`}
                            >
                              {sub.count}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </CartaoWidget>
  )
}
