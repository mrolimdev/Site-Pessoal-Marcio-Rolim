'use client'

import { useMemo, useState } from 'react'

import { PostCard, PostCardDestaque } from '@/components/blog/post-card'
import { CardArvoreDeCategorias, CardNuvemDeTags } from '@/components/blog/widgets-blog'
import type { DadosWidgets, PostResumo, TagComContagem } from '@/lib/blog/queries'

type Aba = 'todas' | 'tecnologia' | 'fe'

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

  // Helper de filtragem por busca e categoria
  const filtrarPost = (p: PostResumo) => {
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
  }

  // ─── POSTS FILTRADOS DINAMICAMENTE ───
  const techFiltrados = useMemo(() => {
    return postsTecnologia.filter(filtrarPost)
  }, [postsTecnologia, categoriaSelecionada, termoBusca])

  const feFiltrados = useMemo(() => {
    return postsVidaCrista.filter(filtrarPost)
  }, [postsVidaCrista, categoriaSelecionada, termoBusca])

  const totalFiltrado = techFiltrados.length + feFiltrados.length

  const destaqueTech = techFiltrados[0]
  const demaisTech = techFiltrados.slice(1)

  const destaqueFe = feFiltrados[0]
  const demaisFe = feFiltrados.slice(1)

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
                Termo: <code className="font-bold text-amber-600 dark:text-amber-400">"{termoBusca}"</code>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── ÁREA PRINCIPAL + SIDEBAR DE WIDGETS ─── */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* COLUNA ESQUERDA: POSTS DO BLOG (8 colunas no desktop) */}
        <div className="flex flex-col gap-16 lg:col-span-8">
          {/* SEÇÃO TECNOLOGIA */}
          {(abaAtiva === 'todas' || abaAtiva === 'tecnologia') && techFiltrados.length > 0 && (
            <section id="tecnologia" className="animate-fade-in flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-xl text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                    💻
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Tecnologia, IA & Automação
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Engenharia de software, inteligência artificial, agentes e automação de processos
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {destaqueTech && <PostCardDestaque post={destaqueTech} />}
                {demaisTech.length > 0 && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {demaisTech.map((post) => (
                      <PostCard key={post.slug} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SEÇÃO VIDA CRISTÃ */}
          {(abaAtiva === 'todas' || abaAtiva === 'fe') && feFiltrados.length > 0 && (
            <section id="vida-crista" className="animate-fade-in flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-xl text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                    ✝️
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Vida Cristã & Reflexões
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Fé, propósito, sabedoria e vida com Deus no mundo hiperconectado
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {destaqueFe && <PostCardDestaque post={destaqueFe} />}
                {demaisFe.length > 0 && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {demaisFe.map((post) => (
                      <PostCard key={post.slug} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {techFiltrados.length === 0 && feFiltrados.length === 0 && (
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
