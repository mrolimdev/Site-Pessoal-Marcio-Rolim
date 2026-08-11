import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CabecalhoBlog, CascaBlog } from '@/components/blog/casca-blog'
import { CategoriaBadge } from '@/components/blog/categoria-badge'
import { DataPost, TempoDeLeitura } from '@/components/blog/data-post'
import { ImagemDeCapa } from '@/components/blog/imagem-capa'
import { TagsDoPost } from '@/components/blog/tags-post'
import { ArrowLeftIcon, WhatsAppIcon } from '@/components/icons'
import { PostBody } from '@/components/post-body'
import { BASE_URL, CONTACT, MEDIA, SITE, urlAbsoluta } from '@/content/site'
import { ROTULO_CATEGORIA } from '@/lib/blog/constantes'
import { listarSlugsPublicados, obterPostPorSlug, type PostCompleto } from '@/lib/blog/queries'

/**
 * Post individual — pré-renderizado no build e revalidado de hora em hora.
 *
 * `dynamicParams` fica no padrão (`true`) de propósito: post publicado DEPOIS
 * do build não está em `generateStaticParams`, e com `false` ele responderia
 * 404 até o próximo deploy. Do jeito que está, a primeira visita gera a página
 * e ela entra em cache como as demais.
 */
export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await listarSlugsPublicados()
  return slugs.map((slug) => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await obterPostPorSlug(slug)

  // Sem post não há metadata útil. O 404 quem devolve é o componente da página;
  // aqui só evitamos que um rascunho apagado deixe rastro indexável.
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
    // `follow: true` mesmo com noindex: a coluna diz "não indexe ESTA URL", não
    // "desconfie do que ela aponta". Bloquear o rastreio dos links puniria as
    // páginas ligadas a partir daqui sem nenhum motivo.
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

/**
 * JSON-LD do post.
 *
 * `JSON.stringify` escapa aspas, mas não `<`. Título com "</script>" fecharia a
 * tag e o resto do JSON viraria HTML executável — daí a troca por `<`,
 * que o parser de JSON lê como o mesmo caractere e o parser de HTML ignora.
 */
function jsonLdDoPost(post: PostCompleto): string {
  const url = urlAbsoluta(`/blog/${post.slug}`)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.titulo,
    description: post.seoDescricao ?? post.resumo ?? undefined,
    image: post.capaUrl ?? MEDIA.ogImageUrl,
    datePublished: post.publicadoEm,
    dateModified: post.atualizadoEm,
    inLanguage: SITE.lang,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: ROTULO_CATEGORIA[post.categoria],
    keywords: post.tags.length > 0 ? post.tags.join(', ') : undefined,
    timeRequired: `PT${post.minutosDeLeitura}M`,
    author: { '@type': 'Person', name: SITE.name, url: BASE_URL },
    publisher: { '@type': 'Person', name: SITE.name, url: BASE_URL },
  }

  return JSON.stringify(schema).replace(/</g, '\\u003c')
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await obterPostPorSlug(slug)

  if (!post) notFound()

  return (
    <CascaBlog voltar={{ href: '/blog', rotulo: 'Blog' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdDoPost(post) }}
      />

      <CabecalhoBlog>
        <CategoriaBadge categoria={post.categoria} />

        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {post.titulo}
        </h1>

        {post.resumo && (
          <p className="max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {post.resumo}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-200">{SITE.name}</span>
          <span aria-hidden="true">·</span>
          <DataPost iso={post.publicadoEm} />
          <span aria-hidden="true">·</span>
          <TempoDeLeitura minutos={post.minutosDeLeitura} />
        </div>
      </CabecalhoBlog>

      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
        {post.capaUrl && (
          <figure className="relative aspect-[21/9] overflow-hidden rounded-3xl border border-slate-200 bg-stone-100 dark:border-slate-800 dark:bg-slate-800">
            <ImagemDeCapa
              src={post.capaUrl}
              alt={post.capaAlt ?? ''}
              sizes="(min-width: 768px) 48rem, 92vw"
              prioridade
            />
          </figure>
        )}

        <article>
          <PostBody conteudo={post.conteudo} />
        </article>

        {post.tags.length > 0 && (
          <section
            aria-label="Tags do post"
            className="flex flex-col gap-3 border-t border-slate-200 pt-8 dark:border-slate-800"
          >
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              Tags
            </h2>
            <TagsDoPost tags={post.tags} />
          </section>
        )}

        <nav className="flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row dark:border-slate-800">
          <Link
            href="/blog"
            className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600 transition-all hover:border-amber-500/40 hover:text-amber-700 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:text-amber-400"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Ver todos os posts
          </Link>

          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-track="contato_click"
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-400"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Conversar sobre este assunto
          </a>
        </nav>
      </main>
    </CascaBlog>
  )
}
