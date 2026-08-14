import 'server-only'

import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Consultas do dashboard de analytics.
 *
 * Três decisões estruturais governam este arquivo:
 *
 * 1. LEITURA COM O JWT DO ADMIN. Usamos `lib/supabase/server`, nunca
 *    `createAdminClient()`. O RLS de analytics_daily/_event/_session exige
 *    `is_admin()`, e é ele que continua sendo a autoridade. Passar por cima do
 *    RLS "para facilitar a consulta" trocaria uma checagem no banco por uma
 *    checagem no nosso código — que é justamente a que pode ser esquecida.
 *
 * 2. O DIA CORRENTE NÃO ESTÁ NO ROLLUP. `analytics_rollup()` roda 1x/dia no
 *    plano Hobby. Quando roda, ele APAGA e reprocessa `day >= current_date - N`,
 *    então a linha de hoje que existe em analytics_daily é um retrato parcial,
 *    congelado na hora em que o cron passou. Por isso este módulo lê o rollup
 *    apenas até ONTEM e recalcula HOJE ao vivo a partir de analytics_event,
 *    unindo os dois conjuntos (o UNION ALL). Ler o rollup incluindo hoje
 *    mostraria número velho; somar o rollup de hoje com o cálculo ao vivo
 *    contaria hoje duas vezes. As duas coisas estão evitadas aqui.
 *
 * 3. "VISITANTES" É SOMA DIÁRIA, NUNCA ÚNICOS NO PERÍODO. O visitor_id nasce de
 *    um hash com salt rotacionado por dia e destruído em 48h (migration 0003).
 *    O mesmo visitante recebe um id diferente amanhã — de propósito, é o que
 *    sustenta a base legal. Somar `visitors` de vários dias dá a soma das
 *    audiências diárias, e não a contagem de pessoas distintas no mês. Não
 *    existe conta que recupere o número de únicos a partir do dado que
 *    guardamos; qualquer rótulo de "visitantes únicos no período" na UI seria
 *    mentira. O DTO carrega essa ressalva junto do número para que a tela não
 *    tenha como esquecê-la.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Período
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Presets do painel.
 *
 * `dias` é o tamanho da janela e `terminaEm` diz quantos dias atrás ela FECHA:
 * 0 fecha hoje, 1 fecha ontem. Os dois campos juntos descrevem tanto "os
 * últimos 7 dias" quanto "ontem inteiro" sem nenhum caso especial no motor de
 * consulta, que recebe apenas um intervalo de datas já resolvido.
 */
export const PRESETS_PERIODO = [
  { chave: 'hoje', rotulo: 'Hoje', dias: 1, terminaEm: 0 },
  { chave: 'ontem', rotulo: 'Ontem', dias: 1, terminaEm: 1 },
  { chave: '3dias', rotulo: '3 dias', dias: 3, terminaEm: 0 },
  { chave: '7dias', rotulo: '7 dias', dias: 7, terminaEm: 0 },
  { chave: '15dias', rotulo: '15 dias', dias: 15, terminaEm: 0 },
  { chave: '30dias', rotulo: '30 dias', dias: 30, terminaEm: 0 },
] as const

export type ChavePreset = (typeof PRESETS_PERIODO)[number]['chave']
export const PRESET_PADRAO: ChavePreset = '7dias'

/**
 * Teto do intervalo personalizado. Não é limite do banco: é o que impede um
 * `?de=1990-01-01` de varrer a tabela de eventos inteira para desenhar um
 * gráfico com dez mil pontos.
 */
export const LIMITE_DIAS_PERSONALIZADO = 366

export type Recorte = {
  chave: ChavePreset | 'personalizado'
  rotulo: string
  /** Primeiro dia da janela, YYYY-MM-DD em UTC. */
  inicio: string
  /** Último dia da janela, inclusivo. */
  fim: string
  /** Dias na janela, contando as duas pontas. */
  dias: number
  /** A janela alcança hoje e portanto inclui o dia parcial em curso. */
  incluiHoje: boolean
  /** Texto pronto do rótulo de variação. Ex.: 'vs. 7 dias anteriores'. */
  rotuloComparacao: string
}

/** Os links antigos usavam `?periodo=7`. Continuam valendo. */
const ALIAS_PRESET: Record<string, ChavePreset> = {
  '3': '3dias',
  '7': '7dias',
  '15': '15dias',
  '30': '30dias',
}

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/

/** Formato certo E data que existe: 2026-02-31 casa com o regex e não existe. */
function ehDiaValido(bruto: string | undefined): bruto is string {
  if (!bruto || !FORMATO_DIA.test(bruto)) return false
  const data = new Date(`${bruto}T00:00:00.000Z`)
  return !isNaN(data.getTime()) && data.toISOString().slice(0, 10) === bruto
}

/** Dias entre duas datas, contando as duas pontas. */
function contarDias(inicio: string, fim: string): number {
  const ms =
    new Date(`${fim}T00:00:00.000Z`).getTime() - new Date(`${inicio}T00:00:00.000Z`).getTime()
  return Math.floor(ms / 86_400_000) + 1
}

function primeiro(bruto: string | string[] | undefined): string | undefined {
  return Array.isArray(bruto) ? bruto[0] : bruto
}

function rotularComparacao(dias: number, terminaEm: number): string {
  if (dias === 1) return terminaEm === 0 ? 'vs. ontem' : 'vs. o dia anterior'
  return `vs. ${dias} dias anteriores`
}

/**
 * searchParams é entrada de usuário e vira intervalo de datas AQUI, num lugar
 * só. Nada mais no módulo decide o que é um recorte válido, então não há como
 * uma tela nova inventar uma regra de período diferente das outras.
 */
export function normalizarRecorte(params: {
  periodo?: string | string[]
  de?: string | string[]
  ate?: string | string[]
}): Recorte {
  const hoje = hojeUTC()

  const de = primeiro(params.de)
  const ate = primeiro(params.ate)

  // Intervalo explícito vence o preset: quem digitou datas quer aquelas datas.
  if (ehDiaValido(de) && ehDiaValido(ate)) {
    // Invertido, no futuro ou grande demais: corrige em vez de recusar. Uma
    // tela em branco dizendo "intervalo inválido" não ajuda quem só trocou a
    // ordem dos campos.
    let inicio = de <= ate ? de : ate
    let fim = de <= ate ? ate : de

    if (fim > hoje) fim = hoje
    if (inicio > fim) inicio = fim

    let dias = contarDias(inicio, fim)
    if (dias > LIMITE_DIAS_PERSONALIZADO) {
      inicio = deslocarDia(fim, -(LIMITE_DIAS_PERSONALIZADO - 1))
      dias = LIMITE_DIAS_PERSONALIZADO
    }

    return {
      chave: 'personalizado',
      rotulo: 'Período',
      inicio,
      fim,
      dias,
      incluiHoje: fim === hoje,
      rotuloComparacao: rotularComparacao(dias, fim === hoje ? 0 : 1),
    }
  }

  const bruto = primeiro(params.periodo)
  const chave = (bruto && ALIAS_PRESET[bruto]) || bruto
  const preset =
    PRESETS_PERIODO.find((p) => p.chave === chave) ??
    PRESETS_PERIODO.find((p) => p.chave === PRESET_PADRAO)!

  const fim = deslocarDia(hoje, -preset.terminaEm)

  return {
    chave: preset.chave,
    rotulo: preset.rotulo,
    inicio: deslocarDia(fim, -(preset.dias - 1)),
    fim,
    dias: preset.dias,
    incluiHoje: preset.terminaEm === 0,
    rotuloComparacao: rotularComparacao(preset.dias, preset.terminaEm),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Datas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tudo em UTC, sem exceção. O rollup agrupa por `e.created_at::date` e compara
 * com `current_date`, ambos avaliados no fuso da conexão — UTC no Supabase.
 * Calcular "hoje" no fuso do servidor Node desalinharia a fronteira do dia e
 * faria o recorte ao vivo de hoje sobrepor ou pular o que o rollup já gravou.
 */
function hojeUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function deslocarDia(dia: string, delta: number): string {
  const data = new Date(`${dia}T00:00:00.000Z`)
  data.setUTCDate(data.getUTCDate() + delta)
  return data.toISOString().slice(0, 10)
}

/** Lista fechada de dias, para o gráfico não omitir os dias sem tráfego. */
function listarDias(inicio: string, fim: string): string[] {
  const dias: string[] = []
  for (let dia = inicio; dia <= fim; dia = deslocarDia(dia, 1)) dias.push(dia)
  return dias
}

// ─────────────────────────────────────────────────────────────────────────────
// Formas internas (nunca cruzam para o cliente)
// ─────────────────────────────────────────────────────────────────────────────

/** Mesma forma de uma linha de public.analytics_daily. */
type LinhaRollup = {
  day: string
  dimension: string
  value: string
  pageviews: number
  events: number
  sessions: number
  bounces: number
  active_ms: number
  visitors: number
}

type SessaoEmbutida = {
  country: string | null
  device: string | null
  browser: string | null
  is_bounce: boolean | null
}

type EventoCru = {
  session_id: string
  visitor_id: string
  kind: number
  path: string | null
  referrer_domain: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  name: string | null
  duration_ms: number | null
  /**
   * Objeto OU array — as duas formas são aceitas de propósito.
   *
   * `session_id` referencia a PK de analytics_session, então é uma relação
   * muitos-para-um e o PostgREST devolve um objeto. Só que o supabase-js, sem
   * os tipos gerados do banco, não enxerga a cardinalidade e infere um array a
   * partir da string do select.
   *
   * Fixar só o objeto deixaria o compilador reclamando; fixar só o array
   * quebraria em produção de um jeito silencioso e caro: `sessao.is_bounce`
   * seria sempre undefined, a taxa de rejeição viraria 0,0% fixo e dispositivo,
   * navegador e país mostrariam "Não identificado" para todo mundo — números
   * plausíveis, todos errados, sem nenhum erro no log. Aceitar as duas formas e
   * normalizar num ponto só custa três linhas e fecha esse buraco.
   */
  analytics_session: SessaoEmbutida | SessaoEmbutida[] | null
}

function sessaoDo(evento: EventoCru): SessaoEmbutida | null {
  const embutida = evento.analytics_session
  if (!embutida) return null
  return Array.isArray(embutida) ? (embutida[0] ?? null) : embutida
}

type Totais = {
  pageviews: number
  events: number
  sessions: number
  bounces: number
  activeMs: number
  visitors: number
}

const TOTAIS_ZERO: Totais = {
  pageviews: 0,
  events: 0,
  sessions: 0,
  bounces: 0,
  activeMs: 0,
  visitors: 0,
}

/**
 * As dimensões são exatamente as do `grouping sets` do rollup. O recorte ao
 * vivo de hoje reproduz esta lista para que as duas metades da união tenham
 * rigorosamente o mesmo formato.
 */
const DIMENSOES = [
  'total',
  'path',
  'referrer',
  'country',
  'device',
  'browser',
  'utm_source',
  'event',
] as const

type Dimensao = (typeof DIMENSOES)[number]

/** Colunas de analytics_daily, na ordem em que o PostgREST as devolve. */
const COLUNAS_ROLLUP =
  'day,dimension,value,pageviews,events,sessions,bounces,active_ms,visitors'

/**
 * O `!inner` embute a sessão e permite filtrar bot e tráfego interno na origem,
 * exatamente como o rollup faz no `where`. Sem o embed, os dois lados da união
 * usariam populações diferentes e os números de hoje não fechariam com os de
 * ontem.
 */
const COLUNAS_EVENTO =
  'session_id,visitor_id,kind,path,referrer_domain,utm_source,utm_medium,utm_campaign,name,duration_ms,analytics_session!inner(country,device,browser,is_bounce)'

// ─────────────────────────────────────────────────────────────────────────────
// DTOs — o que a tela recebe
// ─────────────────────────────────────────────────────────────────────────────

export type Kpi = {
  chave: string
  rotulo: string
  /** Já formatado em pt-BR: a tela não faz conta nem formatação. */
  valor: string
  /** Fração: 0.128 = +12,8%. `null` quando o período anterior foi zero. */
  variacao: number | null
  /** Para quem "subir" é bom (pageviews) ou ruim (rejeição). */
  subirEhBom: boolean
  /** Ressalva exibida junto do número, quando ele exige uma. */
  nota?: string
}

export type PontoDiario = {
  dia: string
  rotulo: string
  pageviews: number
  visitantes: number
}

export type PontoCategoria = {
  /** Versão curta, para caber no eixo. */
  rotulo: string
  /** Versão inteira, para o tooltip e a tabela. */
  rotuloCompleto: string
  valor: number
}

export type LinhaPagina = {
  path: string
  pageviews: number
  visitantes: number
  tempoMedio: string
  rejeicao: string
}

export type LinhaCampanha = {
  origem: string
  midia: string
  campanha: string
  pageviews: number
  sessoes: number
}

export type LinhaEvento = {
  nome: string
  disparos: number
  sessoes: number
  visitantes: number
}

export type DadosAnalytics = {
  /** A janela que gerou estes números — quem pergunta, junto da resposta. */
  recorte: Recorte
  periodoAnteriorInicio: string
  periodoAnteriorFim: string
  /** Houve tráfego no período selecionado. */
  temDadosNoPeriodo: boolean
  /** O rastreio já registrou algum evento em qualquer época. */
  jaColetouAlgumDia: boolean
  /** Verdadeiro quando a lista de campanhas bateu no teto de linhas. */
  campanhasTruncadas: boolean
  kpis: Kpi[]
  serieDiaria: PontoDiario[]
  topPaginas: PontoCategoria[]
  topOrigens: PontoCategoria[]
  dispositivos: PontoCategoria[]
  navegadores: PontoCategoria[]
  paises: PontoCategoria[]
  tabelaPaginas: LinhaPagina[]
  campanhas: LinhaCampanha[]
  eventos: LinhaEvento[]
}

export type ResumoConteudo = {
  publicados: number
  rascunhos: number
  agendados: number
  total: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Paginação
// ─────────────────────────────────────────────────────────────────────────────

type RespostaLista<T> = { data: T[] | null; error: { message: string } | null }

const TAMANHO_PAGINA = 1000
const TETO_LINHAS = 50_000

/**
 * O PostgREST tem teto próprio de linhas por resposta (1000 por padrão em boa
 * parte das instalações) e não avisa quando corta. Pedir `.range(0, 9999)` e
 * confiar no tamanho devolvido silenciaria a diferença entre "acabou" e "foi
 * truncado". Aqui paginamos até a página vir incompleta, que é o único sinal
 * confiável de fim, com um teto duro para não girar sem limite.
 */
async function paginar<T>(
  buscar: (de: number, ate: number) => PromiseLike<RespostaLista<T>>,
  rotulo: string,
  teto: number = TETO_LINHAS,
): Promise<{ linhas: T[]; truncado: boolean }> {
  const linhas: T[] = []

  for (let de = 0; de < teto; de += TAMANHO_PAGINA) {
    const { data, error } = await buscar(de, de + TAMANHO_PAGINA - 1)
    if (error) throw new Error(`Falha ao consultar ${rotulo}: ${error.message}`)
    if (!data || data.length === 0) return { linhas, truncado: false }

    linhas.push(...data)
    if (data.length < TAMANHO_PAGINA) return { linhas, truncado: false }
  }

  return { linhas, truncado: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatação (feita no servidor: o DTO chega pronto na tela)
// ─────────────────────────────────────────────────────────────────────────────

const formatadorInteiro = new Intl.NumberFormat('pt-BR')

function formatarInteiro(valor: number): string {
  return formatadorInteiro.format(Math.round(valor))
}

function formatarPercentual(fracao: number): string {
  return `${(fracao * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function formatarDuracao(ms: number): string {
  const totalSegundos = Math.round(ms / 1000)
  if (totalSegundos < 60) return `${totalSegundos}s`

  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  if (minutos < 60) return `${minutos}m ${String(segundos).padStart(2, '0')}s`

  const horas = Math.floor(minutos / 60)
  return `${horas}h ${String(minutos % 60).padStart(2, '0')}m`
}

function formatarDiaCurto(dia: string): string {
  const [, mes, diaDoMes] = dia.split('-')
  return `${diaDoMes}/${mes}`
}

/** Divisão que devolve 0 em vez de NaN/Infinity quando não há denominador. */
function razao(numerador: number, denominador: number): number {
  return denominador > 0 ? numerador / denominador : 0
}

/**
 * Variação relativa. Devolve `null` — e não 0, nem 100% — quando o período
 * anterior foi zero: crescer "de 0 para 40" não tem percentual, e exibir
 * "+∞%" ou "+100%" ali seria inventar uma comparação que não existe.
 */
function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return (atual - anterior) / anterior
}

/**
 * Encurta o rótulo do eixo. O corte preserva a CAUDA porque paths se
 * distinguem no fim: '/blog/a' e '/blog/b' cortados pela frente virariam o
 * mesmo rótulo.
 *
 * O limite não é estético: o eixo Y das barras reserva 150px, e o texto que
 * passa disso é cortado pela borda do SVG (não reticenciado). 20 caracteres a
 * 12px cabem com folga. O rótulo inteiro continua no tooltip e na tabela.
 */
function encurtar(texto: string, limite: number): string {
  if (texto.length <= limite) return texto
  return `…${texto.slice(-(limite - 1))}`
}

/** Cabe nos 150px do eixo das barras horizontais. */
const LIMITE_ROTULO_EIXO = 20

const NOMES_DE_PAIS = new Intl.DisplayNames(['pt-BR'], { type: 'region' })

function nomearPais(codigo: string): string {
  if (!codigo) return 'País não identificado'
  try {
    return NOMES_DE_PAIS.of(codigo.toUpperCase()) ?? codigo
  } catch {
    // Código fora do ISO 3166-1: mostra o código cru em vez de quebrar a página.
    return codigo
  }
}

const NOMES_DE_DISPOSITIVO: Record<string, string> = {
  desktop: 'Computador',
  mobile: 'Celular',
  tablet: 'Tablet',
  unknown: 'Não identificado',
}

function nomearDispositivo(valor: string): string {
  return NOMES_DE_DISPOSITIVO[valor] ?? (valor || 'Não identificado')
}

// ─────────────────────────────────────────────────────────────────────────────
// Agregação
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reproduz, em memória, o `coalesce(...)` de cada grouping set do rollup. Cada
 * dimensão guarda '' para "sem valor" — é assim que a coluna `value` fica,
 * porque o coalesce do SQL termina em ''. Três consequências que o resto do
 * arquivo respeita: em `referrer`, '' é acesso direto; em `utm_source`, '' é
 * tráfego sem UTM; e em `event`, '' é o balde dos pageviews (que têm `name`
 * nulo) e precisa ser descartado da lista de eventos customizados.
 */
function valorDaDimensao(
  dimensao: Dimensao,
  evento: EventoCru,
  sessao: SessaoEmbutida | null,
): string {
  switch (dimensao) {
    case 'total':
      return ''
    case 'path':
      return evento.path ?? ''
    case 'referrer':
      return evento.referrer_domain ?? ''
    case 'country':
      return sessao?.country ?? ''
    case 'device':
      return sessao?.device ?? ''
    case 'browser':
      return sessao?.browser ?? ''
    case 'utm_source':
      return evento.utm_source ?? ''
    case 'event':
      return evento.name ?? ''
  }
}

/**
 * O balde carrega `dimensao` e `valor` como campos próprios, e não codificados
 * dentro da chave do Map. Concatenar e dar split depois pareceria mais curto,
 * mas valores reais contêm o separador ('Mobile Safari' em browser, 'black
 * friday' em utm_campaign) e o split devolveria 'Mobile' como navegador.
 * Guardar os campos elimina a classe de erro inteira, em vez de apostar num
 * separador improvável.
 */
type BaldeAoVivo = {
  dimensao: Dimensao
  valor: string
  pageviews: number
  events: number
  activeMs: number
  sessoes: Set<string>
  rejeicoes: Set<string>
  visitantes: Set<string>
}

/**
 * Recalcula o dia corrente com a mesma semântica do rollup: `pageviews` conta
 * kind=1, `events` conta kind=2, e sessões/rejeições/visitantes são DISTINCT
 * (daí os Set) dentro de cada fatia. Sem o distinct, um visitante com dez
 * pageviews viraria dez visitantes, e a última coluna do gráfico teria um
 * degrau falso todo dia.
 */
function consolidarHoje(eventos: EventoCru[], dia: string): LinhaRollup[] {
  const baldes = new Map<string, BaldeAoVivo>()

  for (const evento of eventos) {
    // Normaliza uma vez por evento, não uma vez por dimensão.
    const sessao = sessaoDo(evento)

    for (const dimensao of DIMENSOES) {
      const valor = valorDaDimensao(dimensao, evento, sessao)
      const chave = `${dimensao}|${valor}`

      let balde = baldes.get(chave)
      if (!balde) {
        balde = {
          dimensao,
          valor,
          pageviews: 0,
          events: 0,
          activeMs: 0,
          sessoes: new Set<string>(),
          rejeicoes: new Set<string>(),
          visitantes: new Set<string>(),
        }
        baldes.set(chave, balde)
      }

      if (evento.kind === 1) balde.pageviews += 1
      if (evento.kind === 2) balde.events += 1
      balde.activeMs += evento.duration_ms ?? 0
      balde.sessoes.add(evento.session_id)
      balde.visitantes.add(evento.visitor_id)
      if (sessao?.is_bounce) balde.rejeicoes.add(evento.session_id)
    }
  }

  return [...baldes.values()].map((balde) => ({
    day: dia,
    dimension: balde.dimensao,
    value: balde.valor,
    pageviews: balde.pageviews,
    events: balde.events,
    sessions: balde.sessoes.size,
    bounces: balde.rejeicoes.size,
    active_ms: balde.activeMs,
    visitors: balde.visitantes.size,
  }))
}

function somar(linhas: LinhaRollup[]): Totais {
  return linhas.reduce<Totais>(
    (acumulado, linha) => ({
      pageviews: acumulado.pageviews + linha.pageviews,
      events: acumulado.events + linha.events,
      sessions: acumulado.sessions + linha.sessions,
      bounces: acumulado.bounces + linha.bounces,
      activeMs: acumulado.activeMs + linha.active_ms,
      visitors: acumulado.visitors + linha.visitors,
    }),
    { ...TOTAIS_ZERO },
  )
}

/** Colapsa os dias de uma dimensão em um total por `value`. */
function agruparPorValor(linhas: LinhaRollup[], dimensao: Dimensao): Map<string, Totais> {
  const mapa = new Map<string, Totais>()

  for (const linha of linhas) {
    if (linha.dimension !== dimensao) continue

    const atual = mapa.get(linha.value) ?? TOTAIS_ZERO
    mapa.set(linha.value, {
      pageviews: atual.pageviews + linha.pageviews,
      events: atual.events + linha.events,
      sessions: atual.sessions + linha.sessions,
      bounces: atual.bounces + linha.bounces,
      activeMs: atual.activeMs + linha.active_ms,
      visitors: atual.visitors + linha.visitors,
    })
  }

  return mapa
}

function ordenarPor(
  mapa: Map<string, Totais>,
  metrica: keyof Totais,
  limite: number,
): { valor: string; totais: Totais }[] {
  return [...mapa.entries()]
    .map(([valor, totais]) => ({ valor, totais }))
    .filter((linha) => linha.totais[metrica] > 0)
    .sort((a, b) => b.totais[metrica] - a.totais[metrica])
    .slice(0, limite)
}

// ─────────────────────────────────────────────────────────────────────────────
// Consulta principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `requireAdmin()` aqui é redundante com a chamada da página — e fica de
 * propósito. É o que garante que nenhum caminho futuro (uma action nova, uma
 * rota nova) leia analytics sem passar pela autorização. O `cache()` do React
 * deduplica dentro da requisição, então o custo é zero.
 */
export async function carregarAnalytics(recorte: Recorte): Promise<DadosAnalytics> {
  await requireAdmin()
  const supabase = await createClient()

  const hoje = hojeUTC()
  const ontem = deslocarDia(hoje, -1)

  const inicioAtual = recorte.inicio
  const fimAtual = recorte.fim
  const fimAnterior = deslocarDia(inicioAtual, -1)
  const inicioAnterior = deslocarDia(inicioAtual, -recorte.dias)

  // O rollup só conhece dias FECHADOS. Antes a janela terminava sempre hoje e
  // o corte em `ontem` era constante; agora ela pode terminar no passado
  // ("ontem", um intervalo escolhido a dedo), e aí o rollup cobre a janela
  // inteira e não há nada a buscar ao vivo.
  const fimRollup = fimAtual < ontem ? fimAtual : ontem
  const precisaDoDiaCorrente = recorte.incluiHoje

  // O recorte ao vivo começa na meia-noite UTC, a mesma fronteira que
  // `created_at::date` usa dentro do rollup.
  const inicioDeHoje = `${hoje}T00:00:00.000Z`

  // Limite superior das leituras por timestamp: o dia seguinte ao fim da
  // janela, exclusivo. Sem ele, um recorte que termina no passado ainda
  // arrastaria todo o tráfego posterior para dentro das campanhas.
  const limiteSuperior = `${deslocarDia(fimAtual, 1)}T00:00:00.000Z`

  const [totaisRollup, dimensionalRollup, eventosDeHoje, campanhasCruas, existeAlgum] =
    await Promise.all([
      // Totais diários das DUAS janelas (atual + anterior), só até o último dia
      // já consolidado.
      paginar<LinhaRollup>(
        (de, ate) =>
          supabase
            .from('analytics_daily')
            .select(COLUNAS_ROLLUP)
            .eq('dimension', 'total')
            .gte('day', inicioAnterior)
            .lte('day', fimRollup)
            .order('day', { ascending: true })
            .range(de, ate),
        'analytics_daily (totais)',
      ),

      // Demais dimensões, só da janela atual.
      paginar<LinhaRollup>(
        (de, ate) =>
          supabase
            .from('analytics_daily')
            .select(COLUNAS_ROLLUP)
            .neq('dimension', 'total')
            .gte('day', inicioAtual)
            .lte('day', fimRollup)
            .range(de, ate),
        'analytics_daily (dimensões)',
      ),

      // Hoje, ao vivo, direto do evento — e só quando a janela chega até hoje.
      // Em "ontem" ou num intervalo passado, esta consulta seria puro tráfego
      // de rede para um resultado que vai ser descartado no filtro de janela.
      precisaDoDiaCorrente
        ? paginar<EventoCru>(
            (de, ate) =>
              supabase
                .from('analytics_event')
                .select(COLUNAS_EVENTO)
                .gte('created_at', inicioDeHoje)
                .eq('analytics_session.is_bot', false)
                .eq('analytics_session.is_internal', false)
                // Filtro por PATH além do filtro por sessão: `is_internal` é
                // decidido quando a sessão nasce e nunca revisto, então uma sessão
                // que começou pública e depois entrou no painel trazia /admin junto.
                .not('path', 'like', '/admin%')
                .not('path', 'like', '/auth/%')
                .range(de, ate),
            'analytics_event (dia corrente)',
          )
        : Promise.resolve({ linhas: [] as EventoCru[], truncado: false }),

      // Campanhas: o rollup guarda utm_source, mas não medium nem campaign,
      // então a granularidade de campanha só existe no evento. O filtro deixa
      // de fora o tráfego sem UTM, que é a esmagadora maioria das linhas.
      paginar<EventoCru>(
        (de, ate) =>
          supabase
            .from('analytics_event')
            .select(COLUNAS_EVENTO)
            .gte('created_at', `${inicioAtual}T00:00:00.000Z`)
            .lt('created_at', limiteSuperior)
            .or('utm_source.not.is.null,utm_campaign.not.is.null,utm_medium.not.is.null')
            .eq('analytics_session.is_bot', false)
            .eq('analytics_session.is_internal', false)
            // Filtro por PATH além do filtro por sessão: `is_internal` é
            // decidido quando a sessão nasce e nunca revisto, então uma sessão
            // que começou pública e depois entrou no painel trazia /admin junto.
            .not('path', 'like', '/admin%')
            .not('path', 'like', '/auth/%')
            .range(de, ate),
        'analytics_event (campanhas)',
        20_000,
      ),

      supabase.from('analytics_event').select('id').limit(1),
    ])

  const linhasDeHoje = consolidarHoje(eventosDeHoje.linhas, hoje)

  // ── A união ────────────────────────────────────────────────────────────────
  // Rollup (até ontem) + recorte ao vivo (hoje). Nenhum dia aparece dos dois
  // lados, porque a leitura do rollup foi cortada em `ontem`.
  const totaisDoDia = [
    ...totaisRollup.linhas,
    ...linhasDeHoje.filter((linha) => linha.dimension === 'total'),
  ]
  const dimensional = [
    ...dimensionalRollup.linhas,
    ...linhasDeHoje.filter((linha) => linha.dimension !== 'total'),
  ]

  const janelaAtual = totaisDoDia.filter(
    (linha) => linha.day >= inicioAtual && linha.day <= fimAtual,
  )
  const janelaAnterior = totaisDoDia.filter(
    (linha) => linha.day >= inicioAnterior && linha.day <= fimAnterior,
  )

  const atual = somar(janelaAtual)
  const anterior = somar(janelaAnterior)

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const duracaoAtual = razao(atual.activeMs, atual.sessions)
  const duracaoAnterior = razao(anterior.activeMs, anterior.sessions)
  const rejeicaoAtual = razao(atual.bounces, atual.sessions)
  const rejeicaoAnterior = razao(anterior.bounces, anterior.sessions)

  const kpis: Kpi[] = [
    {
      chave: 'pageviews',
      rotulo: 'Pageviews',
      valor: formatarInteiro(atual.pageviews),
      variacao: variacao(atual.pageviews, anterior.pageviews),
      subirEhBom: true,
    },
    {
      chave: 'visitantes',
      rotulo: 'Visitantes',
      valor: formatarInteiro(atual.visitors),
      variacao: variacao(atual.visitors, anterior.visitors),
      subirEhBom: true,
      nota: 'Soma das audiências diárias, não pessoas distintas no período',
    },
    {
      chave: 'sessoes',
      rotulo: 'Sessões',
      valor: formatarInteiro(atual.sessions),
      variacao: variacao(atual.sessions, anterior.sessions),
      subirEhBom: true,
    },
    {
      chave: 'duracao',
      rotulo: 'Duração média',
      valor: formatarDuracao(duracaoAtual),
      variacao: variacao(duracaoAtual, duracaoAnterior),
      subirEhBom: true,
      nota: 'Tempo ativo por sessão',
    },
    {
      chave: 'rejeicao',
      rotulo: 'Taxa de rejeição',
      valor: formatarPercentual(rejeicaoAtual),
      variacao: variacao(rejeicaoAtual, rejeicaoAnterior),
      subirEhBom: false,
      nota: 'Sessões com um único pageview',
    },
  ]

  // ── Série diária ───────────────────────────────────────────────────────────
  // Parte da lista fechada de dias: um dia sem tráfego precisa aparecer como
  // zero. Se ele simplesmente sumisse, o eixo comprimiria o calendário e dois
  // pontos vizinhos no gráfico poderiam estar a uma semana de distância.
  const porDia = new Map<string, { pageviews: number; visitantes: number }>()
  for (const linha of janelaAtual) {
    const acumulado = porDia.get(linha.day) ?? { pageviews: 0, visitantes: 0 }
    porDia.set(linha.day, {
      pageviews: acumulado.pageviews + linha.pageviews,
      visitantes: acumulado.visitantes + linha.visitors,
    })
  }

  const serieDiaria: PontoDiario[] = listarDias(inicioAtual, fimAtual).map((dia) => {
    const totais = porDia.get(dia) ?? { pageviews: 0, visitantes: 0 }
    return {
      dia,
      rotulo: formatarDiaCurto(dia),
      pageviews: totais.pageviews,
      visitantes: totais.visitantes,
    }
  })

  // ── Dimensões ──────────────────────────────────────────────────────────────
  const porPath = agruparPorValor(dimensional, 'path')
  const porOrigem = agruparPorValor(dimensional, 'referrer')
  const porDispositivo = agruparPorValor(dimensional, 'device')
  const porNavegador = agruparPorValor(dimensional, 'browser')
  const porPais = agruparPorValor(dimensional, 'country')
  const porEvento = agruparPorValor(dimensional, 'event')

  const topPaginas: PontoCategoria[] = ordenarPor(porPath, 'pageviews', 10).map(
    ({ valor, totais }) => ({
      rotulo: encurtar(valor, LIMITE_ROTULO_EIXO),
      rotuloCompleto: valor,
      valor: totais.pageviews,
    }),
  )

  const topOrigens: PontoCategoria[] = ordenarPor(porOrigem, 'pageviews', 10).map(
    ({ valor, totais }) => {
      // '' vem do coalesce do rollup e significa "sem referrer": acesso direto,
      // link colado, app. É a maior fatia da maioria dos sites e sumiria se
      // fosse tratada como lixo — fica nomeada.
      const nome = valor || 'Acesso direto'
      return {
        rotulo: encurtar(nome, LIMITE_ROTULO_EIXO),
        rotuloCompleto: nome,
        valor: totais.pageviews,
      }
    },
  )

  const dispositivos: PontoCategoria[] = ordenarPor(porDispositivo, 'sessions', 6).map(
    ({ valor, totais }) => {
      const nome = nomearDispositivo(valor)
      return { rotulo: nome, rotuloCompleto: nome, valor: totais.sessions }
    },
  )

  const navegadores: PontoCategoria[] = ordenarPor(porNavegador, 'sessions', 8).map(
    ({ valor, totais }) => {
      const nome = valor || 'Não identificado'
      return { rotulo: encurtar(nome, 14), rotuloCompleto: nome, valor: totais.sessions }
    },
  )

  const paises: PontoCategoria[] = ordenarPor(porPais, 'sessions', 8).map(({ valor, totais }) => {
    const nome = nomearPais(valor)
    return { rotulo: encurtar(nome, 14), rotuloCompleto: nome, valor: totais.sessions }
  })

  // ── Tabelas ────────────────────────────────────────────────────────────────
  const tabelaPaginas: LinhaPagina[] = ordenarPor(porPath, 'pageviews', 25).map(
    ({ valor, totais }) => ({
      path: valor,
      pageviews: totais.pageviews,
      visitantes: totais.visitors,
      tempoMedio: formatarDuracao(razao(totais.activeMs, totais.sessions)),
      rejeicao: formatarPercentual(razao(totais.bounces, totais.sessions)),
    }),
  )

  // Eventos customizados: `valor !== ''` descarta o balde dos pageviews, que
  // entram no grouping set de `name` com nome nulo e viram '' no coalesce.
  const eventos: LinhaEvento[] = ordenarPor(porEvento, 'events', 25)
    .filter(({ valor }) => valor !== '')
    .map(({ valor, totais }) => ({
      nome: valor,
      disparos: totais.events,
      sessoes: totais.sessions,
      visitantes: totais.visitors,
    }))

  const campanhas = consolidarCampanhas(campanhasCruas.linhas)

  const temDadosNoPeriodo = atual.pageviews > 0 || atual.sessions > 0 || atual.events > 0
  const jaColetouAlgumDia = (existeAlgum.data?.length ?? 0) > 0 || temDadosNoPeriodo

  return {
    recorte,
    periodoAnteriorInicio: inicioAnterior,
    periodoAnteriorFim: fimAnterior,
    temDadosNoPeriodo,
    jaColetouAlgumDia,
    campanhasTruncadas: campanhasCruas.truncado,
    kpis,
    serieDiaria,
    topPaginas,
    topOrigens,
    dispositivos,
    navegadores,
    paises,
    tabelaPaginas,
    campanhas,
    eventos,
  }
}

type BaldeCampanha = {
  origem: string
  midia: string
  campanha: string
  pageviews: number
  sessoes: Set<string>
}

/** Agrupa por (origem, mídia, campanha) — a chave real de uma campanha. */
function consolidarCampanhas(eventos: EventoCru[]): LinhaCampanha[] {
  const baldes = new Map<string, BaldeCampanha>()

  for (const evento of eventos) {
    const origem = evento.utm_source ?? '—'
    const midia = evento.utm_medium ?? '—'
    const campanha = evento.utm_campaign ?? '—'
    // JSON.stringify, e não concatenação com separador: os três valores vêm da
    // URL e são livres. Com um separador, ('a|b', 'c') e ('a', 'b|c') gerariam
    // a mesma chave e duas campanhas distintas se fundiriam numa linha só.
    const chave = JSON.stringify([origem, midia, campanha])

    let balde = baldes.get(chave)
    if (!balde) {
      balde = { origem, midia, campanha, pageviews: 0, sessoes: new Set<string>() }
      baldes.set(chave, balde)
    }

    if (evento.kind === 1) balde.pageviews += 1
    balde.sessoes.add(evento.session_id)
  }

  return [...baldes.values()]
    .map((balde) => ({
      origem: balde.origem,
      midia: balde.midia,
      campanha: balde.campanha,
      pageviews: balde.pageviews,
      sessoes: balde.sessoes.size,
    }))
    .sort((a, b) => b.sessoes - a.sessoes || b.pageviews - a.pageviews)
    .slice(0, 25)
}

// ─────────────────────────────────────────────────────────────────────────────
// Resumo de conteúdo do painel
// ─────────────────────────────────────────────────────────────────────────────

type LinhaStatus = { status: string }

/**
 * Contagem de posts por status.
 *
 * Vive neste módulo por fronteira, não por domínio: é a única consulta que o
 * painel precisa além de analytics, e mantê-la aqui evita abrir um segundo
 * módulo de queries no meio do caminho.
 *
 * NÃO devolve mais tráfego. Havia aqui um bloco de pageviews/visitantes/sessões
 * de 7 dias que a visão geral mostrava logo acima dos KPIs de analytics — dois
 * caminhos de cálculo para o mesmo número, na mesma tela, com recortes de data
 * diferentes. Dois números que deveriam bater e um dia não vão bater é pior do
 * que um número só.
 */
export async function carregarResumoConteudo(): Promise<ResumoConteudo> {
  await requireAdmin()
  const supabase = await createClient()

  const { data } = await supabase.from('posts').select('status')

  const status = (data ?? []) as LinhaStatus[]
  const contar = (alvo: string) => status.filter((linha) => linha.status === alvo).length

  return {
    publicados: contar('published'),
    rascunhos: contar('draft'),
    agendados: contar('scheduled'),
    total: status.length,
  }
}
