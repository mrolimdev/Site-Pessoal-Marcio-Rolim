'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

import {
  ROTULO_CATEGORIA,
  ROTULO_STATUS,
  formatarDataPainel,
  type Categoria,
  type StatusPost,
} from '@/lib/blog/constantes'
import { AcoesPost } from './acoes-post'

export type LinhaListagem = {
  id: string
  slug: string
  title: string
  status: StatusPost
  category: Categoria
  published_at: string | null
  updated_at: string
  reading_minutes: number
  cover_url: string | null
  cover_alt: string | null
  tags: string[] | null
}

const CORES_STATUS: Record<StatusPost, string> = {
  draft: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  scheduled: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20',
  published: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
  archived: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/20',
}

function Etiqueta({ status }: { status: StatusPost }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] font-bold ${CORES_STATUS[status]}`}
    >
      <span>{status === 'published' ? '●' : '○'}</span>
      <span>{ROTULO_STATUS[status]}</span>
    </span>
  )
}

type Props = {
  postsIniciais: LinhaListagem[]
}

export function PostsListClient({ postsIniciais }: Props) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [ordenacao, setOrdenacao] = useState<'updated' | 'published' | 'title'>('updated')

  // Contadores para os Cards de Estatísticas
  const totalPosts = postsIniciais.length
  const totalPublicados = postsIniciais.filter((p) => p.status === 'published').length
  const totalRascunhos = postsIniciais.filter((p) => p.status === 'draft').length
  const totalFe = postsIniciais.filter((p) => p.category === 'fe').length
  const totalTech = postsIniciais.filter((p) => p.category !== 'fe').length

  // Filtragem e ordenação computadas
  const postsFiltrados = useMemo(() => {
    return postsIniciais
      .filter((p) => {
        // Filtro por texto (título, slug ou tags)
        if (busca.trim()) {
          const termo = busca.toLowerCase()
          const noTitulo = p.title.toLowerCase().includes(termo)
          const noSlug = p.slug.toLowerCase().includes(termo)
          const nasTags = p.tags?.some((t) => t.toLowerCase().includes(termo))
          if (!noTitulo && !noSlug && !nasTags) return false
        }

        // Filtro por status
        if (filtroStatus === 'published' && p.status !== 'published') return false
        if (filtroStatus === 'draft' && p.status !== 'draft') return false

        // Filtro por categoria
        if (filtroCategoria === 'fe' && p.category !== 'fe') return false
        if (filtroCategoria === 'tecnologia' && p.category === 'fe') return false

        return true
      })
      .sort((a, b) => {
        if (ordenacao === 'published') {
          const da = a.published_at ? new Date(a.published_at).getTime() : 0
          const db = b.published_at ? new Date(b.published_at).getTime() : 0
          return db - da
        }
        if (ordenacao === 'title') {
          return a.title.localeCompare(b.title)
        }
        // padrão: updated_at mais recente primeiro
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
  }, [postsIniciais, busca, filtroStatus, filtroCategoria, ordenacao])

  return (
    <div className="flex flex-col gap-6">
      {/* CARDS DE ESTATÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
            Total de Posts
          </span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalPosts}</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm dark:bg-emerald-500/10">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Publicados
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {totalPublicados}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm dark:bg-amber-500/10">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Rascunhos
          </span>
          <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
            {totalRascunhos}
          </p>
        </div>

        <div className="rounded-3xl border border-sky-500/20 bg-sky-500/5 p-4 shadow-sm dark:bg-sky-500/10">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Tech vs Fé
          </span>
          <p className="mt-1 text-base font-black text-slate-800 dark:text-slate-200">
            {totalTech} <span className="text-slate-400">Tech |</span> {totalFe} <span className="text-slate-400">Fé</span>
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS E PESQUISA */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Campo de Pesquisa */}
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, slug ou tags..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-9 pr-4 py-2 text-xs text-slate-900 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros em Pílulas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="todos">Todos Status</option>
            <option value="published">Publicados ({totalPublicados})</option>
            <option value="draft">Rascunhos ({totalRascunhos})</option>
          </select>

          {/* Categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="todas">Todas Categorias</option>
            <option value="tecnologia">Tecnologia & IA ({totalTech})</option>
            <option value="fe">Fé & Vida Cristã ({totalFe})</option>
          </select>

          {/* Ordenação */}
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="updated">Mais Recentes</option>
            <option value="published">Data de Publicação</option>
            <option value="title">Título (A-Z)</option>
          </select>
        </div>
      </div>

      {/* LISTA E TABELA DE POSTS COM MINIATURA DE CAPA */}
      {postsFiltrados.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Nenhum post encontrado para os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setBusca('')
              setFiltroStatus('todos')
              setFiltroCategoria('todas')
            }}
            className="mt-3 text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[0.68rem] font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/60">
                  <th scope="col" className="px-4 py-3.5">
                    Capa & Artigo
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Categoria
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Datas
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Ações de Gestão
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {postsFiltrados.map((p) => {
                  const eFe = p.category === 'fe'
                  return (
                    <tr
                      key={p.id}
                      className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-950/40"
                    >
                      {/* COLUNA 1: MINIATURA DA CAPA + TÍTULO */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3.5">
                          {/* MINIATURA DA CAPA */}
                          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            {p.cover_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={p.cover_url}
                                alt={p.cover_alt || p.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[0.65rem] font-bold text-slate-400 dark:text-slate-600">
                                Sem capa
                              </div>
                            )}
                          </div>

                          {/* TÍTULO E DETALHES */}
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <Link
                              href={`/admin/posts/${p.id}`}
                              className="font-bold text-xs text-slate-900 transition-colors hover:text-amber-600 dark:text-white dark:hover:text-amber-400 line-clamp-1"
                              title={p.title}
                            >
                              {p.title}
                            </Link>
                            <div className="flex items-center gap-2 text-[0.7rem] text-slate-400 font-mono">
                              <span>/blog/{p.slug}</span>
                              <span>•</span>
                              <span>⏱️ {p.reading_minutes} min</span>
                            </div>

                            {/* TAGS */}
                            {p.tags && p.tags.length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {p.tags.slice(0, 3).map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-full bg-slate-100 px-1.5 py-0.2 font-mono text-[0.62rem] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {p.tags.length > 3 && (
                                  <span className="text-[0.62rem] text-slate-400">
                                    +{p.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COLUNA 2: STATUS */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Etiqueta status={p.status} />
                      </td>

                      {/* COLUNA 3: CATEGORIA */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <span>{ROTULO_CATEGORIA[p.category] ?? p.category}</span>
                        </span>
                      </td>

                      {/* COLUNA 4: DATAS */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-[0.7rem] text-slate-500 dark:text-slate-400">
                          <span>Pub: {formatarDataPainel(p.published_at)}</span>
                          <span className="text-slate-400 text-[0.65rem]">
                            Att: {formatarDataPainel(p.updated_at)}
                          </span>
                        </div>
                      </td>

                      {/* COLUNA 5: AÇÕES DE GESTÃO */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* BOTÃO VER NO BLOG */}
                          <Link
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:border-amber-500 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-amber-400"
                            title="Ver no Blog"
                          >
                            🔗 Ver
                          </Link>

                          {/* BOTÃO EDITAR */}
                          <Link
                            href={`/admin/posts/${p.id}`}
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                            title="Editar Post"
                          >
                            ✏️ Editar
                          </Link>

                          {/* BOTÕES PUBLICAR / EXCLUIR */}
                          <AcoesPost id={p.id} titulo={p.title} status={p.status} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
