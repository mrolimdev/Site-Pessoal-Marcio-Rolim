import Link from 'next/link'

import { CategoriaBadge } from '@/components/blog/categoria-badge'
import { DataPost } from '@/components/blog/data-post'
import { ImagemDeCapa } from '@/components/blog/imagem-capa'
import type { PostResumo } from '@/lib/blog/queries'

/**
 * Cartão enxuto: o desenho da seção "Últimas Publicações do Blog" da home.
 *
 * ─── O que o torna minimalista ──────────────────────────────────────────────
 *
 * A diferença para o `PostCard` não é só tamanho. Aqui a capa é um retângulo
 * arredondado DENTRO do cartão, com respiro em volta, em vez de sangrar até a
 * borda; a categoria divide uma linha só com o tempo de leitura, em vez de
 * ocupar uma linha inteira; título e resumo têm corte de linha fixo, então
 * três cartões lado a lado terminam na mesma altura; e as tags saem.
 *
 * ─── Por que virou componente ───────────────────────────────────────────────
 *
 * O desenho existia solto dentro do carrossel da home. Os posts relacionados
 * precisavam do mesmo cartão, e copiar a marcação faria as duas cópias
 * divergirem no primeiro ajuste. Agora é um componente só, usado nos dois
 * lugares — mudou aqui, mudou nos dois.
 *
 * A área clicável inteira sai de um único <a>, o do título, esticado por
 * `after:absolute after:inset-0`. É a mesma solução do `PostCard`. A versão
 * anterior da home tinha três links para a MESMA URL no mesmo cartão (capa,
 * título e "Ler artigo"), e um leitor de tela anunciava os três.
 */
export function PostCardMinimalista({
  post,
  sizes,
  prioridade = false,
  className = '',
}: {
  post: PostResumo
  /** Obrigatório: com `fill`, sem `sizes` o Next serve sempre a maior versão. */
  sizes: string
  /** `true` só no primeiro cartão visível: pré-carrega a capa acima da dobra. */
  prioridade?: boolean
  /** Largura e encaixe no carrossel; `h-full` na grade, para igualar alturas. */
  className?: string
}) {
  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/40 ${className}`}
    >
      <div className="flex flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-stone-100 bg-stone-100 dark:border-slate-800 dark:bg-slate-950">
          {post.capaUrl ? (
            <ImagemDeCapa
              src={post.capaUrl}
              // Post sem `cover_alt` recebe alt vazio de propósito: a capa é
              // decorativa e o título já está logo abaixo, em texto.
              alt={post.capaAlt ?? ''}
              sizes={sizes}
              prioridade={prioridade}
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-xs font-bold text-stone-400 dark:text-slate-600"
            >
              Blog Márcio Rolim
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <CategoriaBadge categoria={post.categoria} />

          <span className="font-mono text-[0.7rem] font-semibold text-stone-400 dark:text-slate-500">
            ⏱️ {post.minutosDeLeitura} min
          </span>
        </div>

        <h3 className="line-clamp-2 text-base leading-snug font-black text-stone-900 dark:text-white">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors after:absolute after:inset-0 hover:text-amber-600 dark:hover:text-amber-400"
          >
            {post.titulo}
          </Link>
        </h3>

        {post.resumo && (
          <p className="line-clamp-2 text-xs leading-relaxed text-stone-500 dark:text-slate-400">
            {post.resumo}
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-slate-800/80">
        {/* `DataPost` no lugar do formatador local que a home tinha: ele fixa o
            fuso em America/Sao_Paulo. Sem isso o servidor formata em UTC e o
            navegador em fuso local, e um post das 22h aparecia com a data do dia
            seguinte no HTML — mismatch de hidratação, não detalhe estético. */}
        <DataPost
          iso={post.publicadoEm}
          curta
          className="text-[0.7rem] font-medium text-stone-400 dark:text-slate-500"
        />

        {/* Não é link: o cartão inteiro já leva ao post, e um segundo <a> para a
            mesma URL só repetiria o destino para quem navega por teclado. */}
        <span
          aria-hidden="true"
          className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-amber-400"
        >
          Ler artigo <span>→</span>
        </span>
      </div>
    </article>
  )
}
