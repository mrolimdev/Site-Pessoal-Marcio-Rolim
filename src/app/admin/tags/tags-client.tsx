'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  renomearTagAction,
  removerTagAction,
  type EstatisticaTag,
} from '@/actions/categorias-tags'

type Props = {
  tagsIniciais: EstatisticaTag[]
}

export function TagsClient({ tagsIniciais }: Props) {
  const [tags, setTags] = useState<EstatisticaTag[]>(tagsIniciais)
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<'uso' | 'alfabetica'>('uso')

  // Modal / Ações de Edição
  const [tagEditando, setTagEditando] = useState<string | null>(null)
  const [novoNome, setNovoNome] = useState('')

  const [tagDeletando, setTagDeletando] = useState<string | null>(null)

  const [pendente, iniciarTransicao] = useTransition()
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Filtro e Ordenação
  const tagsFiltradas = tags
    .filter((t) => t.tag.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => {
      if (ordem === 'uso') return b.totalPosts - a.totalPosts
      return a.tag.localeCompare(b.tag)
    })

  const totalTagsUnicas = tags.length
  const totalUsosTags = tags.reduce((acc, curr) => acc + curr.totalPosts, 0)

  const handleSalvarRenomeacao = (tagAntiga: string) => {
    if (!novoNome.trim() || novoNome.trim() === tagAntiga) {
      setTagEditando(null)
      return
    }

    setErro(null)
    setMensagemSucesso(null)

    iniciarTransicao(async () => {
      const res = await renomearTagAction(tagAntiga, novoNome)
      if (res.ok) {
        setMensagemSucesso(res.mensagem || 'Tag renomeada com sucesso!')
        setTags((prev) =>
          prev.map((t) => {
            if (t.tag === tagAntiga) {
              return { ...t, tag: novoNome.trim().toLowerCase() }
            }
            return t
          })
        )
        setTagEditando(null)
      } else {
        setErro(res.erro || 'Erro ao renomear tag.')
      }
    })
  }

  const handleConfirmarRemocao = (tagParaRemover: string) => {
    setErro(null)
    setMensagemSucesso(null)

    iniciarTransicao(async () => {
      const res = await removerTagAction(tagParaRemover)
      if (res.ok) {
        setMensagemSucesso(res.mensagem || 'Tag removida com sucesso!')
        setTags((prev) => prev.filter((t) => t.tag !== tagParaRemover))
        setTagDeletando(null)
      } else {
        setErro(res.erro || 'Erro ao remover tag.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏷️</span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Gerenciador de Tags
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Analise o volume de tags utilizadas nos artigos, renomeie em massa ou remova palavras-chave antigas.
          </p>
        </div>
      </div>

      {/* FEEDBACK DE SUCESSO OU ERRO */}
      {mensagemSucesso && (
        <div className="animate-fade-in flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300">
          <span>✅ {mensagemSucesso}</span>
          <button onClick={() => setMensagemSucesso(null)} className="hover:underline">
            ✕
          </button>
        </div>
      )}

      {erro && (
        <div className="animate-fade-in flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-bold text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-300">
          <span>⚠️ {erro}</span>
          <button onClick={() => setErro(null)} className="hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* CARDS DE ESTATÍSTICA DE TAGS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total de Tags Únicas
          </span>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            {totalTagsUnicas}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total de Ocorrências em Posts
          </span>
          <span className="text-3xl font-black text-amber-500">
            {totalUsosTags}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Média por Artigo
          </span>
          <span className="text-3xl font-black text-sky-500">
            {tags.length > 0 ? (totalUsosTags / Math.max(1, tags.length)).toFixed(1) : 0}
          </span>
        </div>
      </div>

      {/* FERRAMENTAS DE PESQUISA E ORDENAÇÃO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-base text-slate-400">🔍</span>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar tag por nome..."
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Ordenar por:
          </span>
          <button
            onClick={() => setOrdem('uso')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              ordem === 'uso'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
            }`}
          >
            🔥 Mais usadas
          </button>
          <button
            onClick={() => setOrdem('alfabetica')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              ordem === 'alfabetica'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
            }`}
          >
            🔤 Alfabética
          </button>
        </div>
      </div>

      {/* TABELA DE TAGS */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Nome da Tag</th>
                <th className="px-6 py-4">Artigos Associados</th>
                <th className="px-6 py-4">Publicados / Rascunhos</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tagsFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma tag encontrada para &quot;{busca}&quot;.
                  </td>
                </tr>
              ) : (
                tagsFiltradas.map((t) => {
                  const editando = tagEditando === t.tag
                  const deletando = tagDeletando === t.tag

                  return (
                    <tr
                      key={t.tag}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {editando ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={novoNome}
                              onChange={(e) => setNovoNome(e.target.value)}
                              className="rounded-xl border border-amber-500 bg-white px-3 py-1 text-xs text-slate-900 outline-none dark:bg-slate-950 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSalvarRenomeacao(t.tag)}
                              disabled={pendente}
                              className="rounded-xl bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setTagEditando(null)}
                              className="text-xs text-slate-400 hover:underline"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="rounded-xl bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-amber-700 dark:bg-slate-800 dark:text-amber-300">
                              #{t.tag}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t.totalPosts} post(s)
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {t.publicados} publicado(s)
                        </span>
                        {t.rascunhos > 0 && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400">
                            • {t.rascunhos} rascunho(s)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {deletando ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-rose-500 font-bold">
                              Remover de {t.totalPosts} post(s)?
                            </span>
                            <button
                              onClick={() => handleConfirmarRemocao(t.tag)}
                              disabled={pendente}
                              className="rounded-xl bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-500"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setTagDeletando(null)}
                              className="text-xs text-slate-400 hover:underline"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/blog/tag/${t.tag}`}
                              target="_blank"
                              className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                              title="Ver tag pública"
                            >
                              🔗 Ver
                            </Link>

                            <button
                              onClick={() => {
                                setTagEditando(t.tag)
                                setNovoNome(t.tag)
                              }}
                              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                            >
                              ✏️ Renomear
                            </button>

                            <button
                              onClick={() => setTagDeletando(t.tag)}
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
                            >
                              🗑️ Excluir
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
