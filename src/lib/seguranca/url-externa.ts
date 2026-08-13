import 'server-only'

import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Porteiro de toda requisição que o SERVIDOR faz para uma URL escolhida por
 * alguém de fora — hoje, a raspagem de artigos do gerador de posts.
 *
 * O problema que isto resolve tem nome: SSRF. Um `fetch(urlQueOUsuarioMandou)`
 * roda de DENTRO da rede da aplicação, então ele alcança o que o visitante não
 * alcança — o endpoint de metadados da nuvem (169.254.169.254, que devolve
 * credencial), serviços em localhost, e qualquer coisa em faixa privada. Como o
 * corpo da resposta volta para quem pediu, o servidor vira um leitor por
 * procuração.
 *
 * TRÊS CAMADAS, e cada uma cobre o furo da anterior:
 *
 *   1. A URL precisa ser http(s), sem usuário/senha embutidos.
 *   2. O HOSTNAME é RESOLVIDO e TODOS os IPs de resposta precisam ser públicos.
 *      Resolver é o passo que não dá para pular: `http://interno.exemplo.com`
 *      não parece perigoso até o DNS devolver 10.0.0.5. Testar o texto do host
 *      contra uma lista de nomes não protege nada.
 *   3. Redirect NÃO é seguido pelo runtime (`redirect: 'manual'`). Cada salto
 *      volta para o passo 2. Sem isso, um servidor público responde 302 para
 *      169.254.169.254 e a validação inicial não valeu nada.
 *
 * LIMITE CONHECIDO: entre a resolução do passo 2 e a conexão de fato existe uma
 * janela em que o DNS pode responder outra coisa (DNS rebinding). Fechá-la exige
 * conectar por IP com um agente customizado, que quebra SNI e verificação de
 * certificado. Para o uso aqui — um admin colando link de notícia — o custo não
 * se paga. Se um dia esta função for exposta a entrada não autenticada, esta
 * linha deixa de ser aceitável e o agente customizado passa a ser obrigatório.
 */

// ─── Faixas que nunca são destino legítimo ───────────────────────────────────

/** [base, bits do prefixo]. Fonte: IANA IPv4 Special-Purpose Address Registry. */
const FAIXAS_IPV4_BLOQUEADAS: readonly (readonly [string, number])[] = [
  ['0.0.0.0', 8], // "este host"
  ['10.0.0.0', 8], // privada
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local — é aqui que mora o metadata da nuvem
  ['172.16.0.0', 12], // privada
  ['192.0.0.0', 24], // atribuições de protocolo IETF
  ['192.0.2.0', 24], // documentação
  ['192.168.0.0', 16], // privada
  ['198.18.0.0', 15], // benchmark
  ['198.51.100.0', 24], // documentação
  ['203.0.113.0', 24], // documentação
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reservada + broadcast (255.255.255.255)
]

function ipv4ParaNumero(ip: string): number | null {
  const partes = ip.split('.')
  if (partes.length !== 4) return null

  let numero = 0
  for (const parte of partes) {
    if (!/^\d{1,3}$/.test(parte)) return null
    const octeto = Number(parte)
    if (octeto > 255) return null
    numero = numero * 256 + octeto
  }
  return numero
}

function ehIpv4Bloqueado(ip: string): boolean {
  const alvo = ipv4ParaNumero(ip)
  // Endereço que nem parseia não recebe o benefício da dúvida.
  if (alvo === null) return true

  return FAIXAS_IPV4_BLOQUEADAS.some(([base, bits]) => {
    const inicio = ipv4ParaNumero(base)
    if (inicio === null) return false
    const deslocamento = 32 - bits
    return alvo >>> deslocamento === inicio >>> deslocamento
  })
}

/** "2001:db8::1" → oito grupos de 16 bits. Null quando não é IPv6 válido. */
function expandirIpv6(ip: string): number[] | null {
  // Zone id ("fe80::1%eth0") não faz parte do endereço.
  const semZona = ip.split('%')[0]?.toLowerCase() ?? ''

  const metades = semZona.split('::')
  if (metades.length > 2) return null

  const paraGrupos = (trecho: string): number[] | null => {
    if (!trecho) return []
    const saida: number[] = []
    for (const bloco of trecho.split(':')) {
      // Forma mista "::ffff:192.168.0.1": o IPv4 final vale dois grupos.
      if (bloco.includes('.')) {
        const numero = ipv4ParaNumero(bloco)
        if (numero === null) return null
        saida.push(Math.floor(numero / 65536), numero % 65536)
        continue
      }
      if (!/^[0-9a-f]{1,4}$/.test(bloco)) return null
      saida.push(Number.parseInt(bloco, 16))
    }
    return saida
  }

  const esquerda = paraGrupos(metades[0] ?? '')
  if (esquerda === null) return null

  if (metades.length === 1) return esquerda.length === 8 ? esquerda : null

  const direita = paraGrupos(metades[1] ?? '')
  if (direita === null) return null

  const faltando = 8 - esquerda.length - direita.length
  if (faltando < 0) return null

  return [...esquerda, ...Array<number>(faltando).fill(0), ...direita]
}

function ipv4Embutido(g: number[]): string {
  return [g[6]! >> 8, g[6]! & 0xff, g[7]! >> 8, g[7]! & 0xff].join('.')
}

function ehIpv6Bloqueado(ip: string): boolean {
  const g = expandirIpv6(ip)
  if (g === null) return true

  // Endereços que carregam um IPv4 dentro: quem decide é a regra do IPv4, senão
  // ::ffff:169.254.169.254 passaria como "endereço IPv6 qualquer".
  const mapeadoV4 = g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0xffff
  const nat64 = g[0] === 0x0064 && g[1] === 0xff9b
  if (mapeadoV4 || nat64) return ehIpv4Bloqueado(ipv4Embutido(g))
  // 6to4 carrega o IPv4 nos dois grupos seguintes ao prefixo.
  if (g[0] === 0x2002) {
    return ehIpv4Bloqueado([g[1]! >> 8, g[1]! & 0xff, g[2]! >> 8, g[2]! & 0xff].join('.'))
  }

  if (g.every((grupo) => grupo === 0)) return true // ::
  if (g.slice(0, 7).every((grupo) => grupo === 0) && g[7] === 1) return true // ::1
  if ((g[0]! & 0xfe00) === 0xfc00) return true // fc00::/7 — únicas locais
  if ((g[0]! & 0xffc0) === 0xfe80) return true // fe80::/10 — link-local
  if ((g[0]! & 0xff00) === 0xff00) return true // ff00::/8 — multicast

  return false
}

function ehIpBloqueado(ip: string): boolean {
  const versao = isIP(ip)
  if (versao === 4) return ehIpv4Bloqueado(ip)
  if (versao === 6) return ehIpv6Bloqueado(ip)
  return true
}

// ─── Validação de destino ────────────────────────────────────────────────────

export type DestinoValidado =
  | { readonly ok: true; readonly url: URL }
  | { readonly ok: false; readonly motivo: string }

/**
 * As mensagens de recusa são deliberadamente vagas sobre o MOTIVO técnico: dizer
 * "esse host resolve para 10.0.0.5" transforma a função num scanner de rede
 * interna para quem estiver testando.
 */
export async function validarDestinoExterno(bruto: string): Promise<DestinoValidado> {
  let url: URL
  try {
    url = new URL(bruto)
  } catch {
    return { ok: false, motivo: 'Informe uma URL completa e válida.' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, motivo: 'Só endereços http:// ou https:// são aceitos.' }
  }

  // Credencial embutida ("https://user:senha@host") é o truque clássico para
  // fazer a URL parecer apontar para outro lugar em uma leitura rápida.
  if (url.username || url.password) {
    return { ok: false, motivo: 'URLs com usuário e senha embutidos não são aceitas.' }
  }

  // O hostname pode já ser um IP literal — aí não há o que resolver.
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(hostname)) {
    return ehIpBloqueado(hostname)
      ? { ok: false, motivo: 'Este endereço não é público e não pode ser consultado.' }
      : { ok: true, url }
  }

  let enderecos: { address: string }[]
  try {
    // `all: true` porque um host pode devolver vários registros e basta UM
    // apontar para dentro: validar só o primeiro deixa o furo aberto.
    enderecos = await lookup(hostname, { all: true })
  } catch {
    return { ok: false, motivo: 'Não foi possível resolver o endereço informado.' }
  }

  if (enderecos.length === 0) {
    return { ok: false, motivo: 'Não foi possível resolver o endereço informado.' }
  }

  if (enderecos.some(({ address }) => ehIpBloqueado(address))) {
    return { ok: false, motivo: 'Este endereço não é público e não pode ser consultado.' }
  }

  return { ok: true, url }
}

// ─── Busca ───────────────────────────────────────────────────────────────────

export type RespostaExterna =
  | { readonly ok: true; readonly corpo: string; readonly urlFinal: string }
  | { readonly ok: false; readonly motivo: string }

const MAX_REDIRECTS = 3
const MAX_BYTES_PADRAO = 2_000_000
const TIMEOUT_PADRAO_MS = 12_000

/** Lê no máximo `maxBytes` e ABANDONA o resto: um corpo de 2 GB não vira RAM. */
async function lerCorpoLimitado(resposta: Response, maxBytes: number): Promise<string> {
  const leitor = resposta.body?.getReader()
  if (!leitor) return ''

  const pedacos: Uint8Array[] = []
  let total = 0

  try {
    while (total < maxBytes) {
      const { done, value } = await leitor.read()
      if (done) break
      if (value) {
        pedacos.push(value)
        total += value.byteLength
      }
    }
  } finally {
    await leitor.cancel().catch(() => {})
  }

  const junto = new Uint8Array(total)
  let cursor = 0
  for (const pedaco of pedacos) {
    junto.set(pedaco, cursor)
    cursor += pedaco.byteLength
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(junto)
}

/**
 * `fetch` com o porteiro acima aplicado a CADA salto.
 *
 * `redirect: 'manual'` é o ponto central: o `fetch` padrão seguiria o 302
 * sozinho, por baixo, sem passar por `validarDestinoExterno` de novo — e aí a
 * validação da URL original vira teatro.
 */
export async function buscarPaginaExterna(
  bruto: string,
  {
    maxBytes = MAX_BYTES_PADRAO,
    timeoutMs = TIMEOUT_PADRAO_MS,
    headers = {},
  }: { maxBytes?: number; timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<RespostaExterna> {
  let alvo = bruto

  for (let salto = 0; salto <= MAX_REDIRECTS; salto++) {
    const validado = await validarDestinoExterno(alvo)
    if (!validado.ok) return validado

    let resposta: Response
    try {
      resposta = await fetch(validado.url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers,
        cache: 'no-store',
      })
    } catch {
      return { ok: false, motivo: 'Não foi possível acessar o endereço informado.' }
    }

    if (resposta.status >= 300 && resposta.status < 400) {
      const destino = resposta.headers.get('location')
      await resposta.body?.cancel().catch(() => {})
      if (!destino) return { ok: false, motivo: 'O endereço respondeu com um redirecionamento inválido.' }
      // Location pode ser relativo — resolver contra a URL atual é o que o
      // navegador faria, e é o que a próxima volta do laço vai revalidar.
      alvo = new URL(destino, validado.url).toString()
      continue
    }

    if (!resposta.ok) {
      await resposta.body?.cancel().catch(() => {})
      return { ok: false, motivo: `O endereço respondeu com erro ${resposta.status}.` }
    }

    // Só texto interessa para extração. Recusar por content-type evita puxar um
    // binário de vários MB para descobrir que não havia texto nenhum.
    const tipo = resposta.headers.get('content-type') ?? ''
    if (tipo && !/^(text\/|application\/(xhtml\+xml|xml|json))/i.test(tipo)) {
      await resposta.body?.cancel().catch(() => {})
      return { ok: false, motivo: 'O endereço não devolveu conteúdo de texto.' }
    }

    return {
      ok: true,
      corpo: await lerCorpoLimitado(resposta, maxBytes),
      urlFinal: validado.url.toString(),
    }
  }

  return { ok: false, motivo: 'O endereço redirecionou vezes demais.' }
}
