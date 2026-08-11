import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

/** Cliente do browser. Só enxerga o que o RLS permitir ao papel do usuário. */
export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
