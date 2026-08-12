'use client'

import type { JSONContent } from '@tiptap/react'
import Link from 'next/link'
import { useActionState, useCallback, useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { criarPost, salvarPost, type EstadoPost } from '@/actions/posts'
import { gerarNovaImagemCapaIaAction, type ResultadoPostIa } from '@/actions/gerar-post-ia'
import { ArrowLeftIcon } from '@/components/icons'
import { ModalGeradorIa } from './modal-gerador-ia'
import {
  LIMITES,
  REGEX_SLUG,
  ROTULO_CATEGORIA,
  ROTULO_STATUS,
  VALORES_CATEGORIA,
  VALORES_STATUS,
  gerarSlug,
  isoParaCampoData,
  type Categoria,
  type StatusPost,
} from '@/lib/blog/constantes'

import { DOC_VAZIO, EditorConteudo } from './editor-conteudo'

export type PostDTO = {
  id: string
  slug: string
  titulo: string
  resumo: string
  conteudo: JSONContent | null
  capaUrl: string
  capaAlt: string
  categoria: Categoria
  tags: string[]
  status: StatusPost
  publicadoEm: string | null
  seoTitulo: string
  seoDescricao: string
  noindex: boolean
}

type Props = {
  post: PostDTO | null
}

const CLASSE_CAMPO =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-white'

const CLASSE_CAMPO_ERRO = 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-500'

function Rotulo({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
      {children}
    </label>
  )
}

function ErroCampo({ mensagem, id }: { mensagem?: string; id: string }) {
  if (!mensagem) return null

  return (
    <p id={id} role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
      ⚠️ {mensagem}
    </p>
  )
}

function Dica({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-500 dark:text-slate-400">{children}</p>
}

function Contador({ atual, limite }: { atual: number; limite: number }) {
  const estourou = atual > limite

  return (
    <span
      className={`text-xs font-mono tabular-nums ${
        estourou ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-400'
      }`}
    >
      {atual}/{limite}
    </span>
  )
}

function Cartao({ titulo, children, icone }: { titulo: string; children: React.ReactNode; icone?: string }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-wider text-slate-900 uppercase dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
        {icone && <span>{icone}</span>}
        <span>{titulo}</span>
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export function PostForm({ post }: Props) {
  const modoNovo = post === null

  const [estado, executar, pendente] = useActionState<EstadoPost, FormData>(
    modoNovo ? criarPost : salvarPost,
    {}
  )

  const idBase = useId()
  const campoId = (nome: string) => `${idBase}-${nome}`
  const erroId = (nome: string) => `${idBase}-${nome}-erro`
  const erros = estado.erros ?? {}

  const refFormulario = useRef<HTMLFormElement>(null)
  const refConteudo = useRef<HTMLInputElement>(null)

  const [titulo, setTitulo] = useState(post?.titulo ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!modoNovo)
  const [resumo, setResumo] = useState(post?.resumo ?? '')
  const [seoTitulo, setSeoTitulo] = useState(post?.seoTitulo ?? '')
  const [seoDescricao, setSeoDescricao] = useState(post?.seoDescricao ?? '')
  const [status, setStatus] = useState<StatusPost>(post?.status ?? 'draft')
  const [categoria, setCategoria] = useState<Categoria>(post?.categoria ?? 'tecnologia')
  const [capaUrl, setCapaUrl] = useState(post?.capaUrl ?? '')
  const [capaAlt, setCapaAlt] = useState(post?.capaAlt ?? '')
  const [tags, setTags] = useState(post?.tags ? post.tags.join(', ') : '')
  const [sujo, setSujo] = useState(false)
  const [salveObservado, setSalveObservado] = useState(estado.salvoEm)

  // Assistente de IA & Regeração de Capa
  const [modalIaAberto, setModalIaAberto] = useState(false)
  const [gerandoCapaIa, setGerandoCapaIa] = useState(false)
  const [erroCapaIa, setErroCapaIa] = useState<string | null>(null)
  const [keyEditor, setKeyEditor] = useState(0)
  const [conteudoInicial, setConteudoInicial] = useState<JSONContent | null>(post?.conteudo ?? null)
  const [conteudoJson, setConteudoJson] = useState<string>(() => JSON.stringify(post?.conteudo ?? DOC_VAZIO))

  const handleGerarNovaCapaIa = async () => {
    setGerandoCapaIa(true)
    setErroCapaIa(null)

    const salvaKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_admin_api_key') || undefined : undefined
    const salvaImgMod = typeof window !== 'undefined' ? localStorage.getItem('gemini_admin_image_model_id') || undefined : undefined

    const resp = await gerarNovaImagemCapaIaAction({
      titulo: titulo || 'Artigo do Blog',
      slug,
      categoria,
      apiKeyInformada: salvaKey,
      modeloImagemId: salvaImgMod,
    })

    setGerandoCapaIa(false)

    if (resp.ok && resp.capaUrl) {
      setCapaUrl(resp.capaUrl)
      if (resp.capaAlt) setCapaAlt(resp.capaAlt)
      setSujo(true)
    } else {
      setErroCapaIa(resp.erro || 'Não foi possível gerar a capa por IA.')
    }
  }

  const aoAplicarPostIa = (resultado: ResultadoPostIa) => {
    const jsonStr = JSON.stringify(resultado.contentJson)

    setTitulo(resultado.titulo)
    setSlug(resultado.slug)
    setSlugManual(true)
    setResumo(resultado.resumo)
    setSeoTitulo(resultado.seoTitulo)
    setSeoDescricao(resultado.seoDescricao)
    setCapaUrl(resultado.capaUrl)
    setCapaAlt(resultado.capaAlt)
    setTags(resultado.tags.join(', '))
    setCategoria(resultado.categoria)
    setStatus('published')
    setDataPublicacao(isoParaCampoData(new Date().toISOString()))
    setConteudoInicial(resultado.contentJson)
    setConteudoJson(jsonStr)

    if (refConteudo.current) {
      refConteudo.current.value = jsonStr
    }

    setKeyEditor((k) => k + 1)
    setSujo(true)
  }

  if (estado.salvoEm !== salveObservado) {
    setSalveObservado(estado.salvoEm)
    setSujo(false)
  }

  const [dataPublicacao, setDataPublicacao] = useState(() => isoParaCampoData(post?.publicadoEm))
  const slugValido = slug === '' || REGEX_SLUG.test(slug)

  const aoAtualizarConteudo = useCallback((documento: JSONContent) => {
    const temTexto = Boolean(
      documento?.content?.some(
        (n: any) => n.content?.length > 0 || n.type === 'heading' || n.type === 'bulletList' || n.type === 'blockquote'
      )
    )

    const strDoc = JSON.stringify(documento)
    if (temTexto) {
      setConteudoJson(strDoc)
      if (refConteudo.current) refConteudo.current.value = strDoc
    }
    setSujo(true)
  }, [])

  useEffect(() => {
    if (!sujo) return
    const aoSair = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', aoSair)
    return () => window.removeEventListener('beforeunload', aoSair)
  }, [sujo])

  function publicarAgora() {
    flushSync(() => setStatus('published'))
    refFormulario.current?.requestSubmit()
  }

  function salvarComoRascunho() {
    flushSync(() => setStatus('draft'))
    refFormulario.current?.requestSubmit()
  }

  function aoMudarTitulo(valor: string) {
    setTitulo(valor)
    setSujo(true)
    if (!slugManual) setSlug(gerarSlug(valor))
  }

  function aoMudarSlug(valor: string) {
    setSlugManual(true)
    setSujo(true)
    setSlug(valor.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))
  }

  return (
    <>
      <ModalGeradorIa
        aberto={modalIaAberto}
        onFechar={() => setModalIaAberto(false)}
        onAplicarAoFormulario={aoAplicarPostIa}
        categoriaAtual={categoria}
      />

      <form ref={refFormulario} action={executar} className="flex flex-col gap-6 pb-12">
        {!modoNovo && <input type="hidden" name="id" value={post.id} />}

        <input
          ref={refConteudo}
          type="hidden"
          name="conteudo"
          value={conteudoJson}
          onChange={(e) => setConteudoJson(e.target.value)}
        />

        {/* ── BARRA FIXA DE NAVEGAÇÃO E AÇÕES ──────────────────────────────── */}
        <header className="sticky top-0 z-30 -mx-4 -mt-4 bg-white/85 px-4 py-4 backdrop-blur-md dark:bg-slate-950/85 sm:-mx-8 sm:px-8 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/posts"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-amber-500 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                title="Voltar para a lista de posts"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    {modoNovo ? 'Novo Post' : 'Editar Post'}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] font-bold ${
                      status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : status === 'scheduled'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {ROTULO_STATUS[status]}
                  </span>
                </div>
                {sujo && (
                  <p className="text-[0.7rem] font-semibold text-amber-600 dark:text-amber-400">
                    ● Alterações não salvas
                  </p>
                )}
              </div>
            </div>

            {/* AÇÕES PRINCIPAIS */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Botão de Destaque da IA */}
              <button
                type="button"
                onClick={() => setModalIaAberto(true)}
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition-all hover:scale-105 hover:shadow-amber-500/25"
              >
                <span>✨ Gerar com IA (Gemini)</span>
              </button>

              {/* Botão Rascunho se não estiver publicado */}
              {status !== 'published' && (
                <button
                  type="button"
                  onClick={salvarComoRascunho}
                  disabled={pendente}
                  className="cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  💾 Salvar Rascunho
                </button>
              )}

              {/* Botão Principal de Publicar / Salvar */}
              <button
                type="button"
                onClick={publicarAgora}
                disabled={pendente}
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-500 hover:scale-105 disabled:opacity-50"
              >
                <span>🚀 {pendente ? 'Salvando…' : status === 'published' ? 'Salvar Alterações' : 'Publicar Agora'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── FEEDBACKS ───────────────────────────────────────────────────── */}
        {estado.erro && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-bold text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-300"
          >
            <span className="text-xl">⚠️</span>
            <p>{estado.erro}</p>
          </div>
        )}

        {estado.ok && estado.mensagem && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300"
          >
            <span className="text-xl">✅</span>
            <p>{estado.mensagem}</p>
          </div>
        )}

        {/* ── GRID PRINCIPAL DO EDITOR ────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          {/* COLUNA ESQUERDA: CONTEÚDO PRINCIPAL */}
          <div className="flex flex-col gap-6">
            {/* CARD 1: TÍTULO, SLUG E RESUMO */}
            <div className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {/* Título */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Rotulo htmlFor={campoId('titulo')}>Título do Artigo</Rotulo>
                  <Contador atual={titulo.length} limite={LIMITES.tituloMax} />
                </div>
                <input
                  id={campoId('titulo')}
                  name="titulo"
                  value={titulo}
                  onChange={(e) => aoMudarTitulo(e.target.value)}
                  placeholder="Ex: Como Usar IA para Criar e Lançar um Projeto Digital"
                  required
                  maxLength={LIMITES.tituloMax}
                  aria-invalid={Boolean(erros.titulo)}
                  aria-describedby={erros.titulo ? erroId('titulo') : undefined}
                  className={`${CLASSE_CAMPO} text-base font-bold ${erros.titulo ? CLASSE_CAMPO_ERRO : ''}`}
                />
                <ErroCampo mensagem={erros.titulo} id={erroId('titulo')} />
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <Rotulo htmlFor={campoId('slug')}>Slug de URL (Link Permanente)</Rotulo>
                <div className="flex gap-2">
                  <input
                    id={campoId('slug')}
                    name="slug"
                    value={slug}
                    onChange={(e) => aoMudarSlug(e.target.value)}
                    required
                    maxLength={LIMITES.slugMax}
                    aria-invalid={Boolean(erros.slug) || !slugValido}
                    aria-describedby={erros.slug ? erroId('slug') : undefined}
                    className={`${CLASSE_CAMPO} font-mono text-xs ${
                      erros.slug || !slugValido ? CLASSE_CAMPO_ERRO : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSlug(gerarSlug(titulo))
                      setSlugManual(true)
                      setSujo(true)
                    }}
                    className="shrink-0 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    ⚡ Gerar do Título
                  </button>
                </div>
                <Dica>
                  marciorolim.com.br/blog/<span className="font-mono font-bold text-amber-600 dark:text-amber-400">{slug || 'seu-slug'}</span>
                </Dica>
                <ErroCampo mensagem={erros.slug} id={erroId('slug')} />
              </div>

              {/* Resumo */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Rotulo htmlFor={campoId('resumo')}>Resumo / Excerpt</Rotulo>
                  <Contador atual={resumo.length} limite={LIMITES.resumoMax} />
                </div>
                <textarea
                  id={campoId('resumo')}
                  name="resumo"
                  value={resumo}
                  onChange={(e) => {
                    setResumo(e.target.value)
                    setSujo(true)
                  }}
                  rows={3}
                  placeholder="Resumo chamativo de 2 a 3 frases para as listagens e redes sociais..."
                  maxLength={LIMITES.resumoMax}
                  aria-invalid={Boolean(erros.resumo)}
                  aria-describedby={erros.resumo ? erroId('resumo') : undefined}
                  className={`${CLASSE_CAMPO} resize-y text-xs leading-relaxed ${erros.resumo ? CLASSE_CAMPO_ERRO : ''}`}
                />
                <Dica>Aparece nos cartões da home, listagens e meta tags de redes sociais.</Dica>
                <ErroCampo mensagem={erros.resumo} id={erroId('resumo')} />
              </div>
            </div>

            {/* CARD 2: EDITOR DE CONTEÚDO RICH-TEXT */}
            <div className="flex flex-col gap-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-white flex items-center gap-2">
                  <span>📝 Conteúdo do Artigo</span>
                </span>
              </div>

              <EditorConteudo
                key={keyEditor}
                conteudoInicial={conteudoInicial}
                aoAtualizar={aoAtualizarConteudo}
              />
              <ErroCampo mensagem={erros.conteudo} id={erroId('conteudo')} />
            </div>
          </div>

          {/* COLUNA DIREITA: CONFIGURAÇÕES E METADADOS */}
          <aside className="flex flex-col gap-5">
            {/* CARD: PUBLICAÇÃO */}
            <Cartao titulo="Publicação & Categoria" icone="⚙️">
              <div className="flex flex-col gap-1.5">
                <Rotulo htmlFor={campoId('status')}>Status</Rotulo>
                <select
                  id={campoId('status')}
                  name="status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as StatusPost)
                    setSujo(true)
                  }}
                  className={CLASSE_CAMPO}
                >
                  {VALORES_STATUS.map((valor) => (
                    <option key={valor} value={valor}>
                      {ROTULO_STATUS[valor]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Rotulo htmlFor={campoId('publicado_em')}>Data de Publicação</Rotulo>
                <input
                  id={campoId('publicado_em')}
                  name="publicado_em"
                  type="datetime-local"
                  value={dataPublicacao}
                  onChange={(e) => {
                    setDataPublicacao(e.target.value)
                    setSujo(true)
                  }}
                  aria-invalid={Boolean(erros.publicado_em)}
                  aria-describedby={erros.publicado_em ? erroId('publicado_em') : undefined}
                  className={`${CLASSE_CAMPO} text-xs ${erros.publicado_em ? CLASSE_CAMPO_ERRO : ''}`}
                />
                <Dica>Fuso oficial de Brasília.</Dica>
                <ErroCampo mensagem={erros.publicado_em} id={erroId('publicado_em')} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Rotulo htmlFor={campoId('categoria')}>Categoria</Rotulo>
                <select
                  id={campoId('categoria')}
                  name="categoria"
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value as Categoria)
                    setSujo(true)
                  }}
                  className={CLASSE_CAMPO}
                >
                  {VALORES_CATEGORIA.map((valor) => (
                    <option key={valor} value={valor}>
                      {ROTULO_CATEGORIA[valor]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Rotulo htmlFor={campoId('tags')}>Tags</Rotulo>
                <input
                  id={campoId('tags')}
                  name="tags"
                  value={tags}
                  onChange={(e) => {
                    setTags(e.target.value)
                    setSujo(true)
                  }}
                  placeholder="ia, automação, fé"
                  className={CLASSE_CAMPO}
                />
                <Dica>Separadas por vírgula (minúsculas).</Dica>
              </div>
            </Cartao>

            {/* CARD: CAPA */}
            <Cartao titulo="Imagem de Capa" icone="🖼️">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Rotulo htmlFor={campoId('capa_url')}>URL da Imagem</Rotulo>
                  <button
                    type="button"
                    onClick={handleGerarNovaCapaIa}
                    disabled={gerandoCapaIa}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[0.7rem] font-bold text-amber-700 hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-300"
                  >
                    {gerandoCapaIa ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent dark:border-amber-400" />
                        <span>Gerando por IA...</span>
                      </>
                    ) : (
                      <>✨ Gerar Capa por IA</>
                    )}
                  </button>
                </div>
                <input
                  id={campoId('capa_url')}
                  name="capa_url"
                  type="url"
                  value={capaUrl}
                  onChange={(e) => {
                    setCapaUrl(e.target.value)
                    setSujo(true)
                  }}
                  placeholder="https://.../imagem.jpg"
                  aria-invalid={Boolean(erros.capa_url)}
                  aria-describedby={erros.capa_url ? erroId('capa_url') : undefined}
                  className={`${CLASSE_CAMPO} text-xs ${erros.capa_url ? CLASSE_CAMPO_ERRO : ''}`}
                />
                <ErroCampo mensagem={erros.capa_url} id={erroId('capa_url')} />
                {erroCapaIa && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    ⚠️ {erroCapaIa}
                  </p>
                )}
              </div>

              {capaUrl && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capaUrl}
                    alt={capaAlt || 'Prévia da capa'}
                    className="aspect-video w-full object-cover"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Rotulo htmlFor={campoId('capa_alt')}>Texto Alternativo (Acessibilidade)</Rotulo>
                <input
                  id={campoId('capa_alt')}
                  name="capa_alt"
                  value={capaAlt}
                  onChange={(e) => {
                    setCapaAlt(e.target.value)
                    setSujo(true)
                  }}
                  placeholder="Descrição da imagem para leitores de tela"
                  required={Boolean(capaUrl)}
                  aria-invalid={Boolean(erros.capa_alt)}
                  aria-describedby={erros.capa_alt ? erroId('capa_alt') : undefined}
                  className={`${CLASSE_CAMPO} text-xs ${erros.capa_alt ? CLASSE_CAMPO_ERRO : ''}`}
                />
                <ErroCampo mensagem={erros.capa_alt} id={erroId('capa_alt')} />
              </div>
            </Cartao>

            {/* CARD: SEO & PRÉVIA DO GOOGLE */}
            <Cartao titulo="SEO & Prévia no Google" icone="🔎">
              <div className="flex flex-col gap-1.5">
                <Rotulo htmlFor={campoId('seo_titulo')}>Título de SEO</Rotulo>
                <input
                  id={campoId('seo_titulo')}
                  name="seo_titulo"
                  value={seoTitulo}
                  onChange={(e) => {
                    setSeoTitulo(e.target.value)
                    setSujo(true)
                  }}
                  maxLength={200}
                  aria-invalid={Boolean(erros.seo_titulo)}
                  aria-describedby={erros.seo_titulo ? erroId('seo_titulo') : undefined}
                  className={`${CLASSE_CAMPO} text-xs ${erros.seo_titulo ? CLASSE_CAMPO_ERRO : ''}`}
                />
                <ErroCampo mensagem={erros.seo_titulo} id={erroId('seo_titulo')} />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Rotulo htmlFor={campoId('seo_descricao')}>Descrição de SEO</Rotulo>
                  <Contador atual={seoDescricao.length} limite={LIMITES.seoDescricaoMax} />
                </div>
                <textarea
                  id={campoId('seo_descricao')}
                  name="seo_descricao"
                  value={seoDescricao}
                  onChange={(e) => {
                    setSeoDescricao(e.target.value)
                    setSujo(true)
                  }}
                  rows={3}
                  maxLength={LIMITES.seoDescricaoMax}
                  aria-invalid={Boolean(erros.seo_descricao)}
                  aria-describedby={erros.seo_descricao ? erroId('seo_descricao') : undefined}
                  className={`${CLASSE_CAMPO} resize-y text-xs ${
                    erros.seo_descricao ? CLASSE_CAMPO_ERRO : ''
                  }`}
                />
                <ErroCampo mensagem={erros.seo_descricao} id={erroId('seo_descricao')} />
              </div>

              {/* CARD DE PRÉVIA AO VIVO NO GOOGLE */}
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <span className="text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                  Prévia no Google Search
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                  marciorolim.com.br › blog › {slug || 'seu-slug'}
                </span>
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline line-clamp-1">
                  {seoTitulo || titulo || 'Título do seu artigo'}
                </h4>
                <p className="text-[0.7rem] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">
                  {seoDescricao || resumo || 'Aparecerá a descrição personalizada de SEO aqui...'}
                </p>
              </div>

              <label className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  name="noindex"
                  defaultChecked={post?.noindex ?? false}
                  onChange={() => setSujo(true)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-amber-500 dark:border-slate-600"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ocultar dos Buscadores (noindex)
                  </span>
                </span>
              </label>
            </Cartao>
          </aside>
        </div>
      </form>
    </>
  )
}
