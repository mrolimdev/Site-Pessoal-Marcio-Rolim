import 'server-only'

import { BASE_URL, MEDIA, SITE, SOCIAL_SAME_AS, urlAbsoluta } from '@/content/site'
import { ROTULO_CATEGORIA } from '@/lib/blog/constantes'
import type { NoTiptap, PostCompleto } from '@/lib/blog/queries'

/**
 * Dados estruturados (JSON-LD) do site.
 *
 * ─── Por que centralizar ────────────────────────────────────────────────────
 * O schema estava espalhado: um `Person` na home, um `BlogPosting` montado à mão
 * dentro da página do post, e nada nas listagens. Sem um `@id` comum, cada bloco
 * declarava uma pessoa diferente para o buscador — três entidades soltas em vez
 * de uma com três menções. Aqui todos apontam para os mesmos `@id`, e é isso que
 * permite ao Google ligar autor, site e artigo num grafo só.
 *
 * ─── SEO, AEO e GEO fazem coisas diferentes ─────────────────────────────────
 *   SEO  posicionar o link azul       → BlogPosting, sitemap, canonical
 *   AEO  virar a resposta direta      → FAQPage, BreadcrumbList, headings-pergunta
 *   GEO  ser citado por um modelo     → autoria explícita, datas, llms.txt
 *
 * Os três se apoiam nos mesmos dados; o que muda é o formato em que o dado é
 * exposto. Por isso `speakable`, `wordCount` e `author.sameAs` não são adorno:
 * são o que distingue "página que fala do assunto" de "fonte citável".
 */

// ─── Identidades estáveis ────────────────────────────────────────────────────
// `@id` com fragmento é a convenção: a mesma entidade referenciada de qualquer
// página do site resolve para o mesmo nó do grafo.
export const ID_PESSOA = `${BASE_URL}/#pessoa`
export const ID_SITE = `${BASE_URL}/#site`

export function schemaPessoa() {
  return {
    '@type': 'Person',
    '@id': ID_PESSOA,
    name: SITE.name,
    url: BASE_URL,
    image: MEDIA.schemaImageUrl,
    jobTitle: SITE.jobTitles,
    description: SITE.description,
    // A MESMA lista que a home já declara. Duas listas divergentes fariam o
    // buscador ver dois perfis diferentes da mesma pessoa.
    sameAs: SOCIAL_SAME_AS,
  }
}

/**
 * `WebSite` com `SearchAction` é o que habilita a caixa de busca do site dentro
 * do resultado do Google (sitelinks searchbox). Exige que a URL de busca exista
 * de fato — aponta para a listagem do blog, que aceita `?busca=`.
 */
export function schemaSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ID_SITE,
    url: BASE_URL,
    name: SITE.siteName,
    description: SITE.description,
    inLanguage: SITE.lang,
    publisher: { '@id': ID_PESSOA },
    author: schemaPessoa(),
  }
}

/**
 * Trilha de navegação.
 *
 * Vale por dois motivos concretos: o Google troca a URL crua do resultado por
 * "marciorolim.com.br › Blog › Tecnologia", que aumenta o clique; e o modelo de
 * IA ganha a hierarquia do conteúdo sem ter que inferir da URL.
 */
export function schemaTrilha(itens: readonly { nome: string; caminho: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      name: item.nome,
      item: urlAbsoluta(item.caminho),
    })),
  }
}

// ─── Perguntas frequentes: o bloco que mais rende em AEO ─────────────────────

export type ParPergunta = { pergunta: string; resposta: string }

const TITULOS_DE_FAQ = /^(perguntas frequentes|d[úu]vidas frequentes|faq)\b/i

/**
 * Extrai o FAQ do próprio corpo do post, em vez de guardá-lo numa coluna nova.
 *
 * A fonte da verdade continua sendo `content_json` — o que o leitor vê é
 * exatamente o que vira dado estruturado, e não há como os dois divergirem. O
 * gerador emite a seção no formato que esta função reconhece:
 *
 *   heading nível 2  "Perguntas frequentes"
 *   heading nível 3  a pergunta
 *   paragraph        a resposta
 *   (repete)
 *
 * Um post escrito à mão que siga a mesma estrutura ganha o FAQPage de graça.
 */
export function extrairFaq(conteudo: NoTiptap): ParPergunta[] {
  const nos = conteudo?.content ?? []
  const pares: ParPergunta[] = []

  let dentroDaSecao = false
  let perguntaAtual: string | null = null
  let respostaAtual: string[] = []

  const fechar = () => {
    if (perguntaAtual && respostaAtual.length > 0) {
      pares.push({ pergunta: perguntaAtual, resposta: respostaAtual.join(' ').trim() })
    }
    perguntaAtual = null
    respostaAtual = []
  }

  const textoDe = (no: NoTiptap): string =>
    (no.content ?? []).map((filho) => filho.text ?? '').join('').replace(/\s+/g, ' ').trim()

  for (const no of nos) {
    const nivel = typeof no.attrs?.level === 'number' ? no.attrs.level : 0

    if (no.type === 'heading' && nivel <= 2) {
      fechar()
      // Um H2 diferente encerra a seção: o FAQ acabou.
      dentroDaSecao = TITULOS_DE_FAQ.test(textoDe(no))
      continue
    }

    if (!dentroDaSecao) continue

    if (no.type === 'heading' && nivel >= 3) {
      fechar()
      perguntaAtual = textoDe(no)
      continue
    }

    if (no.type === 'paragraph' && perguntaAtual) {
      const texto = textoDe(no)
      if (texto) respostaAtual.push(texto)
    }
  }

  fechar()
  return pares
}

export function schemaFaq(pares: readonly ParPergunta[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pares.map((par) => ({
      '@type': 'Question',
      name: par.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: par.resposta },
    })),
  }
}

// ─── Artigo ──────────────────────────────────────────────────────────────────

export function schemaArtigo(post: PostCompleto, palavras: number) {
  const url = urlAbsoluta(`/blog/${post.slug}`)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#artigo`,
    headline: post.titulo.slice(0, 110), // o Google trunca acima disso
    description: post.seoDescricao ?? post.resumo ?? undefined,
    image: post.capaUrl && !post.capaUrl.startsWith('data:') ? [post.capaUrl] : [MEDIA.ogImageUrl],
    datePublished: post.publicadoEm,
    dateModified: post.atualizadoEm,
    inLanguage: SITE.lang,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isPartOf: { '@id': ID_SITE },
    articleSection: ROTULO_CATEGORIA[post.categoria],
    keywords: post.tags.length > 0 ? post.tags.join(', ') : undefined,
    // `wordCount` e `timeRequired` sinalizam profundidade. Para um motor
    // generativo escolhendo entre duas fontes, é um critério de desempate real.
    wordCount: palavras,
    timeRequired: `PT${post.minutosDeLeitura}M`,
    // Ambos apontam para o MESMO nó: uma entidade, não duas homônimas.
    author: { '@id': ID_PESSOA },
    publisher: { '@id': ID_PESSOA },
    // Sem paywall: diz ao buscador que pode indexar o corpo inteiro.
    isAccessibleForFree: true,
    // O que um assistente de voz leria se perguntado sobre a página.
    //
    // `blockquote` e não um seletor específico da resposta rápida: ela é
    // renderizada como o PRIMEIRO blockquote do post, e o renderizador
    // (components/post-body.tsx) não expõe um gancho para distingui-la das
    // demais citações. Um seletor que não casa com nada seria pior que um
    // seletor amplo — a diretiva simplesmente não valeria.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'blockquote'],
    },
  }
}

/**
 * Serializa para dentro de `<script type="application/ld+json">`.
 *
 * O escape de `<` é obrigatório: um `</script>` dentro de qualquer string do
 * objeto — um título de post, por exemplo — encerraria a tag mais cedo e o
 * restante viraria HTML executável na página.
 */
export function jsonLd(objeto: unknown): string {
  return JSON.stringify(objeto).replace(/</g, '\\u003c')
}

/**
 * Listagem do blog.
 *
 * `Blog` + `ItemList` diz ao buscador que aquela página é um índice, e não um
 * artigo pobre em conteúdo — a leitura padrão de uma página cheia de cartões
 * curtos. Sem isso, `/blog` compete com os próprios posts e costuma perder.
 */
export function schemaListagemBlog(
  posts: readonly { slug: string; titulo: string; resumo: string | null; publicadoEm: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${BASE_URL}/blog#blog`,
    url: urlAbsoluta('/blog'),
    name: `Blog | ${SITE.name}`,
    description: SITE.description,
    inLanguage: SITE.lang,
    isPartOf: { '@id': ID_SITE },
    author: { '@id': ID_PESSOA },
    publisher: { '@id': ID_PESSOA },
    blogPost: posts.slice(0, 20).map((post) => ({
      '@type': 'BlogPosting',
      '@id': `${urlAbsoluta(`/blog/${post.slug}`)}#artigo`,
      headline: post.titulo.slice(0, 110),
      description: post.resumo ?? undefined,
      datePublished: post.publicadoEm,
      url: urlAbsoluta(`/blog/${post.slug}`),
      author: { '@id': ID_PESSOA },
    })),
  }
}
