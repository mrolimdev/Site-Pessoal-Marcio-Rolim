import 'server-only'

import Bowser from 'bowser'

/**
 * Leitura do User-Agent, no servidor.
 *
 * Por que bowser e não ua-parser-js: desde a versão 2 o ua-parser-js é AGPL-3.0
 * para uso comercial, licença que se propaga para o software que o incorpora.
 * O bowser é MIT. A escolha é jurídica antes de ser técnica.
 *
 * O UA cru NUNCA é gravado: ele entra em `analytics_ingest`, é hasheado junto
 * com o salt do dia para formar o visitor_id, e é descartado. O que sobrevive é
 * só o resumo grosso desta função.
 */

/** Espelha o CHECK de analytics_session.device. */
export type Dispositivo = 'desktop' | 'mobile' | 'tablet' | 'unknown'

export type DadosUa = {
  browser: string | null
  browserVersion: string | null
  os: string | null
  device: Dispositivo
}

const DISPOSITIVOS_ACEITOS = new Set<Dispositivo>(['desktop', 'mobile', 'tablet'])

/**
 * Só a versão MAIOR do browser.
 *
 * "Chrome 141" separa gerações o suficiente para qualquer decisão de suporte.
 * "Chrome 141.0.7390.55" é um bit a mais de entropia de fingerprint por
 * visitante e nenhuma pergunta a mais respondida — minimização (LGPD art. 6º,
 * III) aplicada onde ela custa nada.
 */
function versaoMaior(versao: string | undefined): string | null {
  if (!versao) return null
  const maior = versao.split('.')[0]?.trim()
  return maior && /^\d+$/.test(maior) ? maior : null
}

function normalizarDispositivo(tipo: string | undefined): Dispositivo {
  // 'tv' e 'bot' do bowser não cabem no CHECK da coluna, e um valor fora dele
  // faria a RPC inteira falhar dentro de after(), onde ninguém veria o erro.
  return tipo !== undefined && DISPOSITIVOS_ACEITOS.has(tipo as Dispositivo)
    ? (tipo as Dispositivo)
    : 'unknown'
}

export function analisarUa(ua: string | null): DadosUa {
  if (!ua) return { browser: null, browserVersion: null, os: null, device: 'unknown' }

  try {
    const resultado = Bowser.parse(ua)

    return {
      browser: resultado.browser.name?.slice(0, 60) ?? null,
      browserVersion: versaoMaior(resultado.browser.version),
      // Nome do sistema, sem versão: a tabela nem tem coluna para a versão.
      os: resultado.os.name?.slice(0, 60) ?? null,
      device: normalizarDispositivo(resultado.platform.type),
    }
  } catch {
    // UA malformado — comum em bot e em cliente de linha de comando. Um parser
    // que lança não pode derrubar a ingestão.
    return { browser: null, browserVersion: null, os: null, device: 'unknown' }
  }
}
