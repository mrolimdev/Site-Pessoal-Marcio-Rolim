'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  salvarCategoriaAction,
  excluirCategoriaAction,
  type RespostaEstatisticasCategorias,
  type EstatisticaCategoria,
  type EstatisticaRamoCategoria,
} from '@/actions/categorias-tags'

type Props = {
  dadosIniciais: RespostaEstatisticasCategorias
}

export function CategoriasClient({ dadosIniciais }: Props) {
  const [busca, setBusca] = useState('')
  const [dados, setDados] = useState<RespostaEstatisticasCategorias>(dadosIniciais)

  // Estado do Modal de Cadastro/Edição
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroModal, setErroModal] = useState<string | null>(null)

  // Formulário do Modal
  const [modoModal, setModoModal] = useState<'criar' | 'editar'>('criar')
  const [isParent, setIsParent] = useState(false)
  const [idCat, setIdCat] = useState('')
  const [nomeCat, setNomeCat] = useState('')
  const [descricaoCat, setDescricaoCat] = useState('')
  const [parentIdCat, setParentIdCat] = useState('tecnologia_ia')

  // Abrir Modal para Criar Categoria Pai
  const handleAbrirCriarPai = () => {
    setModoModal('criar')
    setIsParent(true)
    setIdCat('')
    setNomeCat('')
    setDescricaoCat('')
    setParentIdCat('')
    setErroModal(null)
    setModalAberto(true)
  }

  // Abrir Modal para Criar Subcategoria
  const handleAbrirCriarSub = (ramoIdDefault?: string) => {
    setModoModal('criar')
    setIsParent(false)
    setIdCat('')
    setNomeCat('')
    setDescricaoCat('')
    setParentIdCat(ramoIdDefault || dados.ramos[0]?.chaveRamo || 'tecnologia_ia')
    setErroModal(null)
    setModalAberto(true)
  }

  // Abrir Modal para Editar Categoria Pai
  const handleAbrirEditarPai = (ramo: EstatisticaRamoCategoria) => {
    setModoModal('editar')
    setIsParent(true)
    setIdCat(ramo.chaveRamo)
    setNomeCat(ramo.titulo)
    setDescricaoCat(ramo.descricao)
    setParentIdCat('')
    setErroModal(null)
    setModalAberto(true)
  }

  // Abrir Modal para Editar Subcategoria
  const handleAbrirEditarSub = (sub: EstatisticaCategoria, parentId: string) => {
    setModoModal('editar')
    setIsParent(false)
    setIdCat(sub.id)
    setNomeCat(sub.nome)
    setDescricaoCat(sub.descricao)
    setParentIdCat(parentId)
    setErroModal(null)
    setModalAberto(true)
  }

  // Submeter Formulário de Cadastro/Edição
  const handleSalvarCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroModal(null)
    setSalvando(true)

    const res = await salvarCategoriaAction({
      id: idCat,
      nome: nomeCat,
      descricao: descricaoCat,
      parentId: isParent ? null : parentIdCat,
      isParent,
    })

    setSalvando(false)

    if (res.ok) {
      setModalAberto(false)
      // Atualiza localmente a árvore para resposta instantânea na UI
      window.location.reload()
    } else {
      setErroModal(res.erro || 'Erro ao salvar categoria.')
    }
  }

  // Excluir Categoria
  const handleExcluirCategoria = async (id: string, nome: string) => {
    if (!window.confirm(`Excluir a categoria "${nome}"? Os posts associados serão mantidos.`)) {
      return
    }

    const res = await excluirCategoriaAction({ id })
    if (res.ok) {
      window.location.reload()
    } else {
      alert(`Erro ao excluir: ${res.erro}`)
    }
  }

  // Estatísticas Globais
  const totalGeralSubcategorias = dados.subcategorias.length
  const totalGeralPosts = dados.subcategorias.reduce((acc, curr) => acc + curr.totalPosts, 0)
  const totalPublicados = dados.subcategorias.reduce((acc, curr) => acc + curr.publicados, 0)

  // Filtragem
  const ramosFiltrados = dados.ramos
    .map((ramo) => {
      const subsFiltradas = ramo.subcategorias.filter(
        (sub) =>
          sub.nome.toLowerCase().includes(busca.toLowerCase()) ||
          sub.descricao.toLowerCase().includes(busca.toLowerCase()) ||
          sub.id.toLowerCase().includes(busca.toLowerCase()) ||
          ramo.titulo.toLowerCase().includes(busca.toLowerCase())
      )

      return {
        ...ramo,
        subcategorias: subsFiltradas,
      }
    })
    .filter((ramo) => ramo.subcategorias.length > 0 || ramo.titulo.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Gestão de Categorias & Subcategorias
            </h1>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
              {dados.ramos.length} Ramos • {totalGeralSubcategorias} Subcategorias
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Cadastre, edite e organize a taxonomia hierárquica das categorias e subcategorias do blog.
          </p>
        </div>

        {/* BOTÕES DE CADASTRO */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAbrirCriarPai}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span>➕ Nova Categoria Pai</span>
          </button>

          <button
            type="button"
            onClick={() => handleAbrirCriarSub()}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
          >
            <span>➕ Nova Subcategoria</span>
          </button>

          <Link
            href="/admin/posts/novo"
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:scale-105"
          >
            <span>✍️ Criar Novo Post</span>
          </Link>
        </div>
      </div>

      {/* CARDS DE RESUMO DE METRICAS GLOBAIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
            Divisões Principais (Categorias Pai)
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {dados.ramos.length} áreas ({totalGeralSubcategorias} subcategorias)
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
            Total de Posts Catalogados
          </span>
          <span className="text-2xl font-black text-amber-500">
            {totalGeralPosts} artigos
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm dark:bg-emerald-500/10">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Artigos Publicados
          </span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {totalPublicados} no ar
          </span>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
          🔍
        </span>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por categoria pai, subcategoria ou descrição..."
          className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-xs text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Limpar
          </button>
        )}
      </div>

      {/* ESTRUTURA DE LISTA HIERÁRQUICA (CATEGORIA PAI -> SUBCATEGORIAS) */}
      {ramosFiltrados.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Nenhuma categoria encontrada para os termos pesquisados.
          </p>
          <button
            onClick={() => setBusca('')}
            className="mt-3 text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
          >
            Limpar pesquisa
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {ramosFiltrados.map((ramo) => (
            <div
              key={ramo.chaveRamo}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              {/* CABEÇALHO DO RAMO (CATEGORIA PAI) */}
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Categoria Pai
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {ramo.titulo}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {ramo.descricao}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <span className="rounded-2xl bg-slate-50 px-3 py-1.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    Total: <strong className="text-slate-900 dark:text-white">{ramo.totalPosts} posts</strong>
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleAbrirEditarPai(ramo)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Editar esta Categoria Pai"
                  >
                    ✏️ Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAbrirCriarSub(ramo.chaveRamo)}
                    className="cursor-pointer rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                  >
                    ➕ Nova Subcategoria
                  </button>
                </div>
              </div>

              {/* LISTA EM TABELA/LISTA DAS SUBCATEGORIAS DESTE RAMO */}
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">
                  Subcategorias integradas ({ramo.subcategorias.length}):
                </span>

                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-950/50">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {ramo.subcategorias.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* IDENTIFICAÇÃO DA SUBCATEGORIA */}
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-[0.7rem] font-bold text-amber-700 dark:text-amber-300">
                              sub: {sub.id}
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {sub.nome}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {sub.descricao}
                          </p>
                        </div>

                        {/* MÉTRICAS & BARRA DE PUBLICAÇÃO */}
                        <div className="flex flex-col gap-1.5 sm:w-44 shrink-0">
                          <div className="flex items-center justify-between text-[0.72rem] font-bold">
                            <span className="text-slate-700 dark:text-slate-300">
                              {sub.totalPosts} posts
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {sub.publicados} pub.
                            </span>
                          </div>

                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                              style={{
                                width: `${
                                  sub.totalPosts > 0 ? (sub.publicados / sub.totalPosts) * 100 : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* AÇÕES DA SUBCATEGORIA */}
                        <div className="flex items-center gap-1.5 shrink-0 sm:pl-4">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarSub(sub, ramo.chaveRamo)}
                            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Editar subcategoria"
                          >
                            ✏️ Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluirCategoria(sub.id, sub.nome)}
                            className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50/50 px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500 hover:text-white dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white"
                            title="Excluir subcategoria"
                          >
                            🗑️
                          </button>

                          <Link
                            href={`/admin/posts?categoria=${sub.id}`}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-amber-500 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400"
                          >
                            📁 Posts ({sub.totalPosts})
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CADASTRO E EDIÇÃO DE CATEGORIAS / SUBCATEGORIAS */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {modoModal === 'criar'
                  ? isParent
                    ? '➕ Nova Categoria Pai'
                    : '➕ Nova Subcategoria'
                  : `✏️ Editar ${isParent ? 'Categoria Pai' : 'Subcategoria'}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="cursor-pointer rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {erroModal && (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-700 dark:border-rose-500/40 dark:text-rose-300">
                ⚠️ {erroModal}
              </div>
            )}

            <form onSubmit={handleSalvarCategoria} className="mt-5 flex flex-col gap-4">
              {/* TIPO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nível da Categoria
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsParent(true)}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      isParent
                        ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                    }`}
                  >
                    Categoria Pai (Ramo)
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsParent(false)}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      !isParent
                        ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                    }`}
                  >
                    Subcategoria
                  </button>
                </div>
              </div>

              {/* SE FOR SUBCATEGORIA: SELECIONAR CATEGORIA PAI */}
              {!isParent && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular à Categoria Pai
                  </label>
                  <select
                    value={parentIdCat}
                    onChange={(e) => setParentIdCat(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    {dados.ramos.map((r) => (
                      <option key={r.chaveRamo} value={r.chaveRamo}>
                        {r.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ID / SLUG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Identificador / Slug (único)
                </label>
                <input
                  type="text"
                  value={idCat}
                  onChange={(e) => setIdCat(e.target.value)}
                  placeholder="ex: ia, devops, teologia"
                  required
                  disabled={modoModal === 'editar'}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 outline-none disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* NOME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={nomeCat}
                  onChange={(e) => setNomeCat(e.target.value)}
                  placeholder="ex: Inteligência Artificial, DevOps & Cloud"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição Explicativa
                </label>
                <textarea
                  value={descricaoCat}
                  onChange={(e) => setDescricaoCat(e.target.value)}
                  placeholder="Breve resumo sobre o assunto tratado nesta categoria..."
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* BOTÕES DO MODAL */}
              <div className="mt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="cursor-pointer rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-400 disabled:opacity-50"
                >
                  {salvando ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>💾 Salvar Categoria</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
