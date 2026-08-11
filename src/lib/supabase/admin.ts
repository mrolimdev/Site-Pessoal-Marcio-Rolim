import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { envServidor } from '@/lib/env'

/**
 * Cliente com a chave secreta. IGNORA RLS POR COMPLETO.
 *
 * `import 'server-only'` no topo faz o build FALHAR se qualquer módulo com
 * 'use client' importar este arquivo, direta ou indiretamente. É a única
 * garantia mecânica de que a chave não vaza para o browser.
 *
 * Use apenas onde não existe usuário autenticado e o servidor é a autoridade:
 * ingestão de analytics, rotas de cron, e processamento de webhook.
 * NUNCA use para "facilitar" uma consulta do painel — ali o certo é o cliente
 * com o JWT do admin, para o RLS continuar valendo.
 */
export function createAdminClient() {
  const { SUPABASE_SECRET_KEY } = envServidor()

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
