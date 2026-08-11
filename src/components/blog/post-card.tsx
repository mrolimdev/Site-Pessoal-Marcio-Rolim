import Link from 'next/link'

import { CategoriaBadge } from '@/components/blog/categoria-badge'
import { DataPost, TempoDeLeitura } from '@/components/blog/data-post'
import { ImagemDeCapa } from '@/components/blog/imagem-capa'
import { TagsDoPost } from '@/components/blog/tags-post'
import { ChevronRightIcon } from '@/components/icons'
import type { PostResumo } from '@/lib/blog/queries'

/**
 * Cartão de post.
 *
 * A área clicável inteira sai de um único <a> (o do título) esticado por
 * `after:absolute after:inset-0`. Envolver o cartão num <a> seria HTML
 * inválido — as tags aqui dentro também são links, e link dentro de link é
 * proibido. As tags sobem para `relative z-10` e ficam acima da máscara.
 */

const CARTAO =
  'group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-amber-500/30'

function CapaOuPlaceholder({
  post,
  sizes,
  prioridade,
}: {
  post: PostResumo
  sizes: string
  prioridade: boolean
}) {
  if (post.capaUrl) {
    return (
      <ImagemDeCapa
        src={post.capaUrl}
        // Post sem `cover_alt` recebe alt vazio de propósito: a capa é
        // decorativa e o título já está logo abaixo, em texto. Repetir o título
        // no alt faz o leitor de tela anunciar a mesma coisa duas vezes.
        alt={post.capaAlt ?? ''}
        sizes={sizes}
        prioridade={prioridade}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-gradient-to-br from-amber-100 via-stone-100 to-emerald-100 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-950"
    />
  )
}

export function PostCard({
  post,
  prioridade = false,
}: {
  post: PostResumo
  /** `true` só no primeiro cartão visível: pré-carrega a capa acima da dobra. */
  prioridade?: boolean
}) {
  return (
    <article className={CARTAO}>
      <div className="relative aspect-[16/9] overflow-hidden bg-stone-100 dark:bg-slate-800">
        <CapaOuPlaceholder
          post={post}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
          prioridade={prioridade}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <CategoriaBadge categoria={post.categoria} />

        <h2 className="text-xl leading-snug font-bold tracking-tight text-slate-900 dark:text-white">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors after:absolute after:inset-0 hover:text-amber-700 dark:hover:text-amber-400"
          >
            {post.titulo}
          </Link>
        </h2>

        {post.resumo && (
          <p className="line-clamp-3 leading-relaxed text-slate-600 dark:text-slate-400">
            {post.resumo}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-sm text-slate-500 dark:text-slate-500">
          <DataPost iso={post.publicadoEm} curta />
          <span aria-hidden="true">·</span>
          <TempoDeLeitura minutos={post.minutosDeLeitura} />
        </div>

        <TagsDoPost tags={post.tags.slice(0, 3)} className="relative z-10" />
      </div>
    </article>
  )
}

/** Primeiro post da primeira página: mesma informação, mais presença. */
export function PostCardDestaque({ post }: { post: PostResumo }) {
  return (
    <article className={`${CARTAO} md:flex-row`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-stone-100 md:aspect-auto md:w-1/2 dark:bg-slate-800">
        <CapaOuPlaceholder
          post={post}
          sizes="(min-width: 768px) 34rem, 92vw"
          prioridade
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-xs font-bold tracking-wide text-white uppercase">
            Mais recente
          </span>
          <CategoriaBadge categoria={post.categoria} />
        </div>

        <h2 className="text-2xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors after:absolute after:inset-0 hover:text-amber-700 dark:hover:text-amber-400"
          >
            {post.titulo}
          </Link>
        </h2>

        {post.resumo && (
          <p className="line-clamp-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {post.resumo}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          <DataPost iso={post.publicadoEm} />
          <span aria-hidden="true">·</span>
          <TempoDeLeitura minutos={post.minutosDeLeitura} />
          <span
            aria-hidden="true"
            className="ml-auto hidden items-center gap-1 font-semibold text-amber-600 sm:flex dark:text-amber-400"
          >
            Ler agora
            <ChevronRightIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  )
}
