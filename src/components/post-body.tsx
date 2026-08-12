import {
  renderJSONContentToReactElement,
  type JSONMarkType,
  type JSONNodeType,
  type MarkProps,
  type NodeProps,
} from '@tiptap/static-renderer/json/react'
import type { ReactNode } from 'react'

import type { NoTiptap } from '@/lib/blog/queries'

/**
 * Renderização do corpo do post.
 *
 * `content_json` é um documento ProseMirror. Aqui ele vira árvore de elementos
 * React DENTRO do Server Component, com `@tiptap/static-renderer/json/react`.
 * Duas consequências, e as duas são o motivo de fazer assim:
 *
 *  1. Nada do editor vai para o browser. O renderer só depende de React — o
 *     `json/react` importa `@tiptap/core` apenas como TIPO. Nem StarterKit, nem
 *     ProseMirror, nem view: o bundle das páginas públicas fica sem uma linha
 *     do Tiptap.
 *
 *  2. Nada de `dangerouslySetInnerHTML`. O que existe é um mapa fechado de
 *     `tipo de nó -> componente`. Um `<script>` colado no editor não sobrevive
 *     ao parse do ProseMirror (não há nó para ele no schema) e, mesmo que
 *     chegasse aqui um tipo desconhecido, cairia em `unhandledNode`, que
 *     devolve os filhos como texto. Não existe caminho de string para HTML.
 *
 * Estilos escritos à mão com Tailwind. O plugin @tailwindcss/typography não
 * está instalado e não deve ser: `prose` traz sua própria escala tipográfica e
 * suas próprias cores, que brigam com os tokens do site.
 */

// ─── Leitores de atributo ────────────────────────────────────────────────────
// `attrs` é `Record<string, any>` no tipo do pacote. Estes dois helpers são o
// pedágio para entrar no código com tipo de verdade.

function textoAttr(node: JSONNodeType | JSONMarkType, nome: string): string | null {
  const valor = (node.attrs as Record<string, unknown> | undefined)?.[nome]
  return typeof valor === 'string' && valor.length > 0 ? valor : null
}

function numeroAttr(node: JSONNodeType, nome: string): number | null {
  const valor = (node.attrs as Record<string, unknown> | undefined)?.[nome]
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null
}

/**
 * Só deixa passar link que o navegador pode abrir sem executar nada.
 *
 * O schema do ProseMirror garante a FORMA do documento, não o CONTEÚDO dos
 * atributos: `href` é texto livre, e `javascript:` num href é execução de
 * script no clique. Allowlist de protocolo, e ponto.
 */
const PROTOCOLOS_PERMITIDOS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'data:'])

function hrefSeguro(valor: string | null): string | null {
  if (!valor) return null

  // Relativo ou data-URI (mesmo site/imagem base64): seguro para exibição
  if (valor.startsWith('/') || valor.startsWith('#') || valor.startsWith('data:image/')) return valor

  try {
    const url = new URL(valor)
    return PROTOCOLOS_PERMITIDOS.has(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

// ─── Escala de leitura ───────────────────────────────────────────────────────

const TEXTO = 'text-[1.0625rem] leading-[1.8] text-slate-700 dark:text-slate-300'
const TITULO = 'font-bold tracking-tight text-slate-900 dark:text-white'

type PropsNo = NodeProps<JSONNodeType, ReactNode | ReactNode[]>
type PropsMarca = MarkProps<JSONMarkType, ReactNode | ReactNode[], JSONNodeType>

function tipoDoPai(parent: JSONNodeType | undefined): string {
  return typeof parent?.type === 'string' ? parent.type : ''
}

const REGEX_REFERENCIA_BIBLICA =
  /\b((?:[123]\s*)?(?:Gênesis|Êxodo|Levítico|Números|Deuteronômio|Josué|Juízes|Rute|Samuel|Reis|Crônicas|Esdras|Neemias|Ester|Jó|Salmos?|Provérbios|Eclesiastes|Cânticos|Isaías|Jeremias|Lamentações|Ezequiel|Daniel|Oséias|Joel|Amós|Obadias|Jonas|Miquéias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|João|Atos|Romanos|Coríntios|Gálatas|Efésios|Filipenses|Colossenses|Tessalonicenses|Timóteo|Tito|Filemom|Hebreus|Tiago|Pedro|Judas|Apocalipse|Gn|Êx|Lv|Nm|Dt|Js|Jz|Rt|1Sm|2Sm|1Rs|2Rs|1Cr|2Cr|Ed|Ne|Et|Sl|Pv|Ec|Ct|Is|Jr|Lm|Ez|Dn|Os|Jl|Am|Ob|Jn|Mq|Na|Hc|Sf|Ag|Zc|Ml|Mt|Mc|Lc|Jo|At|Rm|1Co|2Co|Gl|Ef|Fp|Col|1Ts|2Ts|1Tm|2Tm|Tt|Fm|Hb|Tg|1Pe|2Pe|1Jo|2Jo|3Jo|Jd|Ap)\s+\d+(?::\d+(?:-\d+)?)?)\b/gi

const NOS: Record<string, (props: PropsNo) => ReactNode> = {
  doc: ({ children }) => <>{children}</>,

  paragraph: ({ children, parent }) => {
    // Dentro de item de lista ou de citação o parágrafo é só o texto: as
    // margens quem dá é o contêiner, senão sobra respiro dobrado.
    const aninhado = tipoDoPai(parent) === 'listItem' || tipoDoPai(parent) === 'blockquote'
    return <p className={aninhado ? 'leading-[1.8]' : TEXTO}>{children}</p>
  },

  text: ({ node }) => {
    const texto = node.text ?? ''
    if (!texto) return null

    const partes = texto.split(REGEX_REFERENCIA_BIBLICA)
    if (partes.length <= 1) return <>{texto}</>

    return (
      <>
        {partes.map((parte, i) =>
          i % 2 === 1 ? (
            <strong
              key={i}
              className="font-bold text-slate-900 underline decoration-amber-500/40 decoration-2 underline-offset-2 dark:text-white"
            >
              {parte}
            </strong>
          ) : (
            parte
          )
        )}
      </>
    )
  },


  heading: ({ children, node }) => {
    const nivel = numeroAttr(node, 'level') ?? 2
    // h1 é do título do post. Um h1 vindo do editor desce para h2 — dois h1 na
    // mesma página desmontam o esboço do documento para leitor de tela e busca.
    switch (nivel) {
      case 1:
      case 2:
        return <h2 className={`mt-6 text-2xl sm:text-3xl ${TITULO}`}>{children}</h2>
      case 3:
        return <h3 className={`mt-4 text-xl sm:text-2xl ${TITULO}`}>{children}</h3>
      case 4:
        return <h4 className={`mt-2 text-lg ${TITULO}`}>{children}</h4>
      case 5:
        return <h5 className={`mt-2 text-base ${TITULO}`}>{children}</h5>
      default:
        return (
          <h6 className={`mt-2 text-sm tracking-wide uppercase ${TITULO}`}>{children}</h6>
        )
    }
  },

  bulletList: ({ children }) => (
    <ul className="list-disc pl-6 marker:text-amber-500">{children}</ul>
  ),

  orderedList: ({ children, node }) => (
    <ol
      start={numeroAttr(node, 'start') ?? undefined}
      className="list-decimal pl-6 marker:font-semibold marker:text-amber-500"
    >
      {children}
    </ol>
  ),

  listItem: ({ children }) => (
    <li className="my-2 pl-1 text-[1.0625rem] text-slate-700 dark:text-slate-300">
      {children}
    </li>
  ),

  blockquote: ({ children }) => (
    <blockquote className="flex flex-col gap-3 rounded-r-2xl border-l-4 border-amber-500/70 bg-amber-50/60 px-5 py-4 text-[1.0625rem] text-slate-700 italic dark:bg-amber-500/5 dark:text-slate-300">
      {children}
    </blockquote>
  ),

  codeBlock: ({ children, node }) => {
    const linguagem = textoAttr(node, 'language')
    return (
      <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm leading-relaxed text-slate-100 dark:border-slate-700/60 dark:bg-slate-900/80">
        <code className={linguagem ? `language-${linguagem}` : undefined}>{children}</code>
      </pre>
    )
  },

  horizontalRule: () => (
    <hr className="my-4 h-px border-0 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
  ),

  hardBreak: () => <br />,

  image: ({ node }) => {
    const src = hrefSeguro(textoAttr(node, 'src'))
    if (!src) return null

    const legenda = textoAttr(node, 'title')

    return (
      <figure className="my-2 flex flex-col gap-2">
        {/* <img> e não next/image de propósito: a imagem do corpo vem do editor,
            com host e dimensões desconhecidos. next/image exige o host em
            `images.remotePatterns` e derruba a página inteira (erro em tempo de
            render) quando o host não está lá — um post com imagem colada de
            fora viraria 500. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={textoAttr(node, 'alt') ?? ''}
          loading="lazy"
          decoding="async"
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800"
        />
        {legenda && (
          <figcaption className="text-center text-sm text-slate-500 dark:text-slate-400">
            {legenda}
          </figcaption>
        )}
      </figure>
    )
  },
}

const MARCAS: Record<string, (props: PropsMarca) => ReactNode> = {
  bold: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
  ),

  italic: ({ children }) => <em>{children}</em>,

  strike: ({ children }) => <s className="text-slate-500 dark:text-slate-400">{children}</s>,

  underline: ({ children }) => (
    <u className="underline decoration-amber-500/50 underline-offset-4">{children}</u>
  ),

  code: ({ children }) => (
    <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-amber-700 dark:bg-slate-800 dark:text-amber-300">
      {children}
    </code>
  ),

  link: ({ children, mark }) => {
    const href = hrefSeguro(textoAttr(mark, 'href'))

    // Link com destino recusado vira texto. Sumir com o texto seria pior:
    // o leitor perderia conteúdo sem entender por quê.
    if (!href) return <>{children}</>

    const externo = /^https?:/.test(href) && !href.includes('marciorolim.com.br')

    return (
      <a
        href={href}
        {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="font-medium text-amber-700 underline decoration-amber-500/40 underline-offset-4 transition-colors hover:decoration-amber-500 dark:text-amber-400"
      >
        {children}
      </a>
    )
  },
}

/**
 * Válvula de escape. Sem ela o renderer LANÇA ao topar com um tipo fora do
 * mapa — e um dia alguém liga uma extensão nova no editor. Devolver os filhos
 * preserva o texto e mantém a página de pé.
 */
const noDesconhecido = ({ children }: PropsNo): ReactNode => <>{children}</>
const marcaDesconhecida = ({ children }: PropsMarca): ReactNode => <>{children}</>

const renderizar = renderJSONContentToReactElement({
  nodeMapping: NOS,
  markMapping: MARCAS,
  unhandledNode: noDesconhecido,
  unhandledMark: marcaDesconhecida,
})

function documentoVazio(conteudo: NoTiptap): boolean {
  return !conteudo.content || conteudo.content.length === 0
}

export function PostBody({ conteudo }: { conteudo: NoTiptap }) {
  if (documentoVazio(conteudo)) {
    return (
      <p className="text-[1.0625rem] text-slate-500 italic dark:text-slate-400">
        Este post ainda não tem conteúdo publicado.
      </p>
    )
  }

  // `gap` no contêiner em vez de `space-y-*`: no Tailwind 4 `space-y-*` compila
  // para `margin-block-end`, e as margens próprias dos títulos passariam a
  // somar do lado errado.
  return <div className="flex flex-col gap-6">{renderizar({ content: conteudo })}</div>
}
