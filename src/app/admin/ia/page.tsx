import type { Metadata } from 'next'
import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth/require-admin'
import {
  carregarSessoesChatAdmin,
  carregarSessaoCompletaAdmin,
  carregarEstatisticasChatAdmin,
} from '@/lib/chat/queries'
import { IaDashboardClient } from './ia-dashboard-client'

export const metadata: Metadata = {
  title: 'Atendimentos IA | Painel de Controle',
}

export default async function IaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>
}) {
  await requireAdmin()

  const params = await searchParams
  const sessaoIdParam = typeof params.sessao === 'string' ? params.sessao : undefined

  const [sessoes, estatisticas, sessaoCompleta] = await Promise.all([
    carregarSessoesChatAdmin({ limite: 300 }),
    carregarEstatisticasChatAdmin(30),
    sessaoIdParam ? carregarSessaoCompletaAdmin(sessaoIdParam) : null,
  ])

  // Se não passou query param mas existem sessões, carrega a primeira para já abrir preenchida
  let sessaoSelecionada = sessaoCompleta
  if (!sessaoSelecionada && sessoes.length > 0) {
    sessaoSelecionada = await carregarSessaoCompletaAdmin(sessoes[0].id)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Atendimentos de Inteligência Artificial
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe, analise e depure as conversas com as IAs de Tecnologia &amp; Consultoria e
          Pastoral &amp; Fé. Clique em um indicador para filtrar a lista.
        </p>
      </header>

      <Suspense fallback={<EsqueletoAtendimentos />}>
        <IaDashboardClient
          sessoesIniciais={sessoes}
          estatisticas={estatisticas}
          sessaoSelecionadaInicial={
            sessaoSelecionada
              ? {
                  sessao: sessaoSelecionada,
                  mensagens: sessaoSelecionada.mensagens,
                }
              : null
          }
        />
      </Suspense>
    </div>
  )
}

/**
 * Esqueleto com a mesma silhueta do dashboard (barra, seis indicadores e as
 * duas colunas). Um texto solto "carregando..." fazia a página saltar de altura
 * quando os dados chegavam.
 */
function EsqueletoAtendimentos() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-hidden="true">
      <div className="h-14 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-2.5 lg:col-span-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
          ))}
        </div>
        <div className="h-[480px] rounded-2xl bg-slate-200/70 lg:col-span-7 dark:bg-slate-800/70" />
      </div>
    </div>
  )
}
