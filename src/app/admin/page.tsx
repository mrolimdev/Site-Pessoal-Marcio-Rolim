import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdmin } from '@/lib/auth/require-admin'
import { carregarResumoPainel } from '@/lib/analytics/queries'
import {
  BriefcaseIcon,
  ChevronRightIcon,
  DatabaseIcon,
  GlobeIcon,
} from '@/components/icons'

export const metadata: Metadata = { title: 'Visão geral' }

export default async function AdminHomePage() {
  // Primeira linha. O layout já lê a identidade, mas quem autoriza é isto:
  // uma página tem de se defender sozinha.
  await requireAdmin()

  const resumo = await carregarResumoPainel()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Visão geral
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          O essencial do site num relance.
        </p>
      </header>

      <section aria-label="Tráfego dos últimos 7 dias" className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Últimos 7 dias
        </h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero rotulo="Pageviews" valor={resumo.pageviews7d} />
          <Numero
            rotulo="Visitantes"
            valor={resumo.visitantes7d}
            nota="Soma diária, não pessoas distintas"
          />
          <Numero rotulo="Sessões" valor={resumo.sessoes7d} />
          <Numero rotulo="Posts publicados" valor={String(resumo.posts.publicados)} />
        </div>

        {!resumo.jaColetouAlgumDia ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400">
            O rastreio ainda não registrou nenhum acesso. Os números acima ficam em zero até a
            primeira visita externa — a sua navegação pelo painel não é contada.
          </p>
        ) : null}
      </section>

      <section aria-label="Conteúdo" className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Conteúdo
        </h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero rotulo="Rascunhos" valor={String(resumo.posts.rascunhos)} />
          <Numero rotulo="Agendados" valor={String(resumo.posts.agendados)} />
          <Numero rotulo="Total de posts" valor={String(resumo.posts.total)} />
        </div>
      </section>

      <section aria-label="Atalhos" className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Atalhos
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <Atalho
            href="/admin/posts"
            titulo="Posts"
            descricao="Escrever, revisar e publicar"
            Icone={BriefcaseIcon}
          />
          <Atalho
            href="/admin/analytics"
            titulo="Analytics"
            descricao="Tráfego, origens e eventos"
            Icone={DatabaseIcon}
          />
          <Atalho
            href="/"
            titulo="Ver o site"
            descricao="Abrir a home publicada"
            Icone={GlobeIcon}
          />
        </div>
      </section>
    </div>
  )
}

function Numero({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{rotulo}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{valor}</p>
      {nota ? (
        <p className="text-[11px] leading-snug text-slate-400 dark:text-slate-500">{nota}</p>
      ) : null}
    </div>
  )
}

function Atalho({
  href,
  titulo,
  descricao,
  Icone,
}: {
  href: string
  titulo: string
  descricao: string
  Icone: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Icone className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{titulo}</span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {descricao}
        </span>
      </span>

      <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-amber-500 dark:text-slate-600" />
    </Link>
  )
}
