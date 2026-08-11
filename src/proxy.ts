import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

/**
 * Renovação de sessão do Supabase, a cada requisição.
 *
 * LOCALIZAÇÃO: este arquivo precisa ficar em `src/`, ao lado de `app/`.
 * Verificado num build real: com layout `src/`, um `proxy.ts` na RAIZ do
 * projeto NÃO é registrado — e não há erro de build, o refresh simplesmente
 * nunca roda. `middleware.ts` continua funcionando como nome legado; `proxy`
 * é o nome novo do Next 16.
 *
 * ATENÇÃO ao editar:
 * - Não insira código entre createServerClient() e getClaims().
 * - Devolva `resposta` intacta. Criar um NextResponse novo sem copiar os
 *   cookies dessincroniza browser e servidor e derruba a sessão.
 */
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          resposta = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()
  const autenticado = Boolean(data?.claims)

  const caminho = request.nextUrl.pathname

  // SÓ redirecionamos navegação de documento (GET).
  //
  // Server Actions chegam como POST para a URL da própria página — o formulário
  // de login faz POST /auth/login, e uma action do painel faz POST /admin/...
  // Responder a esses POSTs com um redirect entrega ao React um documento HTML
  // onde ele espera o formato de resposta de action, e o resultado é o erro
  // "An unexpected response was received from the server", que não diz nada a
  // quem está usando o site.
  //
  // Deixando o POST passar, quem decide é a própria action: `entrar` devolve
  // erro de credencial, e `requireAdmin()` lança, virando um erro tratável pelo
  // boundary. Isso também é coerente com o desenho: este proxy é uma checagem
  // otimista de navegação, nunca a autorização de verdade.
  const navegacao = request.method === 'GET'

  if (navegacao && caminho.startsWith('/admin') && !autenticado) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('proximo', caminho)
    return NextResponse.redirect(url)
  }

  if (navegacao && caminho === '/auth/login' && autenticado) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return resposta
}

export const config = {
  // Sem excluir os estáticos, o proxy roda para cada CSS, JS e imagem.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
