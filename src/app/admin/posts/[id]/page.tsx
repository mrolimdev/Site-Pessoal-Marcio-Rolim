import type { JSONContent } from '@tiptap/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PostForm, type PostDTO } from '@/components/editor/post-form'
import { requireAdmin } from '@/lib/auth/require-admin'
import type { Categoria, StatusPost } from '@/lib/blog/constantes'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Editar post',
  robots: { index: false, follow: false },
}

/** A linha como vem do `select`. Ver comentário em ../page.tsx. */
type LinhaPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content_json: JSONContent | null
  cover_url: string | null
  cover_alt: string | null
  category: Categoria
  tags: string[] | null
  status: StatusPost
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  noindex: boolean
}

// `content_html`, `content_text`, `search_tsv` e `author_id` ficam de fora de
// propósito: o formulário não os usa, e `content_html` que vai ao browser tende
// a voltar num save — que é justamente o que a derivação no servidor evita.
const CAMPOS = [
  'id',
  'slug',
  'title',
  'excerpt',
  'content_json',
  'cover_url',
  'cover_alt',
  'category',
  'tags',
  'status',
  'published_at',
  'seo_title',
  'seo_description',
  'noindex',
].join(', ')

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditarPostPage({ params }: { params: Promise<{ id: string }> }) {
  // PRIMEIRA linha, antes até de ler os params.
  await requireAdmin()

  const { id } = await params

  // Sem esta guarda, um id fora do formato faz o Postgres responder 22P02
  // ("invalid input syntax for type uuid") e a página estoura com erro 500 no
  // lugar de um 404 honesto.
  if (!REGEX_UUID.test(id)) notFound()

  const supabase = await createClient()

  const { data, error } = await supabase.from('posts').select(CAMPOS).eq('id', id).maybeSingle()

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <p
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
        >
          Não foi possível carregar este post: {error.message}
        </p>
      </div>
    )
  }

  const linha = data as LinhaPost | null
  if (!linha) notFound()

  // DTO: campo a campo, com null virando string vazia porque os inputs
  // controlados do React não aceitam null sem virar campo não-controlado.
  const post: PostDTO = {
    id: linha.id,
    slug: linha.slug,
    titulo: linha.title,
    resumo: linha.excerpt ?? '',
    conteudo: linha.content_json,
    capaUrl: linha.cover_url ?? '',
    capaAlt: linha.cover_alt ?? '',
    categoria: linha.category,
    tags: linha.tags ?? [],
    status: linha.status,
    publicadoEm: linha.published_at,
    seoTitulo: linha.seo_title ?? '',
    seoDescricao: linha.seo_description ?? '',
    noindex: linha.noindex,
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <PostForm post={post} />
    </div>
  )
}
