import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminNav } from './admin-nav'
import { ArrowLeftIcon } from '@/components/icons'
import { ThemeToggle } from '@/components/theme-toggle'
import { requireAdmin } from '@/lib/auth/require-admin'

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s | Painel' },
  // O painel nunca deve ser indexado, mesmo que uma URL vaze.
  robots: { index: false, follow: false },
}

/**
 * Casca do painel.
 *
 * ESTE LAYOUT NÃO LANÇA — de propósito, e a diferença é visível para o usuário.
 * Um error.tsx envolve o page, o loading e os layouts ANINHADOS do segmento,
 * mas não o layout do mesmo segmento. Se `requireAdmin()` estourasse aqui, o
 * erro passaria por cima de `admin/error.tsx` e cairia na tela 500 genérica do
 * Next, sem tema e sem explicação. Então aqui a autorização é apenas LIDA (para
 * saber que nome mostrar), e quem de fato barra o acesso é o `requireAdmin()`
 * na primeira linha de cada página — que lança dentro do boundary e produz a
 * mensagem certa, já dentro desta casca.
 *
 * Isso não afrouxa nada: nenhuma página renderiza sem a própria checagem, e o
 * proxy ainda faz o desvio otimista de quem não tem sessão.
 */
async function lerIdentidade(): Promise<{ email: string; nome: string } | null> {
  try {
    const claims = await requireAdmin()
    const email = typeof claims.email === 'string' ? claims.email : ''
    if (!email) return null
    return { email, nome: nomeAPartirDoEmail(email) }
  } catch {
    return null
  }
}

function nomeAPartirDoEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const partes = local.split(/[._-]+/).filter(Boolean)
  if (partes.length === 0) return email
  return partes.map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1)).join(' ')
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identidade = await lerIdentidade()

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white/80 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 dark:border-slate-800 dark:bg-slate-900/60">
          {/* gap em vez de space-y-*: no Tailwind 4 o space-y compila para
              margin-block-end, e o espaçamento sai do lado errado. */}
          <div className="flex h-full flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/admin"
                className="text-sm font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Painel
              </Link>
              <ThemeToggle
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
                tituloParaClaro="Ativar modo claro"
                tituloParaEscuro="Ativar modo escuro"
              />
            </div>

            <AdminNav />

            {/* mt-auto empurra o rodapé para baixo só no desktop, onde a
                sidebar ocupa a altura da tela. */}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 lg:mt-auto dark:border-slate-800">
              {identidade ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {identidade.nome}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {identidade.email}
                  </p>
                </div>
              ) : null}

              <Link
                href="/"
                className="flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Ver o site
              </Link>

              {/*
                POST, e não link. O logout derruba a sessão, então precisa ser
                um método não seguro: um GET poderia ser disparado por um <img>
                em qualquer página e deslogar o usuário sem que ele clicasse em
                nada. Como é <form>, funciona mesmo sem JavaScript.
              */}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* min-w-0: sem isso o item flex assume a largura do conteúdo e uma
            tabela larga estoura a página em vez de rolar dentro do cartão. */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
