'use client'

import { useEditorState, type Editor } from '@tiptap/react'
import { useState } from 'react'

/**
 * Barra de ferramentas do editor.
 *
 * O estado ativo vem de `useEditorState`, não de `editor.isActive()` chamado
 * direto no render. No Tiptap 3 o `useEditor` NÃO re-renderiza a cada transação
 * (`shouldRerenderOnTransaction` passou a ser `false` por padrão), então ler
 * `isActive` no corpo do componente devolve o valor da última renderização e a
 * barra congela: o cursor entra num trecho em negrito e o botão continua
 * apagado. `useEditorState` assina as transações e só re-renderiza quando algum
 * dos booleanos abaixo muda de fato.
 */

type Props = {
  editor: Editor
}

// ─── Ícones ──────────────────────────────────────────────────────────────────
// Locais de propósito: são só do editor e não entram no `components/icons.tsx`
// compartilhado, que é consumido pelo site público.
type PropsIcone = { className?: string }

const TRACO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function IconeListaMarcadores({ className }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...TRACO}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconeListaNumerada({ className }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...TRACO}>
      <path d="M9 6h12M9 12h12M9 18h12M3 5h1.5v4M3 9h3" />
      <path d="M3 15h2.5a.9.9 0 0 1 .3 1.7L3 19h3" />
    </svg>
  )
}

function IconeCitacao({ className }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...TRACO}>
      <path d="M4 5v14" />
      <path d="M9 8.5c-1.7 0-2.8 1.2-2.8 2.7S7.3 14 8.7 14c.3 2-1 3-2.3 3.4" transform="translate(3 -1)" />
      <path d="M9 8.5c-1.7 0-2.8 1.2-2.8 2.7S7.3 14 8.7 14c.3 2-1 3-2.3 3.4" transform="translate(9.5 -1)" />
    </svg>
  )
}

function IconeCodigo({ className }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...TRACO}>
      <path d="m9 17-5-5 5-5M15 7l5 5-5 5" />
    </svg>
  )
}

function IconeLink({ className }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...TRACO}>
      <path d="M10 13.5a4 4 0 0 0 5.7.4l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
      <path d="M14 10.5a4 4 0 0 0-5.7-.4l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </svg>
  )
}

function IconeImagem({ className }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...TRACO}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L16 17M15 14l1.5-1.5a2 2 0 0 1 2.8 0L21 14" />
    </svg>
  )
}

// ─── Peças ───────────────────────────────────────────────────────────────────
const CLASSE_BOTAO =
  'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

function Botao({
  ativo = false,
  rotulo,
  aoClicar,
  desabilitado = false,
  children,
}: {
  ativo?: boolean
  rotulo: string
  aoClicar: () => void
  desabilitado?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      // `type="button"` é obrigatório: o padrão de um <button> dentro de <form>
      // é "submit", e cada clique em "negrito" salvaria o post.
      type="button"
      onClick={aoClicar}
      disabled={desabilitado}
      title={rotulo}
      aria-label={rotulo}
      aria-pressed={ativo}
      className={`${CLASSE_BOTAO} ${
        ativo
          ? 'bg-amber-500 text-slate-900'
          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function Separador() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px self-center bg-slate-300 dark:bg-slate-700" />
}

const CLASSE_CAMPO_PAINEL =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

// ─── Barra ───────────────────────────────────────────────────────────────────
type Painel = 'nenhum' | 'link' | 'imagem'

export function BarraFerramentas({ editor }: Props) {
  const [painel, setPainel] = useState<Painel>('nenhum')
  const [urlLink, setUrlLink] = useState('')
  const [urlImagem, setUrlImagem] = useState('')
  const [altImagem, setAltImagem] = useState('')
  const [erroPainel, setErroPainel] = useState('')

  const estado = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      negrito: ed.isActive('bold'),
      italico: ed.isActive('italic'),
      h2: ed.isActive('heading', { level: 2 }),
      h3: ed.isActive('heading', { level: 3 }),
      listaMarcadores: ed.isActive('bulletList'),
      listaNumerada: ed.isActive('orderedList'),
      citacao: ed.isActive('blockquote'),
      codigo: ed.isActive('code'),
      blocoCodigo: ed.isActive('codeBlock'),
      link: ed.isActive('link'),
      hrefAtual: (ed.getAttributes('link').href as string | undefined) ?? '',
    }),
  })

  function fecharPainel() {
    setPainel('nenhum')
    setErroPainel('')
    editor.chain().focus().run()
  }

  function abrirPainelLink() {
    if (painel === 'link') return fecharPainel()
    setUrlLink(estado.hrefAtual)
    setErroPainel('')
    setPainel('link')
  }

  function abrirPainelImagem() {
    if (painel === 'imagem') return fecharPainel()
    setUrlImagem('')
    setAltImagem('')
    setErroPainel('')
    setPainel('imagem')
  }

  /**
   * Só http, https e mailto. É a mesma regra que `lib/blog/derivar` aplica na
   * gravação — aqui ela existe para o usuário descobrir o problema agora, e não
   * ao ver o link sumir do post publicado.
   */
  function normalizarUrl(bruto: string): string | null {
    const valor = bruto.trim()
    if (!valor) return null

    // Digitar "marciorolim.com.br" é o caso comum; sem esquema o navegador
    // trataria como caminho relativo.
    const comEsquema = /^[a-z][a-z0-9+.-]*:/i.test(valor) || valor.startsWith('/')
      ? valor
      : `https://${valor}`

    if (comEsquema.startsWith('/')) return comEsquema

    try {
      const url = new URL(comEsquema)
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : null
    } catch {
      return null
    }
  }

  function aplicarLink() {
    const href = normalizarUrl(urlLink)
    if (!href) {
      setErroPainel('Endereço inválido. Use http, https ou mailto.')
      return
    }

    // `extendMarkRange` faz o comando valer para o link inteiro, e não só para o
    // pedaço selecionado — sem ele, editar a URL parte o link em dois.
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    fecharPainel()
  }

  function removerLink() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    fecharPainel()
  }

  function inserirImagem() {
    const src = normalizarUrl(urlImagem)
    if (!src) {
      setErroPainel('Endereço da imagem inválido.')
      return
    }

    // Alternativo obrigatório: imagem sem descrição é conteúdo que não existe
    // para quem usa leitor de tela, e o post fica ilegível quando ela não carrega.
    if (!altImagem.trim()) {
      setErroPainel('Descreva a imagem no texto alternativo.')
      return
    }

    editor.chain().focus().setImage({ src, alt: altImagem.trim() }).run()
    fecharPainel()
  }

  /**
   * Enter dentro do painel aplica, em vez de enviar o formulário do post.
   * Os inputs do painel vivem DENTRO do <form> da página (form aninhado é HTML
   * inválido), então sem isto o Enter salvaria o post pela metade.
   */
  function teclaDoPainel(evento: React.KeyboardEvent, aoConfirmar: () => void) {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      aoConfirmar()
      return
    }
    if (evento.key === 'Escape') {
      evento.preventDefault()
      fecharPainel()
    }
  }

  return (
    <div className="border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-0.5 p-2">
        <Botao
          rotulo="Negrito"
          ativo={estado.negrito}
          aoClicar={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-black">B</span>
        </Botao>

        <Botao
          rotulo="Itálico"
          ativo={estado.italico}
          aoClicar={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="font-serif italic">I</span>
        </Botao>

        <Separador />

        <Botao
          rotulo="Título nível 2"
          ativo={estado.h2}
          aoClicar={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Botao>

        <Botao
          rotulo="Título nível 3"
          ativo={estado.h3}
          aoClicar={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Botao>

        <Separador />

        <Botao
          rotulo="Lista com marcadores"
          ativo={estado.listaMarcadores}
          aoClicar={() => editor.chain().focus().toggleBulletList().run()}
        >
          <IconeListaMarcadores className="h-4 w-4" />
        </Botao>

        <Botao
          rotulo="Lista numerada"
          ativo={estado.listaNumerada}
          aoClicar={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <IconeListaNumerada className="h-4 w-4" />
        </Botao>

        <Botao
          rotulo="Citação"
          ativo={estado.citacao}
          aoClicar={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <IconeCitacao className="h-4 w-4" />
        </Botao>

        <Separador />

        <Botao
          rotulo="Código na linha"
          ativo={estado.codigo}
          aoClicar={() => editor.chain().focus().toggleCode().run()}
        >
          <IconeCodigo className="h-4 w-4" />
        </Botao>

        <Botao
          rotulo="Bloco de código"
          ativo={estado.blocoCodigo}
          aoClicar={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <span className="text-xs tracking-tight">{'{ }'}</span>
        </Botao>

        <Separador />

        <Botao rotulo="Link" ativo={estado.link || painel === 'link'} aoClicar={abrirPainelLink}>
          <IconeLink className="h-4 w-4" />
        </Botao>

        <Botao rotulo="Imagem" ativo={painel === 'imagem'} aoClicar={abrirPainelImagem}>
          <IconeImagem className="h-4 w-4" />
        </Botao>
      </div>

      {painel === 'link' && (
        <div className="flex flex-col gap-2 border-t border-slate-200 px-2 pb-3 pt-2 dark:border-slate-700">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Endereço do link
            </span>
            {/* Sem `name`: campo auxiliar não pode entrar no FormData do post. */}
            <input
              type="text"
              value={urlLink}
              onChange={(e) => setUrlLink(e.target.value)}
              onKeyDown={(e) => teclaDoPainel(e, aplicarLink)}
              placeholder="https://exemplo.com.br/pagina"
              autoFocus
              className={CLASSE_CAMPO_PAINEL}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={aplicarLink}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400"
            >
              Aplicar
            </button>
            {estado.link && (
              <button
                type="button"
                onClick={removerLink}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Remover link
              </button>
            )}
            <button
              type="button"
              onClick={fecharPainel}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Cancelar
            </button>
          </div>

          {erroPainel && (
            <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {erroPainel}
            </p>
          )}
        </div>
      )}

      {painel === 'imagem' && (
        <div className="flex flex-col gap-2 border-t border-slate-200 px-2 pb-3 pt-2 dark:border-slate-700">
          {/* UPLOAD ENTRA AQUI (próxima rodada):
              trocar este campo por um <input type="file"> que
                1. pede uma signed upload URL a uma Route Handler com requireAdmin();
                2. faz o PUT direto no bucket, sem o arquivo passar pelo servidor Next;
                3. devolve a URL pública e a joga em `urlImagem`.
              O restante desta função continua igual — `setImage` só quer uma URL. */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              URL da imagem
            </span>
            <input
              type="text"
              value={urlImagem}
              onChange={(e) => setUrlImagem(e.target.value)}
              onKeyDown={(e) => teclaDoPainel(e, inserirImagem)}
              placeholder="https://…/imagem.webp"
              autoFocus
              className={CLASSE_CAMPO_PAINEL}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Texto alternativo (obrigatório)
            </span>
            <input
              type="text"
              value={altImagem}
              onChange={(e) => setAltImagem(e.target.value)}
              onKeyDown={(e) => teclaDoPainel(e, inserirImagem)}
              placeholder="O que a imagem mostra"
              className={CLASSE_CAMPO_PAINEL}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={inserirImagem}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400"
            >
              Inserir
            </button>
            <button
              type="button"
              onClick={fecharPainel}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Cancelar
            </button>
          </div>

          {erroPainel && (
            <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {erroPainel}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
