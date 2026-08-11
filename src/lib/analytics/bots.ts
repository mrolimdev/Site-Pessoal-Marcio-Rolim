import 'server-only'

import { isbot, isbotMatch } from 'isbot'

/**
 * Classificação de tráfego automatizado.
 *
 * MARCAR, NUNCA DESCARTAR. `analytics_rollup` já filtra `not is_bot` na origem,
 * então o número que o painel mostra é limpo de qualquer jeito. Guardar a linha
 * marcada custa quase nada e paga em três momentos: dá para auditar o que foi
 * classificado como bot, dá para descobrir que uma heurística está derrubando
 * gente de verdade, e dá para reprocessar o rollup se a regra mudar. Descartar
 * na entrada destrói a evidência e a decisão vira irreversível.
 *
 * `bot_reason` é o registro dessa auditoria: sem ele, "is_bot = true" é um
 * veredito sem fundamentação.
 */

export type Classificacao = {
  isBot: boolean
  botReason: string | null
}

type Sinais = {
  ua: string | null
  acceptLanguage: string | null
  /** Vem do payload já validado, no formato "1920x1080". */
  screen?: string
}

/** "0x0", "0x0" com espaços, ou qualquer dimensão nula. */
function telaVazia(screen: string | undefined): boolean {
  if (!screen) return true
  const [largura, altura] = screen.split('x').map((n) => Number.parseInt(n, 10))
  return !Number.isFinite(largura) || !Number.isFinite(altura) || largura <= 0 || altura <= 0
}

export function classificar({ ua, acceptLanguage, screen }: Sinais): Classificacao {
  const motivos: string[] = []

  // 1. Lista mantida do isbot: pega quem se identifica honestamente.
  if (isbot(ua)) {
    const trecho = isbotMatch(ua)
    motivos.push(trecho ? `ua:${trecho.slice(0, 40)}` : 'ua')
  }

  // 2. Headless e scraper mal configurado. Um browser real de pessoa real
  //    sempre reporta uma tela com área, e sempre manda Accept-Language.
  if (telaVazia(screen)) motivos.push('sem-tela')
  if (!acceptLanguage) motivos.push('sem-accept-language')

  // Sem UA nenhum é sinal forte por si só: todo browser manda um.
  if (!ua) motivos.push('sem-ua')

  return {
    isBot: motivos.length > 0,
    botReason: motivos.length > 0 ? motivos.join(',').slice(0, 200) : null,
  }
}
