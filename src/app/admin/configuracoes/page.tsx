import type { Metadata } from 'next'

import { requireAdmin } from '@/lib/auth/require-admin'
import { ConfiguracoesIaClient } from './configuracoes-ia-client'

export const metadata: Metadata = {
  title: 'Configurações de IA',
  robots: { index: false, follow: false },
}

export default async function ConfiguracoesPage() {
  await requireAdmin()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <ConfiguracoesIaClient />
    </div>
  )
}
