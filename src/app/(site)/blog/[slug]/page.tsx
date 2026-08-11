import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CascaBlog } from '@/components/blog/casca-blog'
import { CategoriaBadge } from '@/components/blog/categoria-badge'
import { DataPost, TempoDeLeitura } from '@/components/blog/data-post'
import { ImagemDeCapa } from '@/components/blog/imagem-capa'
import { PostCard } from '@/components/blog/post-card'
import { TagsDoPost } from '@/components/blog/tags-post'
import { ArrowLeftIcon, WhatsAppIcon } from '@/components/icons'
import { PostBody } from '@/components/post-body'
import { BASE_URL, CONTACT, MEDIA, SITE, urlAbsoluta } from '@/content/site'
import { ROTULO_CATEGORIA } from '@/lib/blog/constantes'
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

  // Carrega 3 posts relacionados da mesma categoria
  const postsRelacionados = await obterPostsRelacionados(post.slug, post.categoria, 3)

  return (
    <CascaBlog>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdDoPost(post) }}
      />

      {/* ─── CABEÇALHO MODERNO DO POST ─── */}
      <header className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-stone-100/90 via-stone-50/50 to-white py-12 dark:border-slate-800/80 dark:from-slate-900/90 dark:via-slate-900/50 dark:to-slate-950">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-slate-600 shadow-2xs backdrop-blur-md transition-all hover:border-amber-500/40 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-amber-400"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Voltar ao Blog
            </Link>

            <CategoriaBadge categoria={post.categoria} />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white leading-[1.15]">
            {post.titulo}
          </h1>

          {post.resumo && (
            <p className="border-l-4 border-amber-500/60 pl-4 text-lg font-medium leading-relaxed text-slate-600 dark:border-amber-400/60 dark:text-slate-300">
              {post.resumo}
            </p>
          )}

          {/* PERFIL DO AUTOR E METADADOS */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/60 pt-6 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-amber-500/30 bg-stone-200 shadow-sm dark:bg-slate-800">
                <Image
                  src="/FotoRostoRolim.jpeg"
                  alt={SITE.name}
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {SITE.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Engenheiro de IA & Software
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-2 text-xs font-semibold text-slate-500 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-400">
              <DataPost iso={post.publicadoEm} />
              <span aria-hidden="true">·</span>
              <TempoDeLeitura minutos={post.minutosDeLeitura} />
            </div>
          </div>
        </div>
      </header>

      {/* ─── CORPO DO ARTIGO E POSTS RELACIONADOS ─── */}
      <main className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
        {post.capaUrl && (
          <figure className="relative aspect-[21/9] overflow-hidden rounded-3xl border border-slate-200/80 bg-stone-100 shadow-xl dark:border-slate-800/80 dark:bg-slate-800">
            <ImagemDeCapa
              src={post.capaUrl}
              alt={post.capaAlt ?? ''}
              sizes="(min-width: 768px) 56rem, 92vw"
              prioridade
            />
          </figure>
        )}

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
                  Continue explorando conteúdos relevantes na categoria
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {postsRelacionados.map((rel) => (
                <PostCard key={rel.slug} post={rel} />
              ))}
            </div>
          </section>
        )}
      </main>
    </CascaBlog>
  )
}
