import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { AreaVisitas } from '@/components/charts/area-visitas'
import { BarrasHorizontais } from '@/components/charts/barras-horizontais'
import { requireAdmin } from '@/lib/auth/require-admin'
import {
  LIMITE_DIAS_PERSONALIZADO,
  PRESETS_PERIODO,
  carregarAnalytics,
  carregarResumoConteudo,
  normalizarRecorte,
  type DadosAnalytics,
  type Kpi,
  type Recorte,
} from '@/lib/analytics/queries'
import { carregarEstatisticasChatAdmin, type EstatisticasChat } from '@/lib/chat/queries'
import {
  ArrowLeftIcon,
  BotIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  CodeIcon,
  DatabaseIcon,
  ExchangeIcon,
  GlobeIcon,
  HeartIcon,
  MessageSquareIcon,
  StarIcon,
  TagIcon,
  TargetIcon,
  UserIcon,
  WhatsAppIcon,
} from '@/components/icons'

export const metadata: Metadata = { title: 'Visão geral' }

/**
 * Painel único do site.
 *
 * Aqui viviam duas telas: a "visão geral", com quatro números de 7 dias fixos,
 * e "analytics", com o recorte por período, os gráficos e as tabelas. Quem
 * queria saber como o site foi na semana tinha de ler as duas e conferir se
 * batiam — e às vezes não batiam, porque a visão geral somava 7 dias corridos
 * enquanto o analytics comparava períodos. Agora existe um recorte só, no topo,
 * e TODO número da página responde a ele: tráfego, atendimentos da IA e
 * conteúdo.
 *
 * A página em si é rápida (resolve autorização e searchParams) e a busca pesada
 * fica dentro de um <Suspense>. É o que mantém o cabeçalho e o seletor de
 * período NA TELA enquanto os dados do novo período chegam.
 */
export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>
}) {
  // Primeira linha, sempre. Checar só no layout não protege: o layout não
  // decide se o segmento filho renderiza.
  await requireAdmin()

  const parametros = await searchParams
  const recorte = normalizarRecorte(parametros)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Visão geral
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tráfego, atendimentos de IA e conteúdo no mesmo recorte de tempo. Medição própria, sem
          cookie e sem rastreio entre sites.
        </p>
      </header>

      <SeletorPeriodo recorte={recorte} />

      <Suspense fallback={<EsqueletoPainel />}>
        <ConteudoPainel recorte={recorte} />
      </Suspense>
    </div>
  )
}

/**
 * Filtro de período.
 *
 * Presets em <Link> e intervalo em <form method="get">: a troca de recorte é
 * uma navegação, não estado de cliente. Isso deixa a janela na URL —
 * recarregável, compartilhável e favoritável — e o controle inteiro funciona
 * sem uma linha de JavaScript, inclusive o campo de datas.
 */
function SeletorPeriodo({ recorte }: { recorte: Recorte }) {
  const personalizado = recorte.chave === 'personalizado'
  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <CalendarIcon className="size-4 shrink-0 text-amber-500" />
          Período
        </span>

        <div
          role="group"
          aria-label="Período de análise"
          className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80"
        >
          {PRESETS_PERIODO.map((preset) => {
            const ativo = recorte.chave === preset.chave
            return (
              <Link
                key={preset.chave}
                href={`/admin?periodo=${preset.chave}`}
                aria-current={ativo ? 'true' : undefined}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  ativo
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {preset.rotulo}
              </Link>
            )
          })}
        </div>

        {/* A janela resolvida, sempre à vista: "7 dias" e "Período" não dizem
            de quando até quando, e é isso que se confere antes de acreditar em
            um número. */}
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {formatarData(recorte.inicio)} a {formatarData(recorte.fim)} · {recorte.dias}{' '}
          {recorte.dias === 1 ? 'dia' : 'dias'}
        </span>
      </div>

      <details open={personalizado} className="group border-t border-slate-100 pt-2.5 dark:border-slate-800">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 [&::-webkit-details-marker]:hidden">
          <ChevronRightIcon className="size-3.5 shrink-0 transition-transform group-open:rotate-90" />
          {personalizado ? 'Intervalo escolhido' : 'Escolher um intervalo'}
        </summary>

        <form method="get" action="/admin" className="flex flex-wrap items-end gap-2 pt-3">
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            De
            <input
              type="date"
              name="de"
              defaultValue={recorte.inicio}
              max={hoje}
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Até
            <input
              type="date"
              name="ate"
              defaultValue={recorte.fim}
              max={hoje}
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600 active:scale-95"
          >
            Aplicar
          </button>

          {personalizado && (
            <Link
              href="/admin"
              className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Voltar aos presets
            </Link>
          )}
        </form>

        <p className="pt-2 text-[11px] text-slate-400 dark:text-slate-500">
          Datas em UTC, no máximo {LIMITE_DIAS_PERSONALIZADO} dias por consulta. Intervalo invertido
          ou no futuro é corrigido sozinho.
        </p>
      </details>
    </div>
  )
}

async function ConteudoPainel({ recorte }: { recorte: Recorte }) {
  const [dados, ia, conteudo] = await Promise.all([
    carregarAnalytics(recorte),
    // Mesma janela do tráfego: em "ontem", os dois blocos falam do mesmo ontem.
    carregarEstatisticasChatAdmin({ inicio: recorte.inicio, fim: recorte.fim }),
    carregarResumoConteudo(),
  ])

  // Sem tráfego não se desenha gráfico nenhum, mas a página NÃO para aqui: os
  // atendimentos da IA e o conteúdo do blog existem independentemente de o
  // rastreio ter registrado acesso, e some-los junto deixaria o painel em
  // branco sem motivo.
  const temTrafego = dados.temDadosNoPeriodo

  return (
    <div className="flex flex-col gap-8">
      {/* ─── Tráfego ─── */}
      <section aria-label="Tráfego do site" className="flex flex-col gap-3">
        <TituloSecao
          Icone={GlobeIcon}
          titulo="Tráfego"
          descricao={
            temTrafego
              ? `${formatarData(recorte.inicio)} a ${formatarData(recorte.fim)}${
                  recorte.incluiHoje ? '. O dia de hoje é parcial e ainda está em curso.' : '.'
                }`
              : 'Sem acessos registrados neste recorte.'
          }
        />

        {temTrafego ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {dados.kpis.map((kpi) => (
                <TileKpi key={kpi.chave} kpi={kpi} comparacao={recorte.rotuloComparacao} />
              ))}
            </div>

            <Cartao titulo="Tráfego por dia" descricao="Pageviews e visitantes, dia a dia.">
              <AreaVisitas dados={dados.serieDiaria} />
            </Cartao>
          </>
        ) : (
          <EstadoVazioTrafego dados={dados} />
        )}
      </section>

      {/* ─── Atendimentos de IA ─── */}
      <section aria-label="Atendimentos de inteligência artificial" className="flex flex-col gap-3">
        <TituloSecao
          Icone={BotIcon}
          titulo="Atendimentos de IA"
          descricao={`Conversas com as IAs de Tecnologia & Consultoria e Pastoral & Fé no mesmo recorte: ${formatarData(recorte.inicio)} a ${formatarData(recorte.fim)}.`}
          acao={
            <Link
              href="/admin/ia"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400"
            >
              Ver e depurar conversas
              <ChevronRightIcon className="size-3.5 shrink-0" />
            </Link>
          }
        />

        <BlocoIa ia={ia} />
      </section>

      {/* ─── Audiência e origem ─── */}
      {temTrafego && (
        <section aria-label="Audiência e origem do tráfego" className="flex flex-col gap-3">
          <TituloSecao
            Icone={TargetIcon}
            titulo="Audiência e origem"
            descricao="De onde vem o acesso e com o que ele é feito."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Cartao titulo="Origens do tráfego" descricao="Top 10 por pageviews">
              {dados.topOrigens.length > 0 ? (
                <BarrasHorizontais
                  dados={dados.topOrigens}
                  unidade="pageviews"
                  descricao="Dez origens que mais trouxeram pageviews no período"
                />
              ) : (
                <VazioInline />
              )}
            </Cartao>

            <Cartao titulo="País" descricao="Sessões por país de origem">
              {dados.paises.length > 0 ? (
                <BarrasHorizontais
                  dados={dados.paises}
                  unidade="sessões"
                  variante="audiencia"
                  descricao="Sessões por país"
                  larguraRotulo={110}
                />
              ) : (
                <VazioInline />
              )}
            </Cartao>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Cartao titulo="Dispositivo">
              {dados.dispositivos.length > 0 ? (
                <BarrasHorizontais
                  dados={dados.dispositivos}
                  unidade="sessões"
                  variante="audiencia"
                  descricao="Sessões por tipo de dispositivo"
                  larguraRotulo={110}
                />
              ) : (
                <VazioInline />
              )}
            </Cartao>

            <Cartao titulo="Navegador">
              {dados.navegadores.length > 0 ? (
                <BarrasHorizontais
                  dados={dados.navegadores}
                  unidade="sessões"
                  variante="audiencia"
                  descricao="Sessões por navegador"
                  larguraRotulo={110}
                />
              ) : (
                <VazioInline />
              )}
            </Cartao>
          </div>
        </section>
      )}

      {/* ─── Detalhamento ─── */}
      {temTrafego && (
        <section aria-label="Detalhamento em tabelas" className="flex flex-col gap-3">
          <TituloSecao
            Icone={DatabaseIcon}
            titulo="Detalhamento"
            descricao="Os números linha a linha, para conferir e copiar."
          />

          {/*
            A antiga tela de analytics trazia um gráfico de barras "Páginas mais
            vistas" E esta tabela, com os mesmos pageviews. Ficou só a tabela:
            ela tem tudo o que o gráfico tinha e ainda traz tempo médio e
            rejeição por página.
          */}
          <Cartao
            titulo="Páginas"
            descricao="Ordenadas por pageviews, com tempo médio e rejeição de cada uma."
          >
            {dados.tabelaPaginas.length > 0 ? (
              <RolagemHorizontal>
                <table className="w-full min-w-[34rem] text-sm">
                  <CabecalhoTabela
                    colunas={['Página', 'Pageviews', 'Visitantes', 'Tempo médio', 'Rejeição']}
                  />
                  <tbody>
                    {dados.tabelaPaginas.map((linha) => (
                      <tr key={linha.path} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="max-w-0 truncate py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">
                          {linha.path}
                        </td>
                        <NumeroCelula>{linha.pageviews}</NumeroCelula>
                        <NumeroCelula>{linha.visitantes}</NumeroCelula>
                        <TextoCelula>{linha.tempoMedio}</TextoCelula>
                        <TextoCelula>{linha.rejeicao}</TextoCelula>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </RolagemHorizontal>
            ) : (
              <VazioInline />
            )}
          </Cartao>

          <Cartao
            titulo="Campanhas UTM"
            descricao={
              dados.campanhasTruncadas
                ? 'Apenas o tráfego marcado com UTM. A lista bateu no teto de leitura e pode estar incompleta.'
                : 'Apenas o tráfego marcado com UTM.'
            }
          >
            {dados.campanhas.length > 0 ? (
              <RolagemHorizontal>
                <table className="w-full min-w-[34rem] text-sm">
                  <CabecalhoTabela colunas={['Origem', 'Mídia', 'Campanha', 'Pageviews', 'Sessões']} />
                  <tbody>
                    {dados.campanhas.map((linha) => (
                      <tr
                        // Mesma razão da chave em consolidarCampanhas: os três
                        // valores vêm da URL, então concatenar com separador pode
                        // repetir a key entre duas campanhas diferentes.
                        key={JSON.stringify([linha.origem, linha.midia, linha.campanha])}
                        className="border-t border-slate-100 dark:border-slate-800"
                      >
                        <TextoCelula alinhamento="esquerda">{linha.origem}</TextoCelula>
                        <TextoCelula alinhamento="esquerda">{linha.midia}</TextoCelula>
                        <td className="max-w-0 truncate py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">
                          {linha.campanha}
                        </td>
                        <NumeroCelula>{linha.pageviews}</NumeroCelula>
                        <NumeroCelula>{linha.sessoes}</NumeroCelula>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </RolagemHorizontal>
            ) : (
              <VazioInline mensagem="Nenhum acesso com parâmetros UTM neste período." />
            )}
          </Cartao>

          <Cartao titulo="Eventos personalizados" descricao="Cliques e ações marcadas no site.">
            {dados.eventos.length > 0 ? (
              <RolagemHorizontal>
                <table className="w-full min-w-[28rem] text-sm">
                  <CabecalhoTabela colunas={['Evento', 'Disparos', 'Sessões', 'Visitantes']} />
                  <tbody>
                    {dados.eventos.map((linha) => (
                      <tr key={linha.nome} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="max-w-0 truncate py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">
                          {linha.nome}
                        </td>
                        <NumeroCelula>{linha.disparos}</NumeroCelula>
                        <NumeroCelula>{linha.sessoes}</NumeroCelula>
                        <NumeroCelula>{linha.visitantes}</NumeroCelula>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </RolagemHorizontal>
            ) : (
              <VazioInline mensagem="Nenhum evento personalizado registrado neste período." />
            )}
          </Cartao>
        </section>
      )}

      {/* ─── Conteúdo e atalhos ─── */}
      <section aria-label="Conteúdo e atalhos" className="flex flex-col gap-3">
        <TituloSecao
          Icone={BriefcaseIcon}
          titulo="Conteúdo"
          descricao="O acervo do blog hoje — independe do período selecionado."
          acao={
            <Link
              href="/admin/posts"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Gerenciar posts
              <ChevronRightIcon className="size-3.5 shrink-0" />
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TileSimples rotulo="Publicados" valor={conteudo.publicados} Icone={GlobeIcon} />
          <TileSimples rotulo="Rascunhos" valor={conteudo.rascunhos} Icone={BriefcaseIcon} />
          <TileSimples rotulo="Agendados" valor={conteudo.agendados} Icone={ClockIcon} />
          <TileSimples rotulo="Total de posts" valor={conteudo.total} Icone={TagIcon} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Atalho
            href="/admin/posts"
            titulo="Posts"
            descricao="Escrever, revisar e publicar"
            Icone={BriefcaseIcon}
          />
          <Atalho
            href="/admin/ia"
            titulo="Atendimentos IA"
            descricao="Ler e depurar conversas"
            Icone={BotIcon}
          />
          <Atalho href="/" titulo="Ver o site" descricao="Abrir a home publicada" Icone={GlobeIcon} />
        </div>
      </section>

      {temTrafego && <NotaMetodologica dados={dados} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloco de atendimentos de IA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resumo do atendimento, não uma segunda cópia da tela de IA.
 *
 * Os números aqui respondem "houve movimento e virou contato?". O detalhe por
 * conversa, o filtro e a transcrição continuam sendo trabalho de /admin/ia — e
 * é para lá que o botão do cabeçalho leva.
 */
function BlocoIa({ ia }: { ia: EstatisticasChat }) {
  const semDados = ia.totalSessoes === 0

  const taxaLeads =
    ia.totalSessoes > 0 ? Math.round((ia.totalLeadsQualificados / ia.totalSessoes) * 100) : 0
  const mediaMsgs = ia.totalSessoes > 0 ? (ia.totalMensagens / ia.totalSessoes).toFixed(1) : '0'

  if (semDados) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <BotIcon className="mx-auto mb-3 size-9 text-slate-300 dark:text-slate-700" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Nenhuma conversa com a IA neste período
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
          O widget de chat só registra sessão quando alguém envia a primeira mensagem.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TileIa
          rotulo="Atendimentos"
          valor={ia.totalSessoes}
          detalhe={`${ia.totalMensagens} mensagens · ${mediaMsgs} por conversa`}
          Icone={MessageSquareIcon}
          tom="slate"
        />
        <TileIa
          rotulo="Leads qualificados"
          valor={ia.totalLeadsQualificados}
          sufixo={`${taxaLeads}%`}
          detalhe="Deixaram nome ou contato"
          Icone={StarIcon}
          tom="amber"
        />
        <TileIa
          rotulo="WhatsApp"
          valor={ia.conversoesWhatsApp}
          sufixo={`${ia.taxaConversaoWhatsApp}%`}
          detalhe="Saíram da conversa para o WhatsApp"
          Icone={WhatsAppIcon}
          tom="emerald"
        />
        <TileIa
          rotulo="Transferências"
          valor={ia.totalTransferencias}
          detalhe="Trocaram de persona no meio da conversa"
          Icone={ExchangeIcon}
          tom="blue"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Divisão por persona
        </h3>
        <BarraPersonas tech={ia.sessoesTech} pastoral={ia.sessoesPastoral} />
      </div>
    </div>
  )
}

/**
 * Proporção Tech × Pastoral.
 *
 * Uma barra só, com rótulo direto em cada lado — a cor não é o único canal de
 * identidade. O vão de 2px entre os segmentos é o que mantém a fronteira
 * visível para quem não separa âmbar de verde: o par foi validado (ΔE 8,9 na
 * protanopia no tema claro, 7,9 no escuro, onde os passos são um tom mais
 * fechados para caber na faixa de luminosidade do fundo escuro).
 */
function BarraPersonas({ tech, pastoral }: { tech: number; pastoral: number }) {
  const total = tech + pastoral

  if (total === 0) {
    return <p className="pt-2 text-xs text-slate-400">Sem conversas para dividir.</p>
  }

  const pctTech = Math.round((tech / total) * 100)
  const pctPastoral = 100 - pctTech

  return (
    <div className="flex flex-col gap-2.5 pt-3">
      <div
        className="flex h-2.5 gap-0.5"
        role="img"
        aria-label={`Tecnologia e IA: ${tech} conversas, ${pctTech}%. Pastoral e Fé: ${pastoral} conversas, ${pctPastoral}%.`}
      >
        {/* Segmento zerado não é renderizado: um <div> de largura 0 ainda
            deixaria o vão de 2px, e a barra de uma persona só apareceria
            recuada como se faltasse um pedaço. */}
        {pctTech > 0 && (
          <div
            className="rounded-full bg-emerald-500 dark:bg-emerald-600"
            style={{ width: `${pctTech}%` }}
          />
        )}
        {pctPastoral > 0 && (
          <div
            className="rounded-full bg-amber-500 dark:bg-amber-600"
            style={{ width: `${pctPastoral}%` }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <LegendaPersona
          cor="bg-emerald-500 dark:bg-emerald-600"
          Icone={CodeIcon}
          rotulo="Tecnologia & IA"
          valor={`${tech} · ${pctTech}%`}
        />
        <LegendaPersona
          cor="bg-amber-500 dark:bg-amber-600"
          Icone={HeartIcon}
          rotulo="Pastoral & Fé"
          valor={`${pastoral} · ${pctPastoral}%`}
        />
      </div>
    </div>
  )
}

function LegendaPersona({
  cor,
  Icone,
  rotulo,
  valor,
}: {
  cor: string
  Icone: ComponenteIcone
  rotulo: string
  valor: string
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`size-2.5 shrink-0 rounded-full ${cor}`} aria-hidden />
      <Icone className="size-3.5 shrink-0 text-slate-400" />
      <span className="text-slate-500 dark:text-slate-400">{rotulo}</span>
      {/* O valor usa tinta de texto, nunca a cor da série: a marca colorida ao
          lado já carrega a identidade. */}
      <span className="font-semibold text-slate-900 tabular-nums dark:text-white">{valor}</span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Peças da tela
// ─────────────────────────────────────────────────────────────────────────────

type ComponenteIcone = (props: { className?: string }) => React.ReactElement

function TituloSecao({
  Icone,
  titulo,
  descricao,
  acao,
}: {
  Icone: ComponenteIcone
  titulo: string
  descricao?: string
  acao?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
          <Icone className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{titulo}</h2>
          {descricao ? (
            <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{descricao}</p>
          ) : null}
        </div>
      </div>
      {acao}
    </div>
  )
}

const formatadorVariacao = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  signDisplay: 'exceptZero',
  maximumFractionDigits: 1,
})

/**
 * Ícone neutro de propósito: os cinco KPIs são a mesma família de medida, e
 * pintar cada um de uma cor sugeriria categorias que não existem.
 */
const ICONE_KPI: Record<string, ComponenteIcone> = {
  pageviews: GlobeIcon,
  visitantes: UserIcon,
  sessoes: TargetIcon,
  duracao: ClockIcon,
  rejeicao: ArrowLeftIcon,
}

function TileKpi({ kpi, comparacao }: { kpi: Kpi; comparacao: string }) {
  const Icone = ICONE_KPI[kpi.chave]
  const variacao = kpi.variacao

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        {Icone ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Icone className="size-3.5" />
          </span>
        ) : null}
        <p className="min-w-0 text-xs font-medium text-slate-500 dark:text-slate-400">
          {kpi.rotulo}
        </p>
      </div>

      {/* Sem tabular-nums: em número grande e isolado, dígitos de largura fixa
          deixam o valor visualmente frouxo. */}
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.valor}</p>

      {variacao === null ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">Sem base de comparação</p>
      ) : (
        <Variacao valor={variacao} subirEhBom={kpi.subirEhBom} comparacao={comparacao} />
      )}

      {kpi.nota ? (
        <p className="text-[11px] leading-snug text-slate-400 dark:text-slate-500">{kpi.nota}</p>
      ) : null}
    </div>
  )
}

/**
 * A seta acompanha a cor de propósito: a direção não pode depender só do verde
 * e do vermelho, que são exatamente as duas cores que um deuteranope confunde.
 */
function Variacao({
  valor,
  subirEhBom,
  comparacao,
}: {
  valor: number
  subirEhBom: boolean
  comparacao: string
}) {
  const neutro = Math.abs(valor) < 0.0005
  const bom = valor > 0 === subirEhBom

  const cor = neutro
    ? 'text-slate-400 dark:text-slate-500'
    : bom
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-600 dark:text-rose-400'

  const seta = neutro ? '→' : valor > 0 ? '↑' : '↓'

  return (
    <p className={`text-xs font-medium ${cor}`}>
      <span aria-hidden>{seta} </span>
      {formatadorVariacao.format(valor)}
      <span className="font-normal text-slate-400 dark:text-slate-500"> {comparacao}</span>
    </p>
  )
}

const TOM_TILE = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  amber: 'bg-amber-500 text-white',
  emerald: 'bg-emerald-500 text-white',
  blue: 'bg-blue-500 text-white',
} as const

function TileIa({
  rotulo,
  valor,
  sufixo,
  detalhe,
  Icone,
  tom,
}: {
  rotulo: string
  valor: number
  sufixo?: string
  detalhe: string
  Icone: ComponenteIcone
  tom: keyof typeof TOM_TILE
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${TOM_TILE[tom]}`}>
          <Icone className="size-4" />
        </span>
        {sufixo ? (
          <span className="shrink-0 text-[11px] font-bold text-slate-500 tabular-nums dark:text-slate-400">
            {sufixo}
          </span>
        ) : null}
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{valor}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">{rotulo}</p>
        <p className="mt-1 text-[11px] leading-snug text-slate-400 dark:text-slate-500">{detalhe}</p>
      </div>
    </div>
  )
}

function TileSimples({
  rotulo,
  valor,
  Icone,
}: {
  rotulo: string
  valor: number
  Icone: ComponenteIcone
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Icone className="size-3.5" />
        </span>
        <p className="min-w-0 text-xs font-medium text-slate-500 dark:text-slate-400">{rotulo}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{valor}</p>
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
  Icone: ComponenteIcone
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Icone className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{titulo}</span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {descricao}
        </span>
      </span>

      <ChevronRightIcon className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-amber-500 dark:text-slate-600" />
    </Link>
  )
}

function Cartao({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h3>
        {descricao ? (
          <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{descricao}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** Tabela larga rola dentro do próprio cartão; a página nunca rola de lado. */
function RolagemHorizontal({ children }: { children: React.ReactNode }) {
  return <div className="-mx-4 overflow-x-auto px-4">{children}</div>
}

function CabecalhoTabela({ colunas }: { colunas: string[] }) {
  return (
    <thead>
      <tr className="text-left text-xs font-medium text-slate-500 dark:text-slate-400">
        {colunas.map((coluna, indice) => (
          <th
            key={coluna}
            scope="col"
            className={`pb-2 ${indice === 0 ? 'pr-3' : 'px-3 text-right'}`}
          >
            {coluna}
          </th>
        ))}
      </tr>
    </thead>
  )
}

const formatadorInteiro = new Intl.NumberFormat('pt-BR')

/** tabular-nums aqui sim: são colunas de números que precisam alinhar. */
function NumeroCelula({ children }: { children: number }) {
  return (
    <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
      {formatadorInteiro.format(children)}
    </td>
  )
}

function TextoCelula({
  children,
  alinhamento = 'direita',
}: {
  children: string
  alinhamento?: 'esquerda' | 'direita'
}) {
  return (
    <td
      className={`px-3 py-2 text-slate-600 dark:text-slate-300 ${
        alinhamento === 'direita' ? 'text-right tabular-nums' : ''
      }`}
    >
      {children}
    </td>
  )
}

function VazioInline({ mensagem = 'Sem dados neste período.' }: { mensagem?: string }) {
  return <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">{mensagem}</p>
}

/**
 * Gráfico vazio sem explicação faz o leitor procurar defeito no próprio site.
 * Quando não há o que plotar, a tela diz por quê.
 */
function EstadoVazioTrafego({ dados }: { dados: DadosAnalytics }) {
  const nunca = !dados.jaColetouAlgumDia

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        {nunca ? 'O rastreio ainda não coletou nada' : 'Nenhum acesso neste período'}
      </h3>

      <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {nunca ? (
          <>
            Não existe nenhum evento gravado — nem hoje, nem antes. Isso é o esperado logo depois de
            publicar: o painel só mostra números quando alguém visitar uma página com o script de
            medição ativo. Acessos internos e robôs são descartados na entrada, e por isso a sua
            própria navegação pelo painel não aparece aqui.
          </>
        ) : (
          <>
            Já houve tráfego em outras datas, mas nada entre{' '}
            {formatarData(dados.recorte.inicio)} e {formatarData(dados.recorte.fim)}. Experimente um
            período maior.
          </>
        )}
      </p>

      {!nunca ? (
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {PRESETS_PERIODO.filter((preset) => preset.chave !== dados.recorte.chave).map((preset) => (
            <Link
              key={preset.chave}
              href={`/admin?periodo=${preset.chave}`}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-amber-400 hover:text-amber-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-amber-400"
            >
              {preset.rotulo}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * A ressalva sobre "visitantes" não é rodapé decorativo: sem ela, o número ao
 * lado do rótulo seria lido como pessoas distintas no mês, que é justamente o
 * que este desenho de privacidade torna impossível calcular.
 */
function NotaMetodologica({ dados }: { dados: DadosAnalytics }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
      <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        Como ler estes números
      </h2>
      <p>
        <strong className="font-semibold text-slate-700 dark:text-slate-300">Visitantes</strong> é a
        soma das audiências de cada dia, não a quantidade de pessoas distintas no período. O
        identificador de visitante vem de um hash com um segredo trocado a cada dia e destruído em
        48 horas, então o mesmo visitante recebe um identificador novo amanhã — de propósito. Quem
        entrou em três dias diferentes conta três vezes aqui, e não existe cálculo que desfaça isso
        a partir do que guardamos.
      </p>
      <p>
        Os dias anteriores vêm da consolidação diária;{' '}
        <strong className="font-semibold text-slate-700 dark:text-slate-300">
          o dia de hoje é recalculado ao vivo
        </strong>{' '}
        a cada carregamento, porque a consolidação roda uma vez por dia. Por isso hoje aparece
        parcial e pode subir ao longo do dia.
      </p>
      <p>
        Robôs e acessos internos são descartados na entrada.{' '}
        <strong className="font-semibold text-slate-700 dark:text-slate-300">Rejeição</strong> é a
        fração de sessões com um único pageview, e{' '}
        <strong className="font-semibold text-slate-700 dark:text-slate-300">duração média</strong>{' '}
        é o tempo ativo dividido pelas sessões. A comparação é sempre com uma janela de mesma
        duração colada antes desta — aqui, de {formatarData(dados.periodoAnteriorInicio)} a{' '}
        {formatarData(dados.periodoAnteriorFim)}.
      </p>
      <p>
        Os atendimentos de IA seguem o mesmo recorte de dias, mas contam sessões de conversa — não
        pageviews. Um visitante que abriu o chat aparece nas duas seções.
      </p>
    </section>
  )
}

/**
 * O esqueleto repete a GEOMETRIA da tela real. Se tivesse outra altura, tudo
 * abaixo dele pularia de posição no momento em que os dados entrassem.
 */
function EsqueletoPainel() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-busy role="status">
      <span className="sr-only">Carregando os dados do painel</span>

      <div className="flex flex-col gap-3">
        <div className="h-9 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, indice) => (
            <div
              key={indice}
              className="h-32 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
        <div className="h-80 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-9 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, indice) => (
            <div
              key={indice}
              className="h-32 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-96 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-96 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    </div>
  )
}

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

/** timeZone UTC: as datas vêm do rollup, que agrupa em UTC. */
function formatarData(dia: string): string {
  return formatadorData.format(new Date(`${dia}T12:00:00.000Z`))
}
