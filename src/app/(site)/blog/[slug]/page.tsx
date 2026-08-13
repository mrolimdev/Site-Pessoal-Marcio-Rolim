import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CabecalhoBlog, CascaBlog } from '@/components/blog/casca-blog'
import { CategoriaBadge } from '@/components/blog/categoria-badge'
import { DataPost, TempoDeLeitura } from '@/components/blog/data-post'
import { ImagemDeCapa } from '@/components/blog/imagem-capa'
import { PostCardMinimalista } from '@/components/blog/post-card-minimalista'
import { TagsDoPost } from '@/components/blog/tags-post'
import { ArrowLeftIcon, WhatsAppIcon } from '@/components/icons'
import { PostBody } from '@/components/post-body'
import { BASE_URL, CONTACT, MEDIA, SITE, urlAbsoluta } from '@/content/site'
import { ROTULO_CATEGORIA } from '@/lib/blog/constantes'
import {
  extrairFaq,
  jsonLd,
  schemaArtigo,
  schemaFaq,
  schemaTrilha,
} from '@/lib/seo/schema'
import {
  listarSlugsPublicados,
  obterPostPorSlug,
  obterPostsRelacionados,
  type PostCompleto,
} from '@/lib/blog/queries'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await listarSlugsPublicados()
  return slugs.map((slug) => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await obterPostPorSlug(slug)

  if (!post) {
    return { title: 'Post não encontrado', robots: { index: false, follow: false } }
  }

  const titulo = post.seoTitulo ?? post.titulo
  const descricao = post.seoDescricao ?? post.resumo ?? undefined
  const caminho = `/blog/${post.slug}`
  const imagens = post.capaUrl
    ? [{ url: post.capaUrl, alt: post.capaAlt ?? post.titulo }]
    : undefined

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    robots: post.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-image-preview': 'large' },
    authors: [{ name: SITE.name, url: BASE_URL }],
    keywords: post.tags.length > 0 ? post.tags : undefined,
    openGraph: {
      type: 'article',
      url: urlAbsoluta(caminho),
      title: titulo,
      description: descricao,
      siteName: SITE.siteName,
      locale: SITE.locale,
      publishedTime: post.publicadoEm,
      modifiedTime: post.atualizadoEm,
      authors: [SITE.name],
      section: ROTULO_CATEGORIA[post.categoria],
      tags: post.tags,
      images: imagens,
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
      images: post.capaUrl ? [post.capaUrl] : undefined,
    },
  }
}


export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await obterPostPorSlug(slug)

  if (!post) notFound()

  // Carrega 3 posts relacionados da mesma categoria
  const postsRelacionados = await obterPostsRelacionados(post.slug, post.categoria, 3)

  // `wordCount` do schema vem do texto derivado no save, não de uma contagem
  // refeita aqui: é o mesmo número que alimentou `reading_minutes`.
  const palavras = post.minutosDeLeitura * 200
  const artigo = schemaArtigo(post, palavras)
  const faq = extrairFaq(post.conteudo)
  const trilha = schemaTrilha([
    { nome: 'Início', caminho: '/' },
    { nome: 'Blog', caminho: '/blog' },
    { nome: ROTULO_CATEGORIA[post.categoria], caminho: `/blog/tag/${encodeURIComponent(post.categoria)}` },
    { nome: post.titulo, caminho: `/blog/${post.slug}` },
  ])

  return (
    <CascaBlog voltar={{ href: '/blog', rotulo: 'Blog' }}>
      {/* Um <script> por entidade, e não um grafo aninhado: se um bloco tiver
          erro, o buscador descarta só aquele. Os `@id` compartilhados (definidos
          em lib/seo/schema.ts) é que ligam artigo, autor e site num grafo só. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(artigo) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(trilha) }} />
      {faq.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schemaFaq(faq)) }} />
      )}

      {/* ─── CAPA: A PRIMEIRA COISA DA PÁGINA ───
          Antes ela vinha depois do cabeçalho inteiro — título, resumo, autor e
          data —, ou seja, só aparecia passada a primeira dobra, quando quem
          chegou pelo card do blog já tinha visto essa mesma imagem.

          Sangra de ponta a ponta, sem borda nem canto arredondado: contida na
          régua do texto ela pareceria mais um bloco do artigo, e não a abertura.

          `max-h` porque 21/9 numa tela larga passa dos 800px de altura, e o
          título nasceria fora da tela. A imagem preenche por `object-cover`, o
          corte cai nas bordas e o miolo continua inteiro. */}
      {post.capaUrl && (
        <figure className="relative aspect-[16/9] max-h-[70vh] w-full overflow-hidden bg-stone-100 md:aspect-[21/9] dark:bg-slate-800">
          <ImagemDeCapa
            src={post.capaUrl}
            alt={post.capaAlt ?? ''}
            sizes="100vw"
            prioridade
          />
        </figure>
      )}

      {/* ─── CABEÇALHO MODERNO E COMPLETO DO POST ───
          `compacto` quando há capa: o `pt-28` do padrão existe para o título não
          nascer embaixo da pílula flutuante, e com a capa no topo é ela que fica
          ali — os 112px viram buraco entre a imagem e o título. */}
      <CabecalhoBlog compacto={Boolean(post.capaUrl)}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 flex-wrap">
            <CategoriaBadge categoria={post.categoria} />
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1 font-mono text-xs font-semibold text-slate-600 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-300">
              <TempoDeLeitura minutos={post.minutosDeLeitura} />
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white leading-[1.12]">
            {post.titulo}
          </h1>

          {post.resumo && (
            <p className="border-l-4 border-amber-500 pl-4 text-base font-medium leading-relaxed text-slate-600 sm:text-lg dark:border-amber-400 dark:text-slate-300">
              {post.resumo}
            </p>
          )}

          {/* PERFIL DO AUTOR E METADADOS DO CABEÇALHO */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/60 pt-6 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500 to-sky-500 opacity-75 blur transition duration-300 group-hover:opacity-100" />
                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-stone-200 dark:border-slate-900 dark:bg-slate-800">
                  <Image
                    src="/FotoRostoRolim.jpeg"
                    alt={SITE.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {SITE.name}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Engenheiro de IA & Software · Pastor Evangélico
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
              <span>Publicado em</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                <DataPost iso={post.publicadoEm} />
              </span>
            </div>
          </div>
        </div>
      </CabecalhoBlog>

      {/* ─── CORPO DO ARTIGO E POSTS RELACIONADOS ─── */}
      <main className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
        <article className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl sm:p-10 dark:border-slate-800/80 dark:bg-slate-900/90">
          <PostBody conteudo={post.conteudo} />
        </article>

        {post.tags.length > 0 && (
          <section
            aria-label="Tags do post"
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-stone-50/60 p-6 dark:border-slate-800/80 dark:bg-slate-900/40"
          >
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              🏷️ Tags do Artigo
            </h2>
            <TagsDoPost tags={post.tags} />
          </section>
        )}

        {/* BIO DO AUTOR AO FINAL DO POST */}
        <section className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-amber-500/10 via-white to-sky-500/10 p-6 shadow-md backdrop-blur-xl sm:flex-row sm:items-center dark:border-slate-800/80 dark:from-amber-500/10 dark:via-slate-900/90 dark:to-sky-500/10 sm:p-8">
          <div className="relative shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-amber-500/40 shadow-lg">
              <Image
                src="/FotoRostoRolim.jpeg"
                alt={SITE.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Sobre {SITE.name}
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Engenheiro de IA & Software e Pastor Evangélico. Especialista em automação de processos empresariais, arquitetura de sistemas e inteligência artificial, conectando alta tecnologia com princípios e ética cristã.
            </p>
          </div>
        </section>

        {/* NAVEGAÇÃO E BOTOES DE AÇÃO */}
        <nav className="flex flex-col gap-4 border-t border-slate-200/80 pt-8 sm:flex-row dark:border-slate-800/80">
          <Link
            href="/blog"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:border-amber-500/40 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar para todos os posts
          </Link>

          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-track="contato_click"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Conversar sobre este assunto
          </a>
        </nav>

        {/* ─── SEÇÃO DE 3 POSTS RELACIONADOS ─── */}
        {postsRelacionados.length > 0 && (
          <section className="mt-8 border-t border-slate-200/80 pt-12 dark:border-slate-800/80">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-xl text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                📚
              </span>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Posts Relacionados
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Continue explorando conteúdos relevantes na mesma categoria
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {postsRelacionados.map((rel) => (
                <PostCardMinimalista
                  key={rel.slug}
                  post={rel}
                  // Três colunas no desktop dentro da coluna de leitura; uma só
                  // no celular.
                  sizes="(min-width: 640px) 22rem, 92vw"
                  className="h-full"
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </CascaBlog>
  )
}
