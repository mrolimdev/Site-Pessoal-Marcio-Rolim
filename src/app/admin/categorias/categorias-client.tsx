'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { RespostaEstatisticasCategorias } from '@/actions/categorias-tags'

type Props = {
  dadosIniciais: RespostaEstatisticasCategorias
}

export function CategoriasClient({ dadosIniciais }: Props) {
  const [busca, setBusca] = useState('')
  const [dados] = useState<RespostaEstatisticasCategorias>(dadosIniciais)

  // Estatísticas Globais
  const totalGeralSubcategorias = dados.subcategorias.length
  const totalGeralPosts = dados.subcategorias.reduce((acc, curr) => acc + curr.totalPosts, 0)
  const totalPublicados = dados.subcategorias.reduce((acc, curr) => acc + curr.publicados, 0)

  // Filtragem
  const ramosFiltrados = dados.ramos.map((ramo) => {
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
  }).filter((ramo) => ramo.subcategorias.length > 0)

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
            Estrutura hierárquica em lista para gerenciar divisões principais e subcategorias do blog.
          </p>
        </div>

        <Link
          href="/admin/posts/novo"
          className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:scale-105"
        >
          <span>✍️ Criar Novo Post</span>
        </Link>
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

                <div className="flex items-center gap-3 shrink-0">
                  <span className="rounded-2xl bg-slate-50 px-3 py-1.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    Total: <strong className="text-slate-900 dark:text-white">{ramo.totalPosts} posts</strong>
                  </span>
                  <span className="rounded-2xl bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {ramo.publicados} publicados
                  </span>
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
                        <div className="flex flex-col gap-1.5 sm:w-48 shrink-0">
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

                          {sub.rascunhos > 0 && (
                            <span className="text-[0.65rem] font-semibold text-amber-600 dark:text-amber-400">
                              ⏳ {sub.rascunhos} rascunho(s)
                            </span>
                          )}
                        </div>

                        {/* AÇÕES DA SUBCATEGORIA */}
                        <div className="flex items-center gap-2 shrink-0 sm:pl-4">
                          <Link
                            href={`/admin/posts?categoria=${sub.id}`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-amber-500 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400"
                          >
                            Ver Posts ({sub.totalPosts})
                          </Link>
                          <Link
                            href={`/admin/posts/novo?categoria=${sub.id}`}
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                            title="Criar post nesta subcategoria"
                          >
                            ✍️ +Novo
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
    </div>
  )
}
