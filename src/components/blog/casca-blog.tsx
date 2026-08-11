import Link from 'next/link'

import { ArrowLeftIcon } from '@/components/icons'
import { ThemeToggle } from '@/components/theme-toggle'
import { LOGO } from '@/content/home'
import { SITE } from '@/content/site'

/**
 * Casca das três páginas do blog.
 *
 * Repete o desenho de /privacidade e do 404: mesma barra flutuante com voltar +
 * tema, mesmo fundo, mesmo rodapé. O blog não é um site à parte.
 *
 * A barra de navegação da home (`SiteNav`) não serve aqui: ela é ilha de
 * cliente com scroll e menu, e seus links são âncoras (#sobre, #servicos) que
 * não existem fora da home.
 */
export function CascaBlog({
  voltar,
  children,
}: {
  voltar: { href: string; rotulo: string }
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-5xl items-center justify-between">
        <Link
          href={voltar.href}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-600 shadow-xl backdrop-blur-xl transition-all hover:border-slate-400 hover:text-slate-900 dark:border-slate-700/50 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{voltar.rotulo}</span>
        </Link>
        <ThemeToggle />
      </div>

      {children}

      <footer className="border-t border-slate-200 px-6 py-10 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <Link href="/" className="text-lg font-bold tracking-tight">
            {LOGO.prefix}
            <span className="text-amber-600 dark:text-amber-400">{LOGO.accent}</span>
          </Link>

          <p className="text-sm text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} {SITE.name} ·{' '}
            <Link href="/privacidade" className="underline-offset-4 hover:text-amber-500 hover:underline">
              Privacidade
            </Link>{' '}
            ·{' '}
            <a
              href="/blog/rss.xml"
              className="underline-offset-4 hover:text-amber-500 hover:underline"
            >
              RSS
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

/** Cabeçalho com o mesmo gradiente e as mesmas manchas de luz de /privacidade. */
export function CabecalhoBlog({ children }: { children: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-stone-50 to-amber-50 transition-colors duration-500 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950" />
      <div
        aria-hidden="true"
        className="absolute top-10 -right-16 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-500/10"
      />

      <div className="animate-fade-in-up relative mx-auto flex max-w-5xl flex-col gap-5 px-6 pt-28 pb-14 md:pt-32 md:pb-16">
        {children}
      </div>
    </header>
  )
}
