import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdmin } from '@/lib/auth/require-admin'
import {
  ROTULO_CATEGORIA,
  ROTULO_STATUS,
  formatarDataPainel,
  type Categoria,
  type StatusPost,
} from '@/lib/blog/constantes'
import { createClient } from '@/lib/supabase/server'

import { AcoesPost } from './acoes-post'

export const metadata: Metadata = {
  title: 'Posts',
  robots: { index: false, follow: false },
}

/**
 * A linha, como ela vem do `select`. Escrita à mão porque o projeto não gera os
 * tipos do banco — sem isto `data` é `any` e um campo renomeado na migration
 * viraria `undefined` na tela em vez de erro de compilação.
 */
type LinhaListagem = {
  id: string
  slug: string
  title: string
  status: StatusPost
  category: Categoria
  published_at: string | null
  updated_at: string
  reading_minutes: number
}

const CAMPOS = 'id, slug, title, status, category, published_at, updated_at, reading_minutes'

const CORES_STATUS: Record<StatusPost, string> = {
  draft: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  scheduled: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  archived: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
}

function Etiqueta({ status }: { status: StatusPost }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${CORES_STATUS[status]}`}
    >
      {ROTULO_STATUS[status]}
    </span>
  )
}

export default async function PostsPage() {
  // PRIMEIRA linha. Checar só no layout não cobre esta página: layouts não
  // re-renderizam a cada navegação e não decidem se o filho renderiza.
  await requireAdmin()

  const supabase = await createClient()

  // Cliente com o JWT do admin, e não `createAdminClient()`: assim a política
  // "admin le tudo" continua sendo quem autoriza a leitura.
  const { data, error } = await supabase
    .from('posts')
    .select(CAMPOS)
    .order('updated_at', { ascending: false })
    .limit(200)

  const posts = (data ?? []) as LinhaListagem[]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Posts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {posts.length === 1 ? '1 post' : `${posts.length} posts`}
          </p>
        </div>

        <Link
          href="/admin/posts/novo"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Novo post
        </Link>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
        >
          Não foi possível carregar os posts: {error.message}
        </p>
      )}

      {!error && posts.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhum post ainda. Comece pelo primeiro.
          </p>
          <Link
            href="/admin/posts/novo"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400"
          >
            Criar post
          </Link>
        </div>
      )}

      {posts.length > 0 && (
        // A tabela rola dentro do próprio contêiner: sem isto a página inteira
        // ganha rolagem horizontal no celular.
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-3xl border-collapse text-left">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr className="text-xs tracking-wide text-slate-600 uppercase dark:text-slate-300">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Título
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Categoria
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Publicado
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Atualizado
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {posts.map((post) => (
                <tr key={post.id} className="bg-white align-top dark:bg-slate-900">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-semibold text-slate-900 transition-colors hover:text-amber-600 dark:text-white dark:hover:text-amber-400"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                      /blog/{post.slug} · {post.reading_minutes} min
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <Etiqueta status={post.status} />
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {ROTULO_CATEGORIA[post.category] ?? post.category}
                  </td>

                  <td className="px-4 py-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatarDataPainel(post.published_at)}
                  </td>

                  <td className="px-4 py-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatarDataPainel(post.updated_at)}
                  </td>

                  <td className="px-4 py-3">
                    {/* DTO enxuto: o Client Component não recebe a linha crua. */}
                    <AcoesPost id={post.id} titulo={post.title} status={post.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
