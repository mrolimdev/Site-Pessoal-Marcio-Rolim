import 'server-only'

import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { COOKIE_OPTOUT, LIMITE_CORPO_BYTES, ehRotaPrivada } from '@/analytics/client'
import { JANELA_LIMITE_MS, LIMITE_POR_IP, type EventoCliente } from '@/analytics/shared'
import { classificar } from './bots'
import { analisarUa } from './ua'

/**
 * Peças da ingestão. A ORDEM em que o route handler as chama é o que importa:
 * cada porteiro é mais caro que o anterior, então o tráfego lixo é recusado
 * antes de custar parsing, validação ou round-trip de banco.
 */

// ── 1. Tamanho ───────────────────────────────────────────────────────────────

/**
 * Content-Length é um header: dá para recusar antes de tocar no stream do
 * corpo. Um corpo sem Content-Length declarado também é recusado — é o formato
 * que um cliente usaria justamente para escapar deste teto.
 */
export function excedeuTamanho(request: NextRequest): boolean {
  const declarado = request.headers.get('content-length')
  if (declarado === null) return true
  const bytes = Number.parseInt(declarado, 10)
  return !Number.isFinite(bytes) || bytes > LIMITE_CORPO_BYTES
}

// ── 2. Origem ────────────────────────────────────────────────────────────────

/**
 * O endpoint só aceita o que veio das próprias páginas.
 *
 * Origin é escolhido pelo BROWSER e não pode ser forjado por JavaScript de
 * outra página — é justamente por isso que ele serve aqui, e Referer não
 * serviria. Um POST cross-site com Origin de outro domínio é recusado.
 *
 * Origin AUSENTE é aceito de propósito: nem todo cliente legítimo o envia
 * (extensões de privacidade removem, alguns webviews omitem), e barrar por
 * ausência custaria dados reais sem impedir nada — quem quer forjar simplesmente
 * omite o header. Isto é higiene contra abuso casual, não autenticação. Quem
 * garante integridade é o fato de nenhum cliente escrever direto na tabela: só
 * a função SECURITY DEFINER escreve.
 */
export function origemValida(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (origin === null) return true

  const hostProprio = hostDaRequisicao(request)
  if (hostProprio === null) return true

  try {
    return new URL(origin).host === hostProprio
  } catch {
    return false
  }
}

function hostDaRequisicao(request: NextRequest): string | null {
  // Atrás do proxy da Vercel o Host original chega em x-forwarded-host.
  return request.headers.get('x-forwarded-host') ?? request.headers.get('host')
}

// ── 3. Limite por IP ─────────────────────────────────────────────────────────

const janelas = new Map<string, { contagem: number; expiraEm: number }>()

/**
 * Amortecedor, NÃO garantia.
 *
 * Em runtime serverless cada instância tem o seu próprio Map: N instâncias
 * quentes significam até N × LIMITE_POR_IP por minuto, e uma instância fria
 * começa com o contador zerado. Isto segura o script amador que dispara em
 * série contra uma instância só — nada além disso.
 *
 * O teto que vale de verdade está no banco, onde o estado é único e
 * compartilhado: `analytics_ingest` corta em 600 eventos por sessão. Este aqui
 * existe só para o tráfego óbvio morrer antes de gastar uma conexão de banco.
 */
export function dentroDoLimite(ip: string, agora: number = Date.now()): boolean {
  const janela = janelas.get(ip)

  if (janela === undefined || janela.expiraEm <= agora) {
    janelas.set(ip, { contagem: 1, expiraEm: agora + JANELA_LIMITE_MS })
    // O Map cresce com IPs distintos e nada o esvazia sozinho. A varredura só
    // roda quando ele já está grande, para não pagar O(n) em requisição normal.
    if (janelas.size > 5_000) limparExpirados(agora)
    return true
  }

  janela.contagem += 1
  return janela.contagem <= LIMITE_POR_IP
}

function limparExpirados(agora: number) {
  for (const [chave, janela] of janelas) {
    if (janela.expiraEm <= agora) janelas.delete(chave)
  }
}

/**
 * `request.ip` e `request.geo` foram REMOVIDOS do NextRequest no Next 15: o que
 * sobrou é ler os headers que o proxy injeta. O primeiro item de
 * x-forwarded-for é o cliente; os seguintes são a cadeia de proxies.
 */
export function extrairIp(request: NextRequest): string {
  const encaminhado = request.headers.get('x-forwarded-for')
  if (encaminhado) {
    const primeiro = encaminhado.split(',')[0]?.trim()
    if (primeiro) return primeiro
  }
  return request.headers.get('x-real-ip')?.trim() || 'desconhecido'
}

// ── 6. Tráfego interno ───────────────────────────────────────────────────────

/**
 * Meu próprio tráfego não pode inflar as métricas do meu próprio site.
 * Marcado, não descartado — mesma política dos bots, e `analytics_rollup` já
 * filtra `not is_internal`.
 */
export function ehInterno(request: NextRequest, path: string): boolean {
  // Preview e desenvolvimento nunca são audiência real. Localmente VERCEL_ENV
  // não existe ou é diferente de 'production', o que cai neste mesmo ramo.
  if (process.env.VERCEL_ENV !== 'production') return true

  // Painel e autenticação. A definição é compartilhada com o tracker do
  // browser, para os dois lados nunca discordarem sobre o que é audiência.
  if (ehRotaPrivada(path)) return true

  // Bloqueio explícito para acessos via localhost ou 127.0.0.1
  const host = hostDaRequisicao(request)
  if (host && (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1'))) {
    return true
  }

  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'))
}

/** Oposição registrada no browser, relida no servidor como defesa em profundidade. */
export function temOptOut(request: NextRequest): boolean {
  return request.cookies.has(COOKIE_OPTOUT)
}

// ── 8. Enriquecimento ────────────────────────────────────────────────────────

function paisDoHeader(request: NextRequest): string | null {
  const pais = request.headers.get('x-vercel-ip-country')
  // A coluna é char(2): qualquer coisa fora disso quebraria o insert.
  return pais && /^[A-Za-z]{2}$/.test(pais) ? pais.toUpperCase() : null
}

function analisarReferrer(
  ref: string | undefined,
  hostProprio: string | null,
): { refDomain: string | null; refPath: string | null } {
  if (!ref) return { refDomain: null, refPath: null }

  try {
    const url = new URL(ref)
    // Auto-referência não é aquisição: navegar dentro do site não é "veio de".
    if (hostProprio !== null && url.host === hostProprio) {
      return { refDomain: null, refPath: null }
    }
    return {
      refDomain: url.hostname.replace(/^www\./, '').slice(0, 253),
      refPath: url.pathname.slice(0, 500),
    }
  } catch {
    return { refDomain: null, refPath: null }
  }
}

/**
 * UTM sai da query string no SERVIDOR, e não de campos separados do cliente:
 * um campo a mais no payload é um campo a mais para alguém preencher à mão.
 */
function extrairUtm(query: string | undefined) {
  const params = new URLSearchParams(query ?? '')
  const pegar = (chave: string) => params.get(chave)?.slice(0, 120) || null

  return {
    utmSource: pegar('utm_source'),
    utmMedium: pegar('utm_medium'),
    utmCampaign: pegar('utm_campaign'),
    utmContent: pegar('utm_content'),
    utmTerm: pegar('utm_term'),
  }
}

type Contexto = {
  request: NextRequest
  evento: EventoCliente
  ip: string
  ua: string | null
}

/**
 * Monta o `p` de `analytics_ingest(p jsonb)`.
 *
 * `ip` e `ua` viajam AQUI DENTRO porque a função os hasheia com o salt do dia
 * para formar o visitor_id — e os descarta. Nenhuma coluna os armazena, e é
 * essa propriedade que sustenta a base legal de legítimo interesse declarada na
 * política. Não adicione coluna que os guarde.
 */
export function montarPayload({ request, evento, ip, ua }: Contexto) {
  const hostProprio = hostDaRequisicao(request)
  const { refDomain, refPath } = analisarReferrer(evento.ref, hostProprio)
  const { isBot, botReason } = classificar({
    ua,
    acceptLanguage: request.headers.get('accept-language'),
    screen: evento.screen,
  })

  return {
    // Consumidos e destruídos dentro da função.
    ip,
    ua,

    optout: temOptOut(request),

    kind: evento.kind,
    name: evento.name ?? null,
    path: evento.path,
    query: evento.query ?? null,
    title: evento.title ?? null,

    refDomain,
    refPath,
    ...extrairUtm(evento.query),

    // Derivados de header — o cliente não tem voz nestes.
    ...analisarUa(ua),
    country: paisDoHeader(request),

    screen: evento.screen ?? null,
    viewport: evento.viewport ?? null,
    language: evento.language?.slice(0, 35) ?? null,

    isBot,
    botReason,
    isInternal: ehInterno(request, evento.path),

    durationMs: evento.durationMs ?? null,
    scrollDepth: evento.scrollDepth ?? null,
    href: evento.href ?? null,
    label: evento.label ?? null,
    props: evento.props ?? null,
  }
}

// ── 10. Escrita ──────────────────────────────────────────────────────────────

/**
 * Roda dentro de `after()`, depois da resposta já ter saído.
 *
 * `createAdminClient()` é obrigatório aqui: as tabelas de analytics não têm
 * política de INSERT para ninguém, e o único caminho de escrita é a função
 * SECURITY DEFINER. Este é um dos dois lugares do projeto onde a chave secreta
 * é legítima (o outro é o cron).
 */
export async function gravar(payload: ReturnType<typeof montarPayload>): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('analytics_ingest', { p: payload })
    // Falhar aqui não tem para quem reclamar: a resposta 204 já foi entregue.
    // O log é a única evidência de que a ingestão parou de funcionar.
    if (error) console.error('[analytics] analytics_ingest falhou:', error.message)
  } catch (erro) {
    console.error('[analytics] exceção na ingestão:', erro)
  }
}
