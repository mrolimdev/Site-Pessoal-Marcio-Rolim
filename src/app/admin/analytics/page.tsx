import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { AreaVisitas } from '@/components/charts/area-visitas'
import { BarrasHorizontais } from '@/components/charts/barras-horizontais'
import { requireAdmin } from '@/lib/auth/require-admin'
import {
  PERIODOS,
  carregarAnalytics,
  normalizarPeriodo,
  type DadosAnalytics,
  type Kpi,
  type Periodo,
} from '@/lib/analytics/queries'
import { carregarEstatisticasChatAdmin } from '@/lib/chat/queries'
import { BotIcon, WhatsAppIcon, CodeIcon, HeartIcon, ChevronRightIcon } from '@/components/icons'

export const metadata: Metadata = { title: 'Analytics' }

/**
 * Dashboard de analytics.
 *
 * A página em si é rápida (só resolve autorização e searchParams) e a busca
 * pesada fica dentro de um <Suspense>. Isso é o que mantém o cabeçalho e o
 * seletor de período NA TELA enquanto os dados do novo período chegam — se a
 * busca estivesse no corpo da página, o boundary do loading.tsx substituiria a
 * tela inteira a cada troca de período e o seletor sumiria debaixo do dedo de
 * quem acabou de clicar nele.
 */
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>
}) {
  // Primeira linha, sempre. Checar só no layout não protege: o layout não
  // decide se o segmento filho renderiza.
  await requireAdmin()

  const parametros = await searchParams
  const dias = normalizarPeriodo(parametros.periodo)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Medição própria, sem cookie e sem rastreio entre sites.
        </p>
      </header>

      {/* Um filtro só, acima de tudo o que ele afeta. Todo número e todo
          gráfico abaixo respondem a este mesmo recorte. */}
      <SeletorPeriodo atual={dias} />

      <Suspense fallback={<EsqueletoDados />}>
        <ConteudoAnalytics dias={dias} />
      </Suspense>
    </div>
  )
}

/**
 * Presets em <Link>: a troca de período é uma navegação, não estado de
 * cliente. Isso deixa o recorte na URL — recarregável, compartilhável e
 * favoritável — e dispensa qualquer JavaScript para o controle funcionar.
 */
function SeletorPeriodo({ atual }: { atual: Periodo }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Período:</span>
      <div
        role="group"
        aria-label="Período de análise"
        className="inline-flex rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900"
      >
        {PERIODOS.map((dias) => {
          const ativo = dias === atual
          return (
            <Link
              key={dias}
              href={`/admin/analytics?periodo=${dias}`}
              aria-current={ativo ? 'true' : undefined}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                ativo
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {dias} dias
            </Link>
          )
        })}
      </div>
    </div>
  )
}

async function ConteudoAnalytics({ dias }: { dias: Periodo }) {
  const [dados, dadosIa] = await Promise.all([
    carregarAnalytics(dias),
    carregarEstatisticasChatAdmin(dias),
  ])

  // Gráfico vazio sem explicação faz o leitor procurar defeito no próprio
  // site. Quando não há o que plotar, a tela diz por quê.
  if (!dados.temDadosNoPeriodo) return <EstadoVazio dados={dados} />

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Indicadores do período">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {dados.kpis.map((kpi) => (
            <TileKpi key={kpi.chave} kpi={kpi} dias={dias} />
          ))}
        </div>
      </section>

      {/* ─── Atendimentos de Inteligência Artificial & Conversão ─── */}
      <section
        aria-label="Atendimentos de IA"
        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BotIcon className="w-5 h-5 text-amber-500" />
              Atendimentos de Inteligência Artificial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Métricas de conversação das IAs nos últimos {dias} dias.
            </p>
          </div>

          <Link
            href="/admin/ia"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all self-start sm:self-auto"
          >
            Ver e depurar conversas completas
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sessões de IA
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {dadosIa.totalSessoes}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {dadosIa.totalMensagens} msgs trocadas
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CodeIcon className="w-3 h-3" /> Tech & IA
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {dadosIa.sessoesTech}
            </div>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
              Consultorias técnicas
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <HeartIcon className="w-3 h-3" /> Pastoral & Fé
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {dadosIa.sessoesPastoral}
            </div>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">
              Aconselhamentos pastorais
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <WhatsAppIcon className="w-3 h-3" /> WhatsApp
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {dadosIa.conversoesWhatsApp}
            </div>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5 block">
              {dadosIa.taxaConversaoWhatsApp}% conversão
            </span>
          </div>
        </div>
      </section>

      <Cartao
        titulo="Tráfego por dia"
        descricao={`De ${formatarData(dados.inicio)} a ${formatarData(dados.fim)}. O dia de hoje é parcial e ainda está em curso.`}
      >
        <AreaVisitas dados={dados.serieDiaria} />
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Páginas mais vistas" descricao="Top 10 por pageviews">
          {dados.topPaginas.length > 0 ? (
            <BarrasHorizontais
              dados={dados.topPaginas}
              unidade="pageviews"
              descricao="Dez páginas com mais pageviews no período"
            />
          ) : (
            <VazioInline />
          )}
        </Cartao>

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
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

        <Cartao titulo="País">
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

      <Cartao
        titulo="Páginas"
        descricao="Os mesmos números dos gráficos, em texto — e com tempo e rejeição por página."
      >
        {dados.tabelaPaginas.length > 0 ? (
          <RolagemHorizontal>
            <table className="w-full min-w-[34rem] text-sm">
              <CabecalhoTabela colunas={['Página', 'Pageviews', 'Visitantes', 'Tempo médio', 'Rejeição']} />
              <tbody>
                {dados.tabelaPaginas.map((linha) => (
                  <tr key={linha.path} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="max-w-0 truncate py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">
                      {linha.path}
                    </td>
                    <Numero>{linha.pageviews}</Numero>
                    <Numero>{linha.visitantes}</Numero>
                    <Texto>{linha.tempoMedio}</Texto>
                    <Texto>{linha.rejeicao}</Texto>
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
                    <Texto alinhamento="esquerda">{linha.origem}</Texto>
                    <Texto alinhamento="esquerda">{linha.midia}</Texto>
                    <td className="max-w-0 truncate py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">
                      {linha.campanha}
                    </td>
                    <Numero>{linha.pageviews}</Numero>
                    <Numero>{linha.sessoes}</Numero>
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
                    <Numero>{linha.disparos}</Numero>
                    <Numero>{linha.sessoes}</Numero>
                    <Numero>{linha.visitantes}</Numero>
                  </tr>
                ))}
              </tbody>
            </table>
          </RolagemHorizontal>
        ) : (
          <VazioInline mensagem="Nenhum evento personalizado registrado neste período." />
        )}
      </Cartao>

      <NotaMetodologica dados={dados} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Peças da tela
// ─────────────────────────────────────────────────────────────────────────────

const formatadorVariacao = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  signDisplay: 'exceptZero',
  maximumFractionDigits: 1,
})

function TileKpi({ kpi, dias }: { kpi: Kpi; dias: Periodo }) {
  const variacao = kpi.variacao

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.rotulo}</p>

      {/* Sem tabular-nums: em número grande e isolado, dígitos de largura fixa
          deixam o valor visualmente frouxo. */}
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.valor}</p>

      {variacao === null ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">Sem base de comparação</p>
      ) : (
        <Variacao valor={variacao} subirEhBom={kpi.subirEhBom} dias={dias} />
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
  dias,
}: {
  valor: number
  subirEhBom: boolean
  dias: Periodo
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
      <span className="font-normal text-slate-400 dark:text-slate-500">
        {' '}
        vs. {dias} dias anteriores
      </span>
    </p>
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
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h2>
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
function Numero({ children }: { children: number }) {
  return (
    <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
      {formatadorInteiro.format(children)}
    </td>
  )
}

function Texto({
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
  return (
    <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">{mensagem}</p>
  )
}

function EstadoVazio({ dados }: { dados: DadosAnalytics }) {
  const nunca = !dados.jaColetouAlgumDia

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {nunca ? 'O rastreio ainda não coletou nada' : 'Nenhum acesso neste período'}
      </h2>

      <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {nunca ? (
          <>
            Não existe nenhum evento gravado — nem hoje, nem antes. Isso é o esperado logo depois
            de publicar: o painel só mostra números quando alguém visitar uma página com o script
            de medição ativo. Acessos internos e robôs são descartados na entrada, e por isso a
            sua própria navegação pelo painel não aparece aqui.
          </>
        ) : (
          <>
            Já houve tráfego em outras datas, mas nada entre {formatarData(dados.inicio)} e{' '}
            {formatarData(dados.fim)}. Experimente um período maior.
          </>
        )}
      </p>

      {!nunca ? (
        <div className="flex justify-center gap-2 pt-1">
          {PERIODOS.filter((dias) => dias !== dados.dias).map((dias) => (
            <Link
              key={dias}
              href={`/admin/analytics?periodo=${dias}`}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-amber-400 hover:text-amber-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-amber-400"
            >
              Ver {dias} dias
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
        é o tempo ativo dividido pelas sessões. Comparação com {dados.dias} dias anteriores, de{' '}
        {formatarData(dados.periodoAnteriorInicio)} a {formatarData(dados.periodoAnteriorFim)}.
      </p>
    </section>
  )
}

function EsqueletoDados() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, indice) => (
          <div
            key={indice}
            className="h-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
      <div className="h-80 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
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
