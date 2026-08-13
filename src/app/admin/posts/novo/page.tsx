import type { Metadata } from 'next'

import { PostForm } from '@/components/editor/post-form'
import { requireAdmin } from '@/lib/auth/require-admin'

/**
 * Cada passo da criação por IA cabe sozinho neste orçamento:
 *   passo 1  redigir + publicar   ~28s
 *   passo 2  gerar e aplicar capa ~55s (limitado por ORCAMENTO_CAPA_MS)
 *
 * 60 é o teto do plano Hobby da Vercel e um valor válido também no Pro — por
 * isso está aqui, e não 300: funciona nos dois sem ninguém precisar lembrar.
 * No Pro, subir para 300 aqui e ORCAMENTO_CAPA_MS para 240_000 em
 * actions/gerar-post-ia.ts faz as capas do Gemini caberem.
 */
export const maxDuration = 60


export const metadata: Metadata = {
  title: 'Novo post',
  robots: { index: false, follow: false },
}

export default async function NovoPostPage() {
  // PRIMEIRA linha, mesmo numa página que só monta um formulário: o RSC Payload
  // desta rota é servido a quem pedir a URL, e o layout não decide se ela renderiza.
  await requireAdmin()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <PostForm post={null} />
    </div>
  )
}
