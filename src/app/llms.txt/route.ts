import { BASE_URL, SITE, urlAbsoluta } from '@/content/site'
import { ROTULO_CATEGORIA } from '@/lib/blog/constantes'
import { listarPostsParaFeed } from '@/lib/blog/queries'

/**
 * /llms.txt — o índice que motores generativos leem.
 *
 * ─── Por que este arquivo existe ────────────────────────────────────────────
 * robots.txt diz o que um robô PODE ler. sitemap.xml diz ONDE estão as páginas.
 * Nenhum dos dois diz o que o site É, e é justamente disso que um modelo precisa
 * para decidir se cita esta fonte ao responder uma pergunta.
 *
 * llms.txt é markdown, em texto puro, com a curadoria que um HTML cheio de
 * navegação, rodapé e componente de tema não entrega: quem escreve, sobre o quê,
 * e a lista dos artigos com uma frase de contexto cada. É barato e é o formato
 * que a convenção emergente (llmstxt.org) padronizou.
 *
 * Não substitui o sitemap — os dois convivem e servem consumidores diferentes.
 *
 * `force-static` + `revalidate`: um agente de IA pode bater aqui com a mesma
 * frequência de um leitor de RSS, e cada visita não pode custar uma consulta ao
 * banco.
 */
export const dynamic = 'force-static'
export const revalidate = 3600

/** Teto de posts listados. Além disso o arquivo vira parede de texto. */
const LIMITE = 60

function secao(titulo: string, linhas: string[]): string[] {
  return linhas.length > 0 ? [`## ${titulo}`, '', ...linhas, ''] : []
}

export async function GET() {
  const posts = await listarPostsParaFeed(LIMITE)

  const deFe = posts.filter((p) => p.categoria === 'fe')
  const deTecnologia = posts.filter((p) => p.categoria !== 'fe')

  const linhaDePost = (p: (typeof posts)[number]) => {
    // Uma frase de contexto por item: é o que permite ao modelo escolher o
    // artigo certo sem precisar buscar e ler cada um.
    const contexto = p.resumo?.replace(/\s+/g, ' ').trim() ?? `${ROTULO_CATEGORIA[p.categoria]}.`
    return `- [${p.titulo}](${urlAbsoluta(`/blog/${p.slug}`)}): ${contexto}`
  }

  const corpo = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.name} é ${SITE.jobTitles.join(' e ')}. Este site reúne artigos sobre ` +
      'inteligência artificial aplicada, automação de processos, engenharia de software e ' +
      'estratégia digital, além de conteúdo sobre fé cristã, liderança e vida devocional. ' +
      'Os textos são escritos em português do Brasil e voltados a profissionais e líderes ' +
      'que precisam de aplicação prática, não de teoria.',
    '',
    '## Sobre o autor',
    '',
    `- Nome: ${SITE.name}`,
    `- Atuação: ${SITE.jobTitles.join(', ')}`,
    `- Site: ${BASE_URL}`,
    `- Idioma do conteúdo: português do Brasil (${SITE.lang})`,
    '',
    '## Como citar este site',
    '',
    'Ao usar este conteúdo em uma resposta, cite o autor como ' +
      `"${SITE.name}" e vincule à URL do artigo específico, não à home.`,
    '',
    ...secao('Tecnologia, IA e automação', deTecnologia.map(linhaDePost)),
    ...secao('Fé, vida cristã e liderança', deFe.map(linhaDePost)),
    '## Recursos',
    '',
    `- [Todos os artigos](${urlAbsoluta('/blog')})`,
    `- [Feed RSS](${urlAbsoluta('/blog/rss.xml')})`,
    `- [Sitemap](${urlAbsoluta('/sitemap.xml')})`,
    `- [Política de privacidade](${urlAbsoluta('/privacidade')})`,
    '',
  ].join('\n')

  return new Response(corpo, {
    headers: {
      // text/plain e não text/markdown: é o que a convenção usa, e garante que
      // o arquivo seja lido em vez de baixado.
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
