import type { Metadata } from 'next'

import { PostForm } from '@/components/editor/post-form'
import { requireAdmin } from '@/lib/auth/require-admin'

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
