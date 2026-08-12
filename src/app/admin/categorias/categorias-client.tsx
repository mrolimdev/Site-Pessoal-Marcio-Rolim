'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { EstatisticaCategoria } from '@/actions/categorias-tags'

type Props = {
  categoriasIniciais: EstatisticaCategoria[]
}

export function CategoriasClient({ categoriasIniciais }: Props) {
  const [busca, setBusca] = useState('')
  const [categorias] = useState<EstatisticaCategoria[]>(categoriasIniciais)

  const categoriasFiltradas = categorias.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      c.id.toLowerCase().includes(busca.toLowerCase())
  )

  const totalGeralPosts = categorias.reduce((acc, curr) => acc + curr.totalPosts, 0)
  const totalPublicados = categorias.reduce((acc, curr) => acc + curr.publicados, 0)

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📁</span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Gerenciador de Categorias
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitore a distribuição de artigos e navegue rapidamente entre as categorias do blog.
          </p>
        </div>

        <Link
          href="/admin/posts/novo"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-amber-400 hover:shadow-lg"
        >
          <span>✍️ Criar Novo Post</span>
        </Link>
      </div>

      {/* CARDS DE RESUMO DE PERFORMANCE */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total de Categorias
          </span>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            {categorias.length}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Artigos Catalogados
          </span>
          <span className="text-3xl font-black text-amber-500">
            {totalGeralPosts}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Artigos Publicados
          </span>
          <span className="text-3xl font-black text-emerald-500">
            {totalPublicados}
          </span>
        </div>
      </div>

      {/* CAMPO DE PESQUISA */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="text-lg text-slate-400">🔍</span>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Filtrar categorias por nome ou descrição..."
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Limpar
          </button>
        )}
      </div>

      {/* GRID DE CATEGORIAS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categoriasFiltradas.map((cat) => (
          <div
            key={cat.id}
            className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-amber-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/50"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-amber-500 dark:text-white">
                  {cat.nome}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {cat.id}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                  {cat.descricao}
                </p>
              </div>

              {/* BARRA DE PROGRESSO E MÉTRICAS */}
              <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">
                    Total: <strong className="text-slate-900 dark:text-white">{cat.totalPosts} posts</strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {cat.publicados} publicados
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${cat.totalPosts > 0 ? (cat.publicados / cat.totalPosts) * 100 : 0}%`,
                    }}
                  />
                </div>

                {cat.rascunhos > 0 && (
                  <span className="text-[0.7rem] font-semibold text-amber-600 dark:text-amber-400">
                    ⏳ {cat.rascunhos} rascunho(s) pendente(s)
                  </span>
                )}
              </div>
            </div>

            {/* AÇÕES DA CATEGORIA */}
            <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                href={`/admin/posts?categoria=${cat.id}`}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Ver Posts ({cat.totalPosts})
              </Link>
              <Link
                href={`/admin/posts/novo?categoria=${cat.id}`}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                title="Criar post nesta categoria"
              >
                ✍️ +Novo
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
