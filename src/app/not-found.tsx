import type { Metadata } from 'next'
import Link from 'next/link'

import { ArrowLeftIcon, WhatsAppIcon } from '@/components/icons'
import { ThemeToggle } from '@/components/theme-toggle'
import { CONTACT, NOT_FOUND } from '@/content/site'

// O noindex não precisa ser declarado: o Next injeta <meta name="robots"
// content="noindex"> em toda resposta 404.
export const metadata: Metadata = {
  title: NOT_FOUND.title,
}

// Server Component: a página é estática. O único pedaço interativo é o
// ThemeToggle, que já é uma folha 'use client'.
//
// O site Vite não tinha 404: o catch-all do vercel.json devolvia a home, com
// status 200, para qualquer endereço desconhecido. Um link quebrado virava uma
// home silenciosa — o visitante não sabia que errou, e o buscador indexava
// conteúdo duplicado sob URLs inventadas. Este arquivo cobre também qualquer
// caminho sem rota, porque um not-found.tsx na raiz do app é o 404 global.
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-stone-50 text-slate-800 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100">
      {/* Mesma decoração do cabeçalho do currículo, para o 404 não parecer
          uma página de outro site. aria-hidden: é enfeite, não conteúdo. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-white via-stone-50 to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950"
      />
      <div aria-hidden className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/20" />
        <div className="absolute right-10 bottom-10 h-96 w-96 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="relative z-50 flex justify-end p-4">
        <ThemeToggle />
      </div>

      <main className="relative flex flex-1 items-center justify-center px-6 pb-24">
        <div className="animate-fade-in-up flex max-w-xl flex-col items-center gap-6 text-center">
          <p className="bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text font-mono text-7xl font-extrabold tracking-tight text-transparent sm:text-8xl">
            {NOT_FOUND.code}
          </p>

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {NOT_FOUND.title}
            </h1>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {NOT_FOUND.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {NOT_FOUND.homeLabel}
            </Link>

            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="contato_click"
              className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600 backdrop-blur-xl transition-all hover:border-emerald-500/40 hover:text-emerald-600 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {NOT_FOUND.contactLabel}
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
