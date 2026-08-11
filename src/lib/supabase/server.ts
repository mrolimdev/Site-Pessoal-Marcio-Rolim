import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a chave pública: quem decide o que pode ser lido é o RLS, com base no
 * JWT que viaja no cookie.
 *
 * Só `getAll`/`setAll`. A API singular get/set/remove quebra em produção porque
 * o @supabase/ssr divide o token em chunks (`sb-<ref>-auth-token.0`, `.1`, …)
 * e a API singular não enumera chunk.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Component não pode gravar cookie: o HTTP já começou a
          // streamar. Quem renova a sessão é o proxy, então ignorar aqui é
          // correto e não perde o refresh.
        }
      },
    },
  })
}
