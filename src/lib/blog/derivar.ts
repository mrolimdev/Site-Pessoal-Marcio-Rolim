import 'server-only'

import sanitizeHtml from 'sanitize-html'

import { SITE } from '@/content/site'

/**
 * Derivação de `content_html`, `content_text` e `reading_minutes` a partir do
 * `content_json` do Tiptap.
 *
 * REGRA CENTRAL: o browser manda `content_json` e SÓ isso. HTML nunca chega do
 * cliente. Aceitar HTML pronto de um formulário é XSS armazenado servido depois
 * para todo visitante do blog — o admin autenticado não é o modelo de ameaça
 * aqui, o navegador dele é (extensão comprometida, cópia e cola de outro site).
 *
 * São duas camadas independentes, de propósito:
 *
 *   1. O serializador abaixo só sabe emitir uma lista fechada de nós e marcas.
 *      Um nó desconhecido no JSON não vira tag nenhuma — no máximo o texto dele
 *      sobrevive. Nenhum atributo do JSON é copiado para a saída sem passar por
 *      uma função que o valida.
 *   2. `sanitize-html` reparseia o resultado e reaplica o allowlist.
 *
 * A camada 2 sozinha já seria o padrão da indústria. A camada 1 existe porque
 * ela transforma um bug de configuração da camada 2 em um não-evento, e vice-
 * versa. `import 'server-only'` no topo faz o build falhar se um Client
 * Component importar este arquivo.
 */

// ─── Formato de entrada ──────────────────────────────────────────────────────
/**
 * O nó do Tiptap como ele chega: JSON não confiável, vindo de `JSON.parse`.
 * Tudo é `unknown` porque nada aqui foi verificado ainda — tipar como
 * `JSONContent` do Tiptap seria mentir para o compilador sobre um payload de
 * rede.
 */
type NoBruto = {
  readonly type?: unknown
  readonly attrs?: unknown
  readonly content?: unknown
  readonly marks?: unknown
  readonly text?: unknown
}

export type ConteudoDerivado = {
  /** HTML sanitizado, pronto para `dangerouslySetInnerHTML` na página pública. */
  readonly html: string
  /** Texto puro. Alimenta `search_tsv` (peso C) e o cálculo de leitura. */
  readonly texto: string
  /** Minutos de leitura, no mínimo 1. */
  readonly minutos: number
  /** Quantidade de palavras — usada pela UI para avisar que o post está vazio. */
  readonly palavras: number
}

export class ConteudoInvalido extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ConteudoInvalido'
  }
}

// ─── Vocabulário permitido ───────────────────────────────────────────────────
const ESQUEMAS_PERMITIDOS = new Set(['http:', 'https:', 'mailto:'])

// Velocidade média de leitura em português. Redondo de propósito: o número na
// tela é uma estimativa, e fingir precisão com 238,4 ppm não ajuda ninguém.
const PALAVRAS_POR_MINUTO = 200

/** Nós que fecham um bloco no texto puro (viram quebra de linha). */
const NOS_DE_BLOCO = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'listItem',
  'horizontalRule',
])

// ─── Guardas ─────────────────────────────────────────────────────────────────
function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function tipoDe(no: NoBruto): string {
  return typeof no.type === 'string' ? no.type : ''
}

function filhosDe(no: NoBruto): NoBruto[] {
  return Array.isArray(no.content) ? no.content.filter(ehObjeto) : []
}

function atributosDe(no: NoBruto): Record<string, unknown> {
  return ehObjeto(no.attrs) ? no.attrs : {}
}

/**
 * Escapa para texto E para atributo (aspas simples e duplas incluídas), então
 * pode ser usada nos dois contextos sem ninguém precisar lembrar de qual é qual.
 */
function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Devolve a URL só se ela for de um esquema seguro ou um caminho interno.
 *
 * `new URL` é a checagem, e não um `startsWith('javascript:')`: variações como
 * `java\tscript:` ou `JaVaScRiPt:` passam por comparação de string e são
 * normalizadas corretamente pelo parser de URL.
 */
function urlSegura(valor: unknown): string | null {
  if (typeof valor !== 'string') return null

  const bruto = valor.trim()
  if (!bruto) return null

  // Caminho interno ou âncora: sem esquema, nada a validar.
  // `//host` é barrado porque é protocol-relative, não caminho interno.
  if (bruto.startsWith('#')) return bruto
  if (bruto.startsWith('/') && !bruto.startsWith('//')) return bruto

  try {
    const url = new URL(bruto)
    return ESQUEMAS_PERMITIDOS.has(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

/** Inteiro dentro de uma faixa, ou null. Usado em width/height/start. */
function inteiroEntre(valor: unknown, minimo: number, maximo: number): number | null {
  const numero = typeof valor === 'number' ? valor : Number(valor)
  if (!Number.isFinite(numero)) return null

  const arredondado = Math.round(numero)
  return arredondado >= minimo && arredondado <= maximo ? arredondado : null
}

// ─── Serialização: JSON → HTML ───────────────────────────────────────────────
/**
 * Aplica as marcas de um nó de texto.
 *
 * A ordem é invertida para que `marks[0]` termine como a tag mais externa,
 * reproduzindo o aninhamento que o ProseMirror usa.
 */
function aplicarMarcas(htmlDoTexto: string, marcas: unknown): string {
  if (!Array.isArray(marcas)) return htmlDoTexto

  let saida = htmlDoTexto

  for (const marca of [...marcas].reverse()) {
    if (!ehObjeto(marca)) continue

    const tipo = typeof marca.type === 'string' ? marca.type : ''
    const atributos = ehObjeto(marca.attrs) ? marca.attrs : {}

    switch (tipo) {
      case 'bold':
        saida = `<strong>${saida}</strong>`
        break
      case 'italic':
        saida = `<em>${saida}</em>`
        break
      case 'underline':
        saida = `<u>${saida}</u>`
        break
      case 'strike':
        saida = `<s>${saida}</s>`
        break
      case 'code':
        saida = `<code>${saida}</code>`
        break
      case 'link': {
        const href = urlSegura(atributos.href)
        // Link sem href seguro perde a tag, mas o texto continua legível.
        // `rel`/`target` NÃO vêm do JSON: quem decide é o transform do
        // sanitize-html, com base no host do destino.
        if (href) saida = `<a href="${escapar(href)}">${saida}</a>`
        break
      }
      default:
        // Marca desconhecida: ignorada, texto preservado.
        break
    }
  }

  return saida
}

function serializarFilhos(no: NoBruto): string {
  return filhosDe(no).map(serializarNo).join('')
}

function serializarNo(no: NoBruto): string {
  const tipo = tipoDe(no)
  const atributos = atributosDe(no)

  switch (tipo) {
    case 'doc':
      return serializarFilhos(no)

    case 'text':
      return typeof no.text === 'string' ? aplicarMarcas(escapar(no.text), no.marks) : ''

    case 'paragraph': {
      const dentro = serializarFilhos(no)
      // Parágrafo vazio no meio do texto é intenção do autor (espaçamento).
      return dentro ? `<p>${dentro}</p>` : '<p></p>'
    }

    case 'heading': {
      // A barra só oferece H2 e H3, mas o JSON pode trazer outros níveis (colagem
      // de outro editor). O H1 da página é o título do post: rebaixar um H1 do
      // corpo para H2 evita dois H1 na mesma página, que confunde leitor de tela
      // e buscador. Acima de H3 vira H4 e para por aí.
      const nivelBruto = inteiroEntre(atributos.level, 1, 6) ?? 2
      const nivel = nivelBruto <= 2 ? 2 : nivelBruto === 3 ? 3 : 4
      return `<h${nivel}>${serializarFilhos(no)}</h${nivel}>`
    }

    case 'bulletList':
      return `<ul>${serializarFilhos(no)}</ul>`

    case 'orderedList': {
      const inicio = inteiroEntre(atributos.start, 1, 9999)
      const attr = inicio !== null && inicio !== 1 ? ` start="${inicio}"` : ''
      return `<ol${attr}>${serializarFilhos(no)}</ol>`
    }

    case 'listItem':
      return `<li>${serializarFilhos(no)}</li>`

    case 'blockquote':
      return `<blockquote>${serializarFilhos(no)}</blockquote>`

    case 'codeBlock': {
      const idioma = typeof atributos.language === 'string' ? atributos.language : ''
      // Allowlist estreita: a classe vira atributo no HTML público e é por onde
      // um realce de sintaxe futuro vai ler o idioma.
      const classe = /^[a-z0-9+#.-]{1,24}$/i.test(idioma) ? ` class="language-${escapar(idioma)}"` : ''
      return `<pre><code${classe}>${serializarFilhos(no)}</code></pre>`
    }

    case 'horizontalRule':
      return '<hr>'

    case 'hardBreak':
      return '<br>'

    case 'image': {
      const src = urlSegura(atributos.src)
      if (!src) return ''

      // `alt` sempre presente, mesmo vazio: sem o atributo, o leitor de tela lê
      // o nome do arquivo em voz alta. `alt=""` marca a imagem como decorativa.
      const alt = typeof atributos.alt === 'string' ? atributos.alt : ''
      const titulo = typeof atributos.title === 'string' && atributos.title ? atributos.title : null
      const largura = inteiroEntre(atributos.width, 1, 10_000)
      const altura = inteiroEntre(atributos.height, 1, 10_000)

      const partes = [`src="${escapar(src)}"`, `alt="${escapar(alt)}"`]
      if (titulo) partes.push(`title="${escapar(titulo)}"`)
      if (largura) partes.push(`width="${largura}"`)
      if (altura) partes.push(`height="${altura}"`)
      partes.push('loading="lazy"', 'decoding="async"')

      return `<img ${partes.join(' ')}>`
    }

    default:
      // Nó desconhecido (extensão nova no editor, colagem estranha): a tag some,
      // mas os filhos continuam sendo serializados para o texto não evaporar.
      // Se uma extensão for adicionada ao editor, adicione o `case` aqui também
      // — o silêncio deste `default` é o que impede o desconhecido de virar HTML.
      return serializarFilhos(no)
  }
}

// ─── Serialização: JSON → texto puro ─────────────────────────────────────────
function coletarTexto(no: NoBruto, saida: string[]): void {
  const tipo = tipoDe(no)

  if (tipo === 'text') {
    if (typeof no.text === 'string') saida.push(no.text)
    return
  }

  if (tipo === 'hardBreak') {
    saida.push('\n')
    return
  }

  for (const filho of filhosDe(no)) coletarTexto(filho, saida)

  if (NOS_DE_BLOCO.has(tipo)) saida.push('\n')
}

// ─── Sanitização ─────────────────────────────────────────────────────────────
/** Link para fora do domínio do site? Relativo e mailto não contam. */
function ehLinkExterno(href: string): boolean {
  try {
    const url = new URL(href, `https://${SITE.domain}/`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

    return url.hostname !== SITE.domain && !url.hostname.endsWith(`.${SITE.domain}`)
  } catch {
    return false
  }
}

/**
 * `rel="noopener noreferrer"` em link externo.
 *
 * `noopener` corta o acesso do site de destino a `window.opener` (tabnabbing
 * reverso, que reescreve a aba de origem). `noreferrer` impede vazar a URL de
 * origem no Referer. Os atributos são reconstruídos do zero, não mesclados: o
 * que não estiver nomeado aqui não passa.
 */
const transformarLink: sanitizeHtml.Transformer = (_nomeTag, atributos) => {
  const limpos: sanitizeHtml.Attributes = {}

  if (atributos.href) limpos.href = atributos.href
  if (atributos.title) limpos.title = atributos.title

  if (atributos.href && ehLinkExterno(atributos.href)) {
    limpos.rel = 'noopener noreferrer'
    limpos.target = '_blank'
  }

  return { tagName: 'a', attribs: limpos }
}

/**
 * Allowlist final. Note o que NÃO está aqui:
 *
 * - `style` não é atributo permitido em tag nenhuma → nada de CSS inline, e por
 *   consequência nada de `background:url(javascript:…)` nem de sobreposição
 *   invisível por cima da página.
 * - nenhum `on*` é permitido, porque o allowlist é fechado: `onclick`,
 *   `onerror`, `onload` e os outros ~90 caem por não estarem nomeados.
 * - `script`, `iframe`, `object`, `embed`, `form`, `input` não estão em
 *   `allowedTags`.
 */
const OPCOES_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'strong',
    'em',
    'u',
    's',
    'a',
    'img',
    'br',
    'hr',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    code: ['class'],
    ol: ['start'],
  },
  // Só `language-*`; qualquer outra classe é descartada.
  allowedClasses: { code: ['language-*'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  // `//evil.com` herda o esquema da página e escaparia do allowlist acima.
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  // Sem isto, uma tag descartada deixa o texto interno para trás — e o corpo de
  // um `<script>` viraria texto visível na página.
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'title'],
  transformTags: { a: transformarLink },
}

// ─── API ─────────────────────────────────────────────────────────────────────
/**
 * Ponto único de derivação. Chamada pelas Server Actions no momento do save.
 *
 * Lança `ConteudoInvalido` quando o JSON não é um documento do Tiptap — o que
 * significa payload adulterado ou bug do editor, e nos dois casos gravar é pior
 * que recusar.
 */
export function derivarConteudo(contentJson: unknown): ConteudoDerivado {
  if (!ehObjeto(contentJson)) {
    throw new ConteudoInvalido('O conteúdo do post não é um documento válido.')
  }

  const doc = contentJson as NoBruto
  if (tipoDe(doc) !== 'doc') {
    throw new ConteudoInvalido('O conteúdo do post não é um documento válido.')
  }

  const htmlCru = serializarNo(doc)
  const html = sanitizeHtml(htmlCru, OPCOES_SANITIZE)

  const pedacos: string[] = []
  coletarTexto(doc, pedacos)

  const texto = pedacos
    .join('')
    // Espaço horizontal colapsado, quebras preservadas (mas no máximo duas
    // seguidas): o texto vai para o tsvector e para o resumo de busca.
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const palavras = texto ? texto.split(/\s+/).filter(Boolean).length : 0

  // `reading_minutes` é smallint NOT NULL e a UI mostra "1 min" para post curto.
  const minutos = Math.min(999, Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO)))

  return { html, texto, minutos, palavras }
}
