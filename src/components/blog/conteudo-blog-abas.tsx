'use client'

import { useCallback, useMemo, useState } from 'react'

import { BannerDestaques } from '@/components/blog/banner-destaques'
import type { Destaque } from '@/components/blog/banner-destaques'
import { CarrosselPosts } from '@/components/blog/carrossel-posts'
import { FiltrosBlog, NavegacaoBlog } from '@/components/blog/navegacao-blog'
import type { Aba } from '@/components/blog/navegacao-blog'
import { CardArvoreDeCategorias, CardNuvemDeTags } from '@/components/blog/widgets-blog'
import { SearchIcon } from '@/components/icons'
import type { DadosWidgets, PostResumo, TagComContagem } from '@/lib/blog/queries'

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

export function ConteudoBlogAbas({
  postsTecnologia,
  postsVidaCrista,
  dadosWidgets,
  children,
}: {
  postsTecnologia: PostResumo[]
  postsVidaCrista: PostResumo[]
  dadosWidgets: DadosWidgets
  /** O cabeçalho, que é Server Component e entra entre a barra e o conteúdo. */
  children: React.ReactNode
}) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('todas')
  const [termoBusca, setTermoBusca] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null)

  const totalTech = postsTecnologia.length
  const totalFe = postsVidaCrista.length
  const totalGeral = totalTech + totalFe

  // Busca e categoria ficam separadas porque as contagens dos chips precisam da
  // busca aplicada e da categoria *não* aplicada — senão escolher uma categoria
  // zeraria o número de todas as outras e não haveria como voltar informado.
  //
  // Em `useCallback` porque as listas memoizadas abaixo dependem delas: soltas,
  // nasciam de novo a cada render e as dependências dos `useMemo` ficavam
  // incompletas.
  const combinaComBusca = useCallback(
    (p: PostResumo) => {
      const termo = termoBusca.trim().toLowerCase()
      if (!termo) return true

      return (
        p.titulo.toLowerCase().includes(termo) ||
        (p.resumo?.toLowerCase().includes(termo) ?? false) ||
        (p.tags?.some((t) => t.toLowerCase().includes(termo)) ?? false)
      )
    },
    [termoBusca]
  )

  const filtrarPost = useCallback(
    (p: PostResumo) => {
      if (categoriaSelecionada && p.categoria !== categoriaSelecionada) return false
      return combinaComBusca(p)
    },
    [categoriaSelecionada, combinaComBusca]
  )

  const postosDaAba = useCallback(
    (tech: PostResumo[], fe: PostResumo[]) =>
      abaAtiva === 'tecnologia' ? tech : abaAtiva === 'fe' ? fe : [...tech, ...fe],
    [abaAtiva]
  )

  // Contagem por categoria dentro da aba, para os chips do filtro.
  const contagensPorCategoria = useMemo(() => {
    const mapa = new Map<string, number>()

    for (const p of postosDaAba(postsTecnologia, postsVidaCrista)) {
      if (!combinaComBusca(p)) continue
      mapa.set(p.categoria, (mapa.get(p.categoria) ?? 0) + 1)
    }

    return mapa
  }, [postosDaAba, postsTecnologia, postsVidaCrista, combinaComBusca])

  // Trocar de aba com uma categoria da outra área selecionada dava lista vazia
  // sem dizer por quê. A categoria incompatível sai junto com a troca.
  const trocarAba = (nova: Aba) => {
    setAbaAtiva(nova)

    if (!categoriaSelecionada) return
    const categoriaEDeFe = categoriaSelecionada === 'fe'
    if ((nova === 'tecnologia' && categoriaEDeFe) || (nova === 'fe' && !categoriaEDeFe)) {
      setCategoriaSelecionada(null)
    }
  }

  const limparFiltros = () => {
    setTermoBusca('')
    setCategoriaSelecionada(null)
  }

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

  return (
    <>
      <NavegacaoBlog
        abaAtiva={abaAtiva}
        onTrocarAba={trocarAba}
        contagens={{ todas: totalGeral, tecnologia: totalTech, fe: totalFe }}
      />

      {children}

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 sm:gap-12 sm:py-12">
        <FiltrosBlog
          termoBusca={termoBusca}
          onBuscar={setTermoBusca}
          categoriaSelecionada={categoriaSelecionada}
          onSelecionarCategoria={setCategoriaSelecionada}
          contagensPorCategoria={contagensPorCategoria}
          totalFiltrado={totalFiltrado}
          onLimpar={limparFiltros}
        />

        {/* ─── DESTAQUES: BANNER EM SLIDE, UMA COLUNA DE LARGURA TOTAL ─── */}
        <BannerDestaques destaques={destaques} descricao={COPIA[abaAtiva].destaque} />

        {/* ─── ABAIXO: ESTEIRA À ESQUERDA, WIDGETS À DIREITA ─── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="animate-fade-in min-w-0 lg:col-span-8">
            {totalFiltrado === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <SearchIcon className="h-6 w-6" />
                </span>
                <div className="flex flex-col gap-1 px-6">
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhum artigo encontrado
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Tente outro termo ou remova os filtros aplicados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="cursor-pointer rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-500/20 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:text-amber-300"
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

          {/* COLUNA DIREITA NO DESKTOP; NO CELULAR, SEÇÃO PRÓPRIA NO FIM ─────
              A barra do topo já resolve navegar por área e por categoria, então
              aqui embaixo estes dois cartões são exploração, não navegação
              principal — e por isso podem ficar depois das publicações. */}
          <div className="flex flex-col gap-6 lg:col-span-4 lg:gap-8">
            <div className="border-b border-slate-200 pb-3 lg:hidden dark:border-slate-800">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Explorar
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Navegue por assunto ou pela árvore de categorias
              </p>
            </div>

            <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:gap-8 lg:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <CardNuvemDeTags tags={tagsFiltradas} />

              <CardArvoreDeCategorias
                ramos={dadosWidgets.arvoreCategorias}
                categoriaSelecionada={categoriaSelecionada}
                onSelecionarCategoria={setCategoriaSelecionada}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
