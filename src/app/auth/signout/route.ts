import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Logout como Route Handler POST — não GET: um GET de logout pode ser
 * disparado por um <img> em qualquer site e derrubar a sessão do usuário.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
