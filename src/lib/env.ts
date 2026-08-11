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

const resultado = publico.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

if (!resultado.success) {
  const faltando = resultado.error.issues.map((i) => i.path.join('.')).join(', ')
  // Falhar aqui é intencional: seguir sem estas variáveis produziria um site
  // que compila e quebra em produção. A mensagem diz o que fazer, porque o
  // erro bruto do zod ("expected string, received undefined") não diz.
  throw new Error(
    `Variáveis de ambiente ausentes: ${faltando}.\n\n` +
      'Em desenvolvimento: copie env.example para .env.local e preencha.\n' +
      'Na Vercel: Project Settings > Environment Variables, marcando os três ' +
      'ambientes (Production, Preview, Development). Depois faça um novo deploy — ' +
      'variáveis novas não valem para builds já executados.',
  )
}

export const env = resultado.data

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
