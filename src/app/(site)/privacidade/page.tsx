import type { Metadata } from 'next'
import Link from 'next/link'
import { Fragment } from 'react'

import { ArrowLeftIcon, ChevronRightIcon, MailIcon } from '@/components/icons'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  POLICY_FOOTER_NOTE,
  POLICY_META_DESCRIPTION,
  POLICY_SECTIONS,
  POLICY_SUBTITLE,
  POLICY_SUMMARY,
  POLICY_TITLE,
  POLICY_VERSION,
  POLICY_VERSION_LABEL,
  type Bloco,
  type Paragrafo,
} from '@/content/policy'
import { CONTACT, SITE } from '@/content/site'

export const metadata: Metadata = {
  title: POLICY_TITLE,
  description: POLICY_META_DESCRIPTION,
  alternates: { canonical: '/privacidade' },
  // `index, follow` de propósito. A política antiga era noindex, o que contraria
  // o princípio do livre acesso (art. 6º, IV): o documento que explica o
  // tratamento é justamente o que precisa ser fácil de achar.
  robots: { index: true, follow: true },
}

// ─── Blocos ─────────────────────────────────────────────────────────────────

/** Renderiza um parágrafo, que é uma sequência de texto puro, links e ênfases. */
function TextoRico({ conteudo }: { conteudo: Paragrafo }) {
  return (
    <>
      {conteudo.map((trecho, i) => {
        if (typeof trecho === 'string') return <Fragment key={i}>{trecho}</Fragment>

        if ('href' in trecho) {
          const externo = trecho.href.startsWith('http')
          return (
            <a
              key={i}
              href={trecho.href}
              {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="font-medium text-amber-700 underline decoration-amber-500/40 underline-offset-4 transition-colors hover:decoration-amber-500 dark:text-amber-400"
            >
              {trecho.texto}
            </a>
          )
        }

        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {trecho.texto}
          </strong>
        )
      })}
    </>
  )
}

function BlocoConteudo({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'paragrafo':
      return (
        <p className="leading-relaxed text-slate-600 dark:text-slate-300">
          <TextoRico conteudo={bloco.conteudo} />
        </p>
      )

    case 'lista':
      return (
        <ul className="flex flex-col gap-3">
          {bloco.itens.map((item, i) => (
            <li key={i} className="flex gap-3 leading-relaxed text-slate-600 dark:text-slate-300">
              <span
                aria-hidden="true"
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
              />
              <span>
                <TextoRico conteudo={item} />
              </span>
            </li>
          ))}
        </ul>
      )

    case 'destaque':
      return (
        <aside className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-50/70 p-5 md:p-6 dark:border-amber-500/25 dark:bg-amber-500/5">
          <h3 className="text-base font-bold text-amber-900 dark:text-amber-300">{bloco.titulo}</h3>
          {bloco.conteudo.map((paragrafo, i) => (
            <p key={i} className="leading-relaxed text-slate-700 dark:text-slate-300">
              <TextoRico conteudo={paragrafo} />
            </p>
          ))}
        </aside>
      )

    case 'tabela':
      return (
        <div className="flex flex-col gap-2">
          {/* A tabela rola dentro do próprio container: numa política com 4 colunas
              de texto, encolher a fonte até caber é pior do que deixar rolar. */}
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <caption className="sr-only">{bloco.legenda}</caption>
              <thead>
                <tr className="border-b border-slate-300 dark:border-slate-700">
                  {bloco.colunas.map((coluna) => (
                    <th
                      key={coluna}
                      scope="col"
                      className="px-3 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase first:pl-0 last:pr-0 dark:text-slate-400"
                    >
                      {coluna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloco.linhas.map((linha, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-200 align-top last:border-0 dark:border-slate-800"
                  >
                    {linha.map((celula, j) => (
                      <td
                        key={j}
                        className={`px-3 py-4 leading-relaxed first:pl-0 last:pr-0 ${
                          j === 0
                            ? 'font-semibold text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {celula}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bloco.nota && (
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {bloco.nota}
            </p>
          )}
        </div>
      )
  }
}

// ─── Página ─────────────────────────────────────────────────────────────────

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100">
      {/* Barra flutuante */}
      <div className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-600 shadow-xl backdrop-blur-xl transition-all hover:border-slate-400 hover:text-slate-900 dark:border-slate-700/50 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Voltar</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Cabeçalho */}
      <header className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-stone-50 to-amber-50 transition-colors duration-500 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950" />
        <div
          aria-hidden="true"
          className="absolute top-10 -right-16 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10"
        />

        <div className="animate-fade-in-up relative mx-auto flex max-w-5xl flex-col gap-5 px-6 pt-28 pb-14 md:pt-32 md:pb-16">
          <span className="w-fit rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-700 dark:text-amber-400">
            Versão {POLICY_VERSION} · em vigor desde {POLICY_VERSION_LABEL}
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            {POLICY_TITLE}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {POLICY_SUBTITLE}
          </p>
          <a
            href={CONTACT.privacyEmailHref}
            className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-amber-500/40 hover:text-amber-700 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:text-amber-400"
          >
            <MailIcon className="h-4 w-4 text-amber-500" />
            {CONTACT.privacyEmail}
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-12">
        {/* Sumário. A ANPD pede acesso facilitado às seções — "por meio de uma
            guia, barra lateral ou sumário no início". Aqui é sumário no início
            no celular e barra lateral fixa a partir de lg. */}
        <nav
          aria-labelledby="sumario-titulo"
          className="mb-12 lg:sticky lg:top-24 lg:mb-0 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
        >
          <h2
            id="sumario-titulo"
            className="mb-4 text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500"
          >
            Sumário
          </h2>
          <ol className="flex flex-col gap-1">
            {POLICY_SUMMARY.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="group flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-white hover:text-amber-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-amber-400"
                >
                  <span className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 leading-snug font-medium">{item.titulo}</span>
                  <ChevronRightIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="flex flex-col gap-14">
          {POLICY_SECTIONS.map((secao, i) => (
            <section
              key={secao.id}
              id={secao.id}
              // scroll-mt evita que a barra flutuante cubra o título ao pular pela âncora.
              className="scroll-mt-24"
            >
              <div className="mb-5 flex flex-col gap-1 border-b border-slate-200 pb-4 dark:border-slate-800">
                <span className="font-mono text-xs text-amber-600 dark:text-amber-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{secao.titulo}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{secao.resumo}</p>
              </div>

              <div className="flex flex-col gap-5">
                {secao.blocos.map((bloco, j) => (
                  <BlocoConteudo key={j} bloco={bloco} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      <footer className="border-t border-slate-200 px-6 py-10 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{POLICY_FOOTER_NOTE}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} {SITE.name} ·{' '}
            <a
              href={CONTACT.privacyEmailHref}
              className="underline-offset-4 hover:text-amber-500 hover:underline"
            >
              {CONTACT.privacyEmail}
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
