import type { EntradaEvento, EventoCliente } from './shared'

/**
 * Transporte do tracker. Só isto fala com a rede.
 *
 * Nada aqui importa valor de `./shared`: aquele módulo carrega o zod, e o
 * bundle do browser não tem por que pagar por um validador que só o servidor
 * executa. Daqui saem apenas `import type`, que o TypeScript apaga na
 * compilação.
 */

/** Rota curta de propósito: nome genérico não vira regra de bloqueador. */
export const ENDPOINT = '/api/e'

/**
 * 1 pageview | 2 custom | 3 engajamento — espelha analytics_event.kind.
 *
 * Estas constantes de protocolo moram aqui, e não em `./shared`, por um motivo
 * de bundle: `shared` importa o zod, e qualquer import de VALOR vindo de lá
 * arrastaria o validador inteiro para o browser. O servidor as importa daqui
 * sem prejuízo — este módulo não toca em `window` fora do corpo das funções.
 */
export const KIND = { pageview: 1, custom: 2, engajamento: 3 } as const

/**
 * Teto de corpo, em BYTES. O servidor recusa acima disto por Content-Length,
 * antes de ler o stream.
 */
export const LIMITE_CORPO_BYTES = 4096

/**
 * Chaves de oposição do titular. Estão no inventário de cookies da política
 * (`content/policy.ts`, seção "cookies"): se um nome mudar aqui, o documento
 * publicado passa a mentir. Mude os dois juntos.
 */
export const CHAVE_IGNORAR = 'mr_analytics_ignore'
export const COOKIE_OPTOUT = 'mr_optout'

/**
 * Oposição (LGPD art. 18, §2º). Vale localStorage OU cookie: são dois lugares
 * porque limpar cookies não limpa localStorage, e vice-versa.
 *
 * O servidor repete esta checagem lendo o cookie — o cliente é conveniência
 * (poupa a requisição), não a garantia.
 */
export function optOut(): boolean {
  try {
    if (localStorage.getItem(CHAVE_IGNORAR) === 'true') return true
  } catch {
    // localStorage lança em modo privado de alguns browsers e quando o site
    // está em iframe com cookies bloqueados. Não poder ler não é oposição.
  }

  try {
    return document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${COOKIE_OPTOUT}=`))
  } catch {
    return false
  }
}

/**
 * Envia sem bloquear a navegação nem segurar a página que está sendo fechada.
 *
 * `sendBeacon` é o único caminho que o browser garante entregar depois do
 * unload. O Blob PRECISA declarar `type: 'application/json'`: sem isso o corpo
 * viaja como text/plain, e o handler recusa o content-type.
 *
 * `sendBeacon` devolve false quando a fila de beacons está cheia ou o corpo
 * excede a cota do browser. Aí cai para fetch com `keepalive`, que sobrevive ao
 * unload pelo mesmo motivo — e com `credentials: 'omit'`, porque a ingestão não
 * usa sessão para nada.
 */
export function enviar(kind: EventoCliente['kind'], entrada: EntradaEvento): void {
  if (typeof window === 'undefined') return
  if (optOut()) return

  const corpo = JSON.stringify({ kind, ...entrada })

  try {
    const blob = new Blob([corpo], { type: 'application/json' })

    // Recusa local pelo mesmo teto do servidor: um evento grande demais levaria
    // 413 de qualquer jeito, e gastar a viagem não ajuda ninguém.
    //
    // A medida vem de `blob.size`, que conta BYTES. `corpo.length` contaria
    // unidades UTF-16, e todo caractere acentuado de um título em português
    // ocupa 2 bytes em UTF-8 — a conta por length deixaria passar corpos já
    // acima do limite, que só seriam recusados do outro lado.
    if (blob.size > LIMITE_CORPO_BYTES) return

    if (navigator.sendBeacon?.(ENDPOINT, blob)) return
  } catch {
    // Alguns browsers lançam em sendBeacon sob Content-Security-Policy
    // restritiva. Segue para o fallback.
  }

  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      body: corpo,
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      credentials: 'omit',
      // Analytics nunca deve gerar ruído no console de quem visita o site.
    }).catch(() => {})
  } catch {
    // Sem rede, sem fetch, sem problema: métrica perdida não é erro de página.
  }
}
