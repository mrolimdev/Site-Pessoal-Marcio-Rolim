'use client'

import Link from 'next/link'

import {
  ArrowLeftIcon,
  CloseIcon,
  CodeIcon,
  CrossIcon,
  SearchIcon,
  SparklesIcon,
} from '@/components/icons'
import type { IconProps } from '@/components/icons'
import { ThemeToggle } from '@/components/theme-toggle'

/**
 * Navegação e filtros do índice do blog.
 *
 * ─── Por que a barra virou `sticky` e não `fixed` ───────────────────────────
 *
 * O resto do site usa uma pílula flutuante (`fixed top-4`) com voltar e tema.
 * Ela funciona numa página de leitura, mas aqui pairava por cima do conteúdo o
 * tempo todo — no celular, cobrindo justamente os títulos de seção. Como esta
 * é a página de *navegar*, e não de ler, a barra passa a fazer parte do fluxo:
 * rola junto com o topo e gruda ao chegar lá em cima, levando as abas consigo.
 * Trocar de área deixa de exigir subir a página inteira.
 *
 * ─── Por que chips em vez de `<select>` ─────────────────────────────────────
 *
 * O filtro de categoria era um `<select>` nativo com as seis opções fixas,
 * incluindo as que não existem na aba aberta — na aba de fé dava para escolher
 * "Automação & n8n" e receber uma lista vazia. Os chips mostram só o que a aba
 * tem, já com a contagem, e no celular a fileira rola de lado em vez de abrir
 * o seletor do sistema por cima da tela.
 */

export type Aba = 'todas' | 'tecnologia' | 'fe'

type DefinicaoAba = {
  chave: Aba
  /** Rótulo do celular: precisa caber na barra ao lado de voltar e tema. */
  curto: string
  longo: string
  Icone: (props: IconProps) => React.JSX.Element
  ativa: string
}

const ABAS: DefinicaoAba[] = [
  {
    chave: 'todas',
    curto: 'Todas',
    longo: 'Todas as publicações',
    Icone: SparklesIcon,
    ativa: 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900',
  },
  {
    chave: 'tecnologia',
    curto: 'Tech',
    longo: 'Tecnologia',
    Icone: CodeIcon,
    ativa: 'bg-sky-600 text-white shadow-sm shadow-sky-500/25 dark:bg-sky-500 dark:text-slate-950',
  },
  {
    chave: 'fe',
    curto: 'Fé',
    longo: 'Vida Cristã',
    Icone: CrossIcon,
    ativa:
      'bg-amber-600 text-white shadow-sm shadow-amber-500/25 dark:bg-amber-500 dark:text-slate-950',
  },
]

export function NavegacaoBlog({
  abaAtiva,
  onTrocarAba,
  contagens,
}: {
  abaAtiva: Aba
  onTrocarAba: (aba: Aba) => void
  contagens: Record<Aba, number>
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-stone-50/85 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-4 sm:px-6">
        <Link
          href="/"
          aria-label="Voltar ao início"
          className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none sm:px-4 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="hidden text-sm font-medium sm:inline">Início</span>
        </Link>

        {/* Barra rolável: em telas estreitas as três abas passam da largura
            disponível, e rolar de lado é melhor do que quebrar em três linhas —
            que era o que acontecia antes. */}
        <div className="scrollbar-hide min-w-0 flex-1 overflow-x-auto">
          <div className="mx-auto flex w-max items-center gap-1 rounded-full border border-slate-200/80 bg-white/70 p-1 dark:border-slate-800 dark:bg-slate-900/70">
            {ABAS.map(({ chave, curto, longo, Icone, ativa }) => {
              const selecionada = abaAtiva === chave

              return (
                <button
                  key={chave}
                  type="button"
                  onClick={() => onTrocarAba(chave)}
                  aria-pressed={selecionada}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none sm:px-4 ${
                    selecionada
                      ? ativa
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icone className="h-3.5 w-3.5 shrink-0" />
                  <span className="sm:hidden">{curto}</span>
                  <span className="hidden sm:inline">{longo}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[0.65rem] tabular-nums ${
                      selecionada
                        ? 'bg-white/25 dark:bg-slate-900/20'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {contagens[chave]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <ThemeToggle className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600" />
      </div>
    </div>
  )
}

// ─── Filtros: busca e categorias ────────────────────────────────────────────

export type OpcaoCategoria = { chave: string; rotulo: string; curto: string }

/**
 * Todas as categorias que o banco usa. A barra mostra só as que existem na aba
 * aberta — a lista completa aparecia mesmo quando levava a zero resultados.
 */
export const CATEGORIAS: OpcaoCategoria[] = [
  { chave: 'ia', rotulo: 'Inteligência Artificial', curto: 'IA' },
  { chave: 'automacao', rotulo: 'Automação & n8n', curto: 'Automação' },
  { chave: 'tecnologia', rotulo: 'Engenharia & Web', curto: 'Engenharia' },
  { chave: 'negocios', rotulo: 'Estratégia & Negócios', curto: 'Negócios' },
  { chave: 'fe', rotulo: 'Fé & Devocional', curto: 'Fé' },
]

export function FiltrosBlog({
  termoBusca,
  onBuscar,
  categoriaSelecionada,
  onSelecionarCategoria,
  contagensPorCategoria,
  totalFiltrado,
  onLimpar,
}: {
  termoBusca: string
  onBuscar: (termo: string) => void
  categoriaSelecionada: string | null
  onSelecionarCategoria: (chave: string | null) => void
  contagensPorCategoria: Map<string, number>
  totalFiltrado: number
  onLimpar: () => void
}) {
  const disponiveis = CATEGORIAS.filter((c) => (contagensPorCategoria.get(c.chave) ?? 0) > 0)
  const temFiltros = termoBusca.trim().length > 0 || categoriaSelecionada !== null
  const totalDaAba = [...contagensPorCategoria.values()].reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={termoBusca}
          onChange={(e) => onBuscar(e.target.value)}
          placeholder="Pesquisar por título, assunto ou tag..."
          aria-label="Pesquisar publicações"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-12 pl-11 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-amber-400 [&::-webkit-search-cancel-button]:hidden"
        />
        {termoBusca.length > 0 && (
          <button
            type="button"
            onClick={() => onBuscar('')}
            aria-label="Limpar pesquisa"
            className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sangria negativa para a fileira rolar de ponta a ponta da tela no
          celular, sem que o último chip pareça encostar na margem. */}
      <div className="scrollbar-hide -mx-6 flex gap-2 overflow-x-auto px-6 pb-0.5 sm:mx-0 sm:flex-wrap sm:px-0">
        <ChipCategoria
          rotulo="Todas"
          contagem={totalDaAba}
          selecionado={categoriaSelecionada === null}
          onClick={() => onSelecionarCategoria(null)}
        />
        {disponiveis.map((c) => (
          <ChipCategoria
            key={c.chave}
            rotulo={c.curto}
            rotuloLongo={c.rotulo}
            contagem={contagensPorCategoria.get(c.chave) ?? 0}
            selecionado={categoriaSelecionada === c.chave}
            onClick={() =>
              onSelecionarCategoria(categoriaSelecionada === c.chave ? null : c.chave)
            }
          />
        ))}
      </div>

      {temFiltros && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-500/8 px-4 py-2.5 text-xs text-slate-600 dark:bg-amber-400/10 dark:text-slate-300">
          <span>
            <strong className="font-bold text-slate-900 tabular-nums dark:text-white">
              {totalFiltrado}
            </strong>{' '}
            {totalFiltrado === 1 ? 'artigo encontrado' : 'artigos encontrados'}
            {termoBusca && (
              <>
                {' para '}
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  &ldquo;{termoBusca}&rdquo;
                </span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={onLimpar}
            className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 font-bold text-amber-700 transition-colors hover:bg-amber-500/15 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:text-amber-300"
          >
            <CloseIcon className="h-3 w-3" />
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  )
}

function ChipCategoria({
  rotulo,
  rotuloLongo,
  contagem,
  selecionado,
  onClick,
}: {
  rotulo: string
  rotuloLongo?: string
  contagem: number
  selecionado: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionado}
      title={rotuloLongo}
      className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none ${
        selecionado
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700'
      }`}
    >
      {/* O rótulo longo cabe no desktop; no celular ficaria maior que a tela. */}
      <span className="sm:hidden">{rotulo}</span>
      <span className="hidden sm:inline">{rotuloLongo ?? rotulo}</span>
      <span className="text-[0.65rem] tabular-nums opacity-60">{contagem}</span>
    </button>
  )
}
