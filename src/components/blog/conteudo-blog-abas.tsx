'use client'

import { useCallback, useMemo, useState } from 'react'

import { BannerDestaques } from '@/components/blog/banner-destaques'
import type { Destaque } from '@/components/blog/banner-destaques'
import { CarrosselPosts } from '@/components/blog/carrossel-posts'
import { CardArvoreDeCategorias, CardNuvemDeTags } from '@/components/blog/widgets-blog'
import type { DadosWidgets, PostResumo, TagComContagem } from '@/lib/blog/queries'

type Aba = 'todas' | 'tecnologia' | 'fe'

/** Quantos slides o banner de destaques chega a ter. */
const MAX_DESTAQUES = 4

/**
 * Cada lista já chega ordenada do banco, mas ao juntar as duas áreas a ordem se
 * perde. O slug desempata para a sequência não variar entre um render e outro.
 */
function ordenarPorData(posts: PostResumo[]): PostResumo[] {
  return posts
    .slice()
    .sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm) || a.slug.localeCompare(b.slug))
}

/**
 * Texto de apoio das duas seções, por aba. As seções antes eram fixas — uma de
 * Tecnologia e uma de Vida Cristã, cada uma com o próprio título e subtítulo.
 * Agora a página é uma só e é a aba que diz do que ela trata.
 */
const COPIA: Record<Aba, { destaque: string; esteira: string }> = {
  todas: {
    destaque: 'O artigo mais recente de cada área',
    esteira: 'Tudo o que já foi publicado, das duas áreas, da mais nova para a mais antiga',
  },
  tecnologia: {
    destaque: 'Engenharia de software, inteligência artificial, agentes e automação de processos',
    esteira: 'Os demais artigos de tecnologia, da mais nova para a mais antiga',
  },
  fe: {
    destaque: 'Fé, propósito, sabedoria e vida com Deus no mundo hiperconectado',
    esteira: 'As demais reflexões, da mais nova para a mais antiga',
  },
}

const CATEGORIAS_OPCOES = [
  { chave: 'todas', rotulo: 'Todas as Categorias' },
  { chave: 'ia', rotulo: 'Inteligência Artificial (💻)' },
  { chave: 'automacao', rotulo: 'Automação & n8n (💻)' },
  { chave: 'tecnologia', rotulo: 'Engenharia & Web (💻)' },
  { chave: 'negocios', rotulo: 'Estratégia & Negócios (💻)' },
  { chave: 'fe', rotulo: 'Fé, Devocional & Família (✝️)' },
]

export function ConteudoBlogAbas({
  postsTecnologia,
  postsVidaCrista,
  dadosWidgets,
}: {
  postsTecnologia: PostResumo[]
  postsVidaCrista: PostResumo[]
  dadosWidgets: DadosWidgets
}) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('todas')
  const [termoBusca, setTermoBusca] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null)

  const totalTech = postsTecnologia.length
  const totalFe = postsVidaCrista.length
  const totalGeral = totalTech + totalFe

  // Helper de filtragem por busca e categoria.
  //
  // Em `useCallback` porque as listas memoizadas abaixo dependem dele: solto,
  // ele nascia de novo a cada render e as dependências dos `useMemo` ficavam
  // incompletas.
  const filtrarPost = useCallback(
    (p: PostResumo) => {
      // 1. Filtro por Categoria
      if (categoriaSelecionada && p.categoria !== categoriaSelecionada) {
        return false
      }

      // 2. Filtro por Termo de Busca
      if (termoBusca.trim().length > 0) {
        const termo = termoBusca.trim().toLowerCase()
        const noTitulo = p.titulo.toLowerCase().includes(termo)
        const noResumo = p.resumo?.toLowerCase().includes(termo) ?? false
        const nasTags = p.tags?.some((t) => t.toLowerCase().includes(termo)) ?? false

        return noTitulo || noResumo || nasTags
      }

      return true
    },
    [categoriaSelecionada, termoBusca]
  )

  // ─── POSTS FILTRADOS DINAMICAMENTE ───
  const techFiltrados = useMemo(() => {
    return postsTecnologia.filter(filtrarPost)
  }, [postsTecnologia, filtrarPost])

  const feFiltrados = useMemo(() => {
    return postsVidaCrista.filter(filtrarPost)
  }, [postsVidaCrista, filtrarPost])

  const totalFiltrado = techFiltrados.length + feFiltrados.length

  // ─── DESTAQUES: banner em slide, 1 coluna de largura total ───
  //
  // Em "Todas", cada área tem uma vaga reservada antes de o banner completar
  // por data: sem isso uma sequência de posts de tecnologia empurraria a fé
  // para fora do banner inteiro. O resto entra do mais novo para o mais antigo.
  const destaques = useMemo<Destaque[]>(() => {
    const escolhidos: Destaque[] = []
    const jaEscolhidos = new Set<string>()

    const rotuloDe = (p: PostResumo) => {
      if (abaAtiva !== 'todas') return escolhidos.length === 0 ? 'Mais recente' : 'Em destaque'
      return p.categoria === 'fe' ? 'Destaque · Vida Cristã' : 'Destaque · Tecnologia'
    }

    const adicionar = (post: PostResumo | undefined) => {
      if (!post || jaEscolhidos.has(post.slug) || escolhidos.length >= MAX_DESTAQUES) return
      jaEscolhidos.add(post.slug)
      escolhidos.push({ post, rotulo: rotuloDe(post) })
    }

    if (abaAtiva === 'todas') {
      adicionar(techFiltrados[0])
      adicionar(feFiltrados[0])
    }

    const base =
      abaAtiva === 'tecnologia'
        ? techFiltrados
        : abaAtiva === 'fe'
          ? feFiltrados
          : [...techFiltrados, ...feFiltrados]

    for (const post of ordenarPorData(base)) adicionar(post)

    return escolhidos
  }, [abaAtiva, techFiltrados, feFiltrados])

  // ─── ESTEIRA: todo o resto da aba ───
  //
  // Sem corte em "os N mais recentes": a esteira dá a volta em tudo o que
  // sobrou, então nenhum post fica inalcançável a partir do /blog.
  const rotativos = useMemo(() => {
    const noBanner = new Set(destaques.map((d) => d.post.slug))

    const base =
      abaAtiva === 'tecnologia'
        ? techFiltrados
        : abaAtiva === 'fe'
          ? feFiltrados
          : [...techFiltrados, ...feFiltrados]

    return ordenarPorData(base.filter((p) => !noBanner.has(p.slug)))
  }, [abaAtiva, techFiltrados, feFiltrados, destaques])

  // ─── TAGS DINÂMICAS POR ABA E POR ORIGEM ───
  const tagsFiltradas = useMemo<TagComContagem[]>(() => {
    const mapaTech = new Map<string, number>()
    const mapaFe = new Map<string, number>()

    postsTecnologia.forEach((p) => {
      p.tags?.forEach((t) => {
        const limpa = t.trim().toLowerCase()
        if (limpa) mapaTech.set(limpa, (mapaTech.get(limpa) ?? 0) + 1)
      })
    })

    postsVidaCrista.forEach((p) => {
      p.tags?.forEach((t) => {
        const limpa = t.trim().toLowerCase()
        if (limpa) mapaFe.set(limpa, (mapaFe.get(limpa) ?? 0) + 1)
      })
    })

    if (abaAtiva === 'tecnologia') {
      return Array.from(mapaTech.entries())
        .map(([nome, count]) => ({ nome, count, origem: 'tecnologia' as const }))
        .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, 'pt-BR'))
    }

    if (abaAtiva === 'fe') {
      return Array.from(mapaFe.entries())
        .map(([nome, count]) => ({ nome, count, origem: 'fe' as const }))
        .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, 'pt-BR'))
    }

    const todasChaves = new Set([...mapaTech.keys(), ...mapaFe.keys()])
    return Array.from(todasChaves)
      .map((nome) => {
        const countTech = mapaTech.get(nome) ?? 0
        const countFe = mapaFe.get(nome) ?? 0
        const total = countTech + countFe
        let origem: 'tecnologia' | 'fe' | 'ambas' = 'ambas'
        if (countTech > 0 && countFe === 0) origem = 'tecnologia'
        if (countFe > 0 && countTech === 0) origem = 'fe'

        return { nome, count: total, origem }
      })
      .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [abaAtiva, postsTecnologia, postsVidaCrista])

  const possuiFiltrosAtivos = termoBusca.trim().length > 0 || categoriaSelecionada !== null

  return (
    <div className="flex flex-col gap-10">
      {/* ─── BARRA DE ABAS INTERATIVAS ─── */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 pb-6 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setAbaAtiva('todas')
          }}
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
          onClick={() => {
            setAbaAtiva('tecnologia')
          }}
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
          onClick={() => {
            setAbaAtiva('fe')
          }}
          className={`cursor-pointer rounded-full px-5 py-2.5 font-mono text-xs font-bold transition-all ${
            abaAtiva === 'fe'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 dark:bg-amber-500 dark:text-slate-950'
              : 'border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300'
          }`}
        >
          ✝️ Vida Cristã & Fé ({totalFe})
        </button>
      </div>

      {/* ─── BARRA DE PESQUISA INTELIGENTE + FILTRO DE CATEGORIAS ─── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl sm:p-5 dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Campo de Pesquisa Inteligente */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Pesquisar por título, assunto ou hashtag..."
              className="w-full rounded-2xl border border-slate-200/80 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-amber-400"
            />
            {termoBusca.length > 0 && (
              <button
                type="button"
                onClick={() => setTermoBusca('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Seletor de Filtro por Categoria */}
          <div className="flex items-center gap-2">
            <select
              value={categoriaSelecionada ?? 'todas'}
              onChange={(e) => {
                const val = e.target.value
                setCategoriaSelecionada(val === 'todas' ? null : val)
              }}
              className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white py-3 px-4 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-amber-400"
            >
              {CATEGORIAS_OPCOES.map((cat) => (
                <option key={cat.chave} value={cat.chave}>
                  {cat.rotulo}
                </option>
              ))}
            </select>

            {possuiFiltrosAtivos && (
              <button
                type="button"
                onClick={() => {
                  setTermoBusca('')
                  setCategoriaSelecionada(null)
                }}
                className="cursor-pointer whitespace-nowrap rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 font-mono text-xs font-bold text-amber-700 transition-all hover:bg-amber-500/20 dark:text-amber-300"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Indicador de Resultados da Pesquisa */}
        {possuiFiltrosAtivos && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              Exibindo <strong className="text-slate-900 dark:text-white">{totalFiltrado}</strong> {totalFiltrado === 1 ? 'artigo encontrado' : 'artigos encontrados'}
            </span>
            {termoBusca && (
              <span>
                Termo:{' '}
                <code className="font-bold text-amber-600 dark:text-amber-400">
                  &ldquo;{termoBusca}&rdquo;
                </code>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── DESTAQUES: BANNER EM SLIDE, UMA COLUNA DE LARGURA TOTAL ─── */}
      <BannerDestaques destaques={destaques} descricao={COPIA[abaAtiva].destaque} />

      {/* ─── ABAIXO: ESTEIRA À ESQUERDA, WIDGETS À DIREITA ─── */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="animate-fade-in lg:col-span-8">
          {totalFiltrado === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="text-4xl">🔍</span>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Nenhum artigo encontrado com os filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTermoBusca('')
                  setCategoriaSelecionada(null)
                }}
                className="cursor-pointer font-mono text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
              >
                Limpar pesquisa e filtros
              </button>
            </div>
          ) : (
            <CarrosselPosts
              posts={rotativos}
              titulo="Últimos posts"
              descricao={COPIA[abaAtiva].esteira}
            />
          )}
        </div>

        {/* COLUNA DIREITA: ÁREA DE WIDGETS COM SCROLL INTELEGINTE E BARRA OCULTA NO DESKTOP */}
        <div className="flex flex-col gap-8 lg:col-span-4">
          <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Card 1: Nuvem de Tags Dinâmica por Aba e Origem */}
            <CardNuvemDeTags tags={tagsFiltradas} />

            {/* Card 2: Árvore de Categorias com Filtro Interativo */}
            <CardArvoreDeCategorias
              ramos={dadosWidgets.arvoreCategorias}
              categoriaSelecionada={categoriaSelecionada}
              onSelecionarCategoria={setCategoriaSelecionada}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
