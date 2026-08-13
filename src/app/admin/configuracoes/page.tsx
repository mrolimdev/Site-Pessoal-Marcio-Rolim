import type { Metadata } from 'next'

import { requireAdmin } from '@/lib/auth/require-admin'
import { ConfiguracoesIaClient } from './configuracoes-ia-client'

export const metadata: Metadata = {
  title: 'Configurações de IA',
  robots: { index: false, follow: false },
}

/**
 * As chaves não passam mais por aqui — só a informação de que EXISTEM.
 *
 * `process.env` só é legível neste Server Component; o booleano é a única coisa
 * que atravessa para o cliente. Antes o valor da chave descia até o navegador e
 * ficava em `localStorage`, ao alcance de qualquer XSS no painel.
 */
export default async function ConfiguracoesPage() {
  await requireAdmin()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <ConfiguracoesIaClient
        geminiConfigurada={Boolean(process.env.GEMINI_API_KEY?.trim())}
        apifyConfigurado={Boolean(
          process.env.APIFY_API_TOKEN?.trim() || process.env.APIFY_TOKEN?.trim(),
        )}
      />
    </div>
  )
}
