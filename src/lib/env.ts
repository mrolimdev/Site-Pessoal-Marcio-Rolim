import { z } from 'zod'

/**
 * Validação das variáveis de ambiente no boot.
 *
 * As públicas são lidas por acesso literal a `process.env.NEXT_PUBLIC_*`, e não
 * por índice dinâmico: o Next substitui essas expressões em build time, e a
 * substituição só acontece quando o nome está escrito por extenso no código.
 */
const publico = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
})

export const env = publico.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

/**
 * Segredos. Só pode ser chamada em código de servidor — quem importa isto é
 * `lib/supabase/admin.ts`, que tem `import 'server-only'`.
 */
export function envServidor() {
  return z
    .object({
      SUPABASE_SECRET_KEY: z.string().min(20),
      CRON_SECRET: z.string().min(8),
    })
    .parse({
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      CRON_SECRET: process.env.CRON_SECRET,
    })
}
