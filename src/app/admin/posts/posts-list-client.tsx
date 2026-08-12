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

function EtiquetaStatus({ status }: { status: StatusPost }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold ${CORES_STATUS[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
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

  // Contadores para as Estatísticas
  const totalPosts = postsIniciais.length
  const totalPublicados = postsIniciais.filter((p) => p.status === 'published').length
  const totalRascunhos = postsIniciais.filter((p) => p.status === 'draft').length
  const totalFe = postsIniciais.filter((p) => p.category === 'fe').length
  const totalTech = postsIniciais.filter((p) => p.category !== 'fe').length

  // Filtragem e ordenação computadas
  const postsFiltrados = useMemo(() => {
    return postsIniciais
      .filter((p) => {
        // Filtro por texto (título ou tags)
        if (busca.trim()) {
          const termo = busca.toLowerCase()
          const noTitulo = p.title.toLowerCase().includes(termo)
          const nasTags = p.tags?.some((t) => t.toLowerCase().includes(termo))
          if (!noTitulo && !nasTags) return false
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
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
  }, [postsIniciais, busca, filtroStatus, filtroCategoria, ordenacao])

  return (
    <div className="flex flex-col gap-6">
      {/* CARDS DE RESUMO DE ESTATÍSTICAS */}
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
          <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-200">
            {totalTech} <span className="text-slate-400">Tech |</span> {totalFe} <span className="text-slate-400">Fé</span>
          </p>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
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
            placeholder="Pesquisar artigo por título ou tags..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-9 pr-4 py-2.5 text-xs text-slate-900 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
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
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="todos">Todos Status</option>
            <option value="published">Publicados ({totalPublicados})</option>
            <option value="draft">Rascunhos ({totalRascunhos})</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="todas">Todas Categorias</option>
            <option value="tecnologia">Tecnologia & IA ({totalTech})</option>
            <option value="fe">Fé & Vida Cristã ({totalFe})</option>
          </select>

          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="updated">Mais Recentes</option>
            <option value="published">Data de Publicação</option>
            <option value="title">Título (A-Z)</option>
          </select>
        </div>
      </div>

      {/* LISTA ESPAÇOSA DE CARDS DE POSTS (TÍTULO TOTALMENTE VISÍVEL E SEM SLUG) */}
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
        <div className="flex flex-col gap-4">
          {postsFiltrados.map((p) => {
            return (
              <div
                key={p.id}
                className="group flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* ESQUERDA: CAPA + TÍTULO E METADADOS */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5 flex-1 min-w-0">
                  {/* MINIATURA DA CAPA */}
                  <div className="relative aspect-video h-28 w-full sm:w-44 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    {p.cover_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.cover_url}
                        alt={p.cover_alt || p.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400 dark:text-slate-600">
                        Sem capa
                      </div>
                    )}
                  </div>

                  {/* TÍTULO E DETALHES DE LEITURA */}
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {/* BADGES SUPERIORES */}
                    <div className="flex flex-wrap items-center gap-2">
                      <EtiquetaStatus status={p.status} />

                      <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {ROTULO_CATEGORIA[p.category] ?? p.category}
                      </span>

                      <span className="font-mono text-xs font-semibold text-slate-400">
                        ⏱️ {p.reading_minutes} min de leitura
                      </span>
                    </div>

                    {/* TÍTULO COMPLETO E VISÍVEL (SEM TRUNCAR) */}
                    <Link
                      href={`/admin/posts/${p.id}`}
                      className="text-base font-black text-slate-900 transition-colors hover:text-amber-600 dark:text-white dark:hover:text-amber-400 leading-snug"
                    >
                      {p.title}
                    </Link>

                    {/* DATAS E TAGS */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        📅 Publicado: {formatarDataPainel(p.published_at)}
                      </span>

                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.tags.slice(0, 4).map((t, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[0.65rem] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            >
                              #{t}
                            </span>
                          ))}
                          {p.tags.length > 4 && (
                            <span className="text-[0.65rem] text-slate-400">
                              +{p.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* DIREITA: BARRA DISCRETA DE ÍCONES DE AÇÃO */}
                <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-950 shrink-0 self-start sm:self-center">
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs transition-all hover:border-amber-500 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400"
                    title="Ver no Blog público"
                  >
                    🔗
                  </Link>

                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-700 transition-all hover:bg-amber-500/20 dark:text-amber-300"
                    title="Editar artigo"
                  >
                    ✏️
                  </Link>

                  <AcoesPost id={p.id} titulo={p.title} status={p.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
