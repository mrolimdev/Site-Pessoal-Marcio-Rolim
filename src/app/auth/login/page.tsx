import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon } from '@/components/icons'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>
}) {
  const { proximo } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-amber-500 dark:text-slate-400"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar ao site
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Painel</h1>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Acesso restrito ao administrador do site.
          </p>

          <LoginForm proximo={proximo ?? '/admin'} />
        </div>
      </div>
    </main>
  )
}
