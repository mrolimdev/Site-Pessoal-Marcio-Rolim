import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { PostsListClient, type LinhaListagem } from './posts-list-client'

export const metadata: Metadata = {
  title: 'Gestão de Posts | Admin',
  robots: { index: false, follow: false },
}

const CAMPOS =
  'id, slug, title, status, category, published_at, updated_at, reading_minutes, cover_url, cover_alt, tags'

export default async function PostsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(CAMPOS)
    .order('updated_at', { ascending: false })
    .limit(300)

  const posts = (data ?? []) as LinhaListagem[]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      {/* CABEÇALHO DA PÁGINA DE GESTÃO DE POSTS */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Gestão de Posts
            </h1>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
              {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Gerencie, pesquise, edite e publique artigos com IA no seu blog pessoal.
          </p>
        </div>

        <Link
          href="/admin/posts/novo"
          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:scale-105"
        >
          <span>✨ Criar Novo Post</span>
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-800 dark:border-rose-500/40 dark:text-rose-300"
        >
          ⚠️ Não foi possível carregar a lista de posts: {error.message}
        </div>
      )}

      {!error && <PostsListClient postsIniciais={posts} />}
    </div>
  )
}
