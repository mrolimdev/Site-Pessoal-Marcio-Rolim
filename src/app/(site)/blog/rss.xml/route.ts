import { SITE, urlAbsoluta } from '@/content/site'
import { listarPostsParaFeed, type PostResumo } from '@/lib/blog/queries'

/**
 * Feed RSS 2.0 do blog, em /blog/rss.xml.
 *
 * `force-static` + `revalidate`: o feed é gerado no build e regenerado de hora
 * em hora, como as páginas. Sem `force-static` um Route Handler no Next 16 é
 * dinâmico por padrão e cada leitor de feed que passasse aqui abriria uma
 * consulta ao banco — leitores de RSS batem com frequência e sem dó.
 */
export const dynamic = 'force-static'
export const revalidate = 3600

const ITENS_NO_FEED = 20

/**
 * Escapa os cinco caracteres que quebram XML.
 *
 * O `&` PRECISA ser o primeiro: trocando depois, ele reescaparia os `&` que as
 * outras substituições acabaram de introduzir (`&lt;` viraria `&amp;lt;`).
 */
function escaparXml(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/** RSS exige data no formato RFC 822, que é exatamente o que toUTCString() dá. */
function dataRfc822(iso: string): string | null {
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? null : data.toUTCString()
}

function item(post: PostResumo): string {
  const url = urlAbsoluta(`/blog/${post.slug}`)
  const publicado = dataRfc822(post.publicadoEm)
  const descricao = post.resumo ?? `${post.titulo} — leia no blog de ${SITE.name}.`

  return [
    '    <item>',
    `      <title>${escaparXml(post.titulo)}</title>`,
    `      <link>${escaparXml(url)}</link>`,
    // isPermaLink="true": o identificador do item É a URL. Sem isso alguns
    // leitores inventam o próprio id e reexibem o post a cada mudança de título.
    `      <guid isPermaLink="true">${escaparXml(url)}</guid>`,
    `      <description>${escaparXml(descricao)}</description>`,
    ...(publicado ? [`      <pubDate>${publicado}</pubDate>`] : []),
    ...post.tags.map((tag) => `      <category>${escaparXml(tag)}</category>`),
    '    </item>',
  ].join('\n')
}

export async function GET() {
  const posts = await listarPostsParaFeed(ITENS_NO_FEED)

  // Data do post mais novo, e não `new Date()`: um lastBuildDate que muda a
  // cada build anuncia novidade onde não houve nenhuma, e o agregador aprende
  // a ignorar o campo.
  const ultimaPublicacao = posts[0] ? dataRfc822(posts[0].publicadoEm) : null

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escaparXml(`Blog | ${SITE.name}`)}</title>`,
    `    <link>${escaparXml(urlAbsoluta('/blog'))}</link>`,
    `    <description>${escaparXml('Textos sobre inteligência artificial, automação de processos, tecnologia aplicada a negócios e fé.')}</description>`,
    `    <language>${SITE.lang}</language>`,
    `    <atom:link href="${escaparXml(urlAbsoluta('/blog/rss.xml'))}" rel="self" type="application/rss+xml" />`,
    ...(ultimaPublicacao ? [`    <lastBuildDate>${ultimaPublicacao}</lastBuildDate>`] : []),
    ...posts.map(item),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
