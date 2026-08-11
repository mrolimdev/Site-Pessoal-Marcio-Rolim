'use client'

import type { JSONContent } from '@tiptap/react'
import Link from 'next/link'
import { useActionState, useCallback, useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { criarPost, salvarPost, type EstadoPost } from '@/actions/posts'
import { ArrowLeftIcon } from '@/components/icons'
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

/**
 * DTO do post para o formulário.
 *
 * Montado na página (Server Component) a partir da linha do banco. A linha crua
 * NÃO cruza a fronteira: ela carrega `author_id`, `content_html`, `content_text`
 * e `search_tsv`, que o navegador não precisa — e `content_html` mandado para o
 * cliente e devolvido no save seria exatamente o caminho de XSS que a derivação
 * no servidor existe para fechar.
 */
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
  /** ISO em UTC, como veio do banco. */
  publicadoEm: string | null
  seoTitulo: string
  seoDescricao: string
  noindex: boolean
}

type Props = {
  post: PostDTO | null
}

// ─── Peças de formulário ─────────────────────────────────────────────────────
const CLASSE_CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-amber-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

const CLASSE_CAMPO_ERRO = 'border-rose-500 dark:border-rose-500'

function Rotulo({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {children}
    </label>
  )
}

function ErroCampo({ mensagem, id }: { mensagem?: string; id: string }) {
  if (!mensagem) return null

  return (
    <p id={id} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
      {mensagem}
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
      className={`text-xs tabular-nums ${
        estourou ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-400'
      }`}
    >
      {atual}/{limite}
    </span>
  )
}

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-bold tracking-wide text-slate-900 uppercase dark:text-white">
        {titulo}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

// ─── Formulário ──────────────────────────────────────────────────────────────
export function PostForm({ post }: Props) {
  const modoNovo = post === null

  // A action muda com o modo, mas o modo não muda durante a vida do componente:
  // cada página monta um PostForm próprio.
  const [estado, executar, pendente] = useActionState<EstadoPost, FormData>(
    modoNovo ? criarPost : salvarPost,
    {},
  )

  const idBase = useId()
  const campoId = (nome: string) => `${idBase}-${nome}`
  const erroId = (nome: string) => `${idBase}-${nome}-erro`
  const erros = estado.erros ?? {}

  const refFormulario = useRef<HTMLFormElement>(null)
  const refConteudo = useRef<HTMLInputElement>(null)

  const [titulo, setTitulo] = useState(post?.titulo ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  // Post existente já tem slug publicado; trocá-lo sozinho quebraria a URL.
  const [slugManual, setSlugManual] = useState(!modoNovo)
  const [resumo, setResumo] = useState(post?.resumo ?? '')
  const [seoDescricao, setSeoDescricao] = useState(post?.seoDescricao ?? '')
  const [status, setStatus] = useState<StatusPost>(post?.status ?? 'draft')
  const [capaUrl, setCapaUrl] = useState(post?.capaUrl ?? '')
  const [sujo, setSujo] = useState(false)
  const [salveObservado, setSalveObservado] = useState(estado.salvoEm)

  /**
   * Save concluído → o formulário volta a ser "limpo".
   *
   * Ajuste durante o render, e não num `useEffect`. É o padrão que o React
   * documenta para reagir a um valor que veio de fora ("You Might Not Need an
   * Effect"): o React reexecuta este componente antes de pintar, então a tela
   * nunca chega a mostrar "alterações não salvas" logo depois de salvar. Com um
   * efeito, esse frame errado aparece.
   */
  if (estado.salvoEm !== salveObservado) {
    setSalveObservado(estado.salvoEm)
    setSujo(false)
  }

  // O `<input type="datetime-local">` fala hora de parede. A conversão usa fuso
  // fixo (ver lib/blog/constantes) para o SSR e o browser produzirem a mesma
  // string — com `getHours()` local, o servidor em UTC renderizaria outra coisa
  // e o React acusaria mismatch de hidratação neste input.
  const [dataPublicacao, setDataPublicacao] = useState(() => isoParaCampoData(post?.publicadoEm))

  const slugValido = slug === '' || REGEX_SLUG.test(slug)

  /**
   * O documento do Tiptap vai para um input escondido em vez de para o state.
   *
   * Guardar o JSON em `useState` re-renderizaria o formulário inteiro (editor
   * incluso) a cada tecla digitada. Escrevendo direto no DOM, o React não
   * re-renderiza nada e o FormData continua levando o valor mais recente.
   */
  const aoAtualizarConteudo = useCallback((documento: JSONContent) => {
    if (refConteudo.current) refConteudo.current.value = JSON.stringify(documento)
    // React descarta o set quando o valor já é o mesmo, então repetir é barato.
    setSujo(true)
  }, [])

  /**
   * Avisa antes de fechar a aba com trabalho não salvo. Um post é meia hora de
   * escrita; perder por um Cmd+W é caro demais para não custar um diálogo.
   */
  useEffect(() => {
    if (!sujo) return

    const aoSair = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', aoSair)
    return () => window.removeEventListener('beforeunload', aoSair)
  }, [sujo])

  /**
   * "Publicar agora": muda o status e SÓ ENTÃO envia.
   *
   * `flushSync` é o ponto todo. Sem ele, `requestSubmit()` roda antes de o React
   * aplicar o novo valor ao `<select>` do DOM, e o FormData sai com o status
   * ANTIGO — o botão "Publicar agora" salvaria como rascunho. É exatamente o
   * caso de uso do flushSync: agir sobre o DOM logo após atualizar o estado.
   */
  function publicarAgora() {
    flushSync(() => setStatus('published'))
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
    // Normalização leve: hífen no fim é apagado só na hora de salvar, senão o
    // usuário não consegue digitar "meu-" para chegar em "meu-post".
    setSlug(valor.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))
  }

  return (
    <form ref={refFormulario} action={executar} className="flex flex-col gap-6">
      {!modoNovo && <input type="hidden" name="id" value={post.id} />}

      {/* content_json inteiro. content_html e content_text NÃO são enviados:
          quem os produz é lib/blog/derivar, no servidor, a partir daqui. */}
      <input
        ref={refConteudo}
        type="hidden"
        name="conteudo"
        defaultValue={JSON.stringify(post?.conteudo ?? DOC_VAZIO)}
      />

      {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-amber-500 dark:text-slate-400"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Posts
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {modoNovo ? 'Novo post' : 'Editar post'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sujo && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Alterações não salvas
            </span>
          )}

          {status !== 'published' && (
            <button
              type="button"
              onClick={publicarAgora}
              disabled={pendente}
              className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
            >
              Publicar agora
            </button>
          )}

          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendente ? 'Salvando…' : modoNovo ? 'Criar post' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* ── Feedback ─────────────────────────────────────────────────────── */}
      {estado.erro && (
        <p
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
        >
          {estado.erro}
        </p>
      )}

      {estado.ok && estado.mensagem && (
        <p
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {estado.mensagem}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ── Coluna principal ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Rotulo htmlFor={campoId('titulo')}>Título</Rotulo>
              <Contador atual={titulo.length} limite={LIMITES.tituloMax} />
            </div>
            <input
              id={campoId('titulo')}
              name="titulo"
              value={titulo}
              onChange={(e) => aoMudarTitulo(e.target.value)}
              required
              maxLength={LIMITES.tituloMax}
              aria-invalid={Boolean(erros.titulo)}
              aria-describedby={erros.titulo ? erroId('titulo') : undefined}
              className={`${CLASSE_CAMPO} text-lg font-semibold ${erros.titulo ? CLASSE_CAMPO_ERRO : ''}`}
            />
            <ErroCampo mensagem={erros.titulo} id={erroId('titulo')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Rotulo htmlFor={campoId('slug')}>Slug</Rotulo>
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
                className={`${CLASSE_CAMPO} font-mono text-sm ${
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
                className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Gerar do título
              </button>
            </div>
            <Dica>
              marciorolim.com.br/blog/<span className="font-mono">{slug || 'seu-slug'}</span>
              {!modoNovo && ' — mudar o slug quebra os links já compartilhados.'}
            </Dica>
            {!slugValido && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                Só minúsculas, números e um hífen entre palavras.
              </p>
            )}
            <ErroCampo mensagem={erros.slug} id={erroId('slug')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Rotulo htmlFor={campoId('resumo')}>Resumo</Rotulo>
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
              maxLength={LIMITES.resumoMax}
              aria-invalid={Boolean(erros.resumo)}
              aria-describedby={erros.resumo ? erroId('resumo') : undefined}
              className={`${CLASSE_CAMPO} resize-y ${erros.resumo ? CLASSE_CAMPO_ERRO : ''}`}
            />
            <Dica>Aparece na listagem do blog e nos cartões de compartilhamento.</Dica>
            <ErroCampo mensagem={erros.resumo} id={erroId('resumo')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Conteúdo</span>
            <EditorConteudo
              conteudoInicial={post?.conteudo ?? null}
              aoAtualizar={aoAtualizarConteudo}
            />
            <ErroCampo mensagem={erros.conteudo} id={erroId('conteudo')} />
          </div>
        </div>

        {/* ── Barra lateral ──────────────────────────────────────────────── */}
        <aside className="flex flex-col gap-4">
          <Cartao titulo="Publicação">
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
              <Rotulo htmlFor={campoId('publicado_em')}>Data de publicação</Rotulo>
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
                className={`${CLASSE_CAMPO} ${erros.publicado_em ? CLASSE_CAMPO_ERRO : ''}`}
              />
              <Dica>Horário de Brasília. Em branco, publicar usa o momento do save.</Dica>
              {status === 'scheduled' && (
                <Dica>
                  Atenção: o status <strong>Agendado</strong> guarda a data, mas quem vira a chave
                  para <strong>Publicado</strong> é uma rotina agendada — ela ainda não existe.
                  Enquanto isso, publique manualmente na hora.
                </Dica>
              )}
              <ErroCampo mensagem={erros.publicado_em} id={erroId('publicado_em')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Rotulo htmlFor={campoId('categoria')}>Categoria</Rotulo>
              <select
                id={campoId('categoria')}
                name="categoria"
                defaultValue={post?.categoria ?? 'tecnologia'}
                onChange={() => setSujo(true)}
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
                defaultValue={post?.tags.join(', ') ?? ''}
                onChange={() => setSujo(true)}
                placeholder="ia, automação, n8n"
                className={CLASSE_CAMPO}
              />
              <Dica>Separadas por vírgula. Até 12, sempre em minúsculas.</Dica>
            </div>
          </Cartao>

          <Cartao titulo="Capa">
            <div className="flex flex-col gap-1.5">
              <Rotulo htmlFor={campoId('capa_url')}>URL da imagem</Rotulo>
              {/* UPLOAD ENTRA AQUI (próxima rodada):
                  um <input type="file"> que pede a signed upload URL a uma Route
                  Handler protegida por requireAdmin(), envia direto ao bucket
                  `blog` do Storage e preenche este campo com a URL pública.
                  Fica como URL por ora para não bloquear a escrita de posts. */}
              <input
                id={campoId('capa_url')}
                name="capa_url"
                type="url"
                value={capaUrl}
                onChange={(e) => {
                  setCapaUrl(e.target.value)
                  setSujo(true)
                }}
                placeholder="https://…/capa.webp"
                aria-invalid={Boolean(erros.capa_url)}
                aria-describedby={erros.capa_url ? erroId('capa_url') : undefined}
                className={`${CLASSE_CAMPO} text-sm ${erros.capa_url ? CLASSE_CAMPO_ERRO : ''}`}
              />
              <Dica>
                Para a página pública usar <span className="font-mono">next/image</span>, o host
                precisa estar em <span className="font-mono">remotePatterns</span> do
                next.config.ts.
              </Dica>
              <ErroCampo mensagem={erros.capa_url} id={erroId('capa_url')} />
            </div>

            {capaUrl && (
              // Prévia só do painel. `next/image` LANÇA em runtime para host que
              // não esteja em `remotePatterns` do next.config.ts, e aqui a URL é
              // digitada à mão — otimizar a capa é papel da página pública.
              // A diretiva precisa ser a última linha antes do elemento.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capaUrl}
                alt=""
                className="max-h-40 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
              />
            )}

            <div className="flex flex-col gap-1.5">
              <Rotulo htmlFor={campoId('capa_alt')}>Texto alternativo</Rotulo>
              <input
                id={campoId('capa_alt')}
                name="capa_alt"
                defaultValue={post?.capaAlt ?? ''}
                onChange={() => setSujo(true)}
                required={Boolean(capaUrl)}
                aria-invalid={Boolean(erros.capa_alt)}
                aria-describedby={erros.capa_alt ? erroId('capa_alt') : undefined}
                className={`${CLASSE_CAMPO} text-sm ${erros.capa_alt ? CLASSE_CAMPO_ERRO : ''}`}
              />
              <Dica>Obrigatório quando há capa. Descreva o que a imagem mostra.</Dica>
              <ErroCampo mensagem={erros.capa_alt} id={erroId('capa_alt')} />
            </div>
          </Cartao>

          <Cartao titulo="SEO">
            <div className="flex flex-col gap-1.5">
              <Rotulo htmlFor={campoId('seo_titulo')}>Título de SEO</Rotulo>
              <input
                id={campoId('seo_titulo')}
                name="seo_titulo"
                defaultValue={post?.seoTitulo ?? ''}
                onChange={() => setSujo(true)}
                maxLength={200}
                aria-invalid={Boolean(erros.seo_titulo)}
                aria-describedby={erros.seo_titulo ? erroId('seo_titulo') : undefined}
                className={`${CLASSE_CAMPO} text-sm ${erros.seo_titulo ? CLASSE_CAMPO_ERRO : ''}`}
              />
              <Dica>Em branco, usa o título do post.</Dica>
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
                className={`${CLASSE_CAMPO} resize-y text-sm ${
                  erros.seo_descricao ? CLASSE_CAMPO_ERRO : ''
                }`}
              />
              <ErroCampo mensagem={erros.seo_descricao} id={erroId('seo_descricao')} />
            </div>

            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                name="noindex"
                defaultChecked={post?.noindex ?? false}
                onChange={() => setSujo(true)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-amber-500 dark:border-slate-600"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  noindex
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Pede aos buscadores para não indexar este post.
                </span>
              </span>
            </label>
          </Cartao>
        </aside>
      </div>
    </form>
  )
}
