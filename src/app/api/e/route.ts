import { after, type NextRequest } from 'next/server'
import { eventoClienteSchema } from '@/analytics/shared'
import {
  dentroDoLimite,
  excedeuTamanho,
  extrairIp,
  gravar,
  montarPayload,
  origemValida,
} from '@/lib/analytics/ingest'

/**
 * Ingestão de analytics. Rota pública, sem autenticação, exposta à internet
 * inteira — e por isso escrita de fora para dentro: cada porteiro recusa o que
 * consegue recusar com a informação mais barata que já tem em mãos.
 *
 * A ordem não é estética. Validar o corpo com zod antes de olhar o
 * Content-Length significaria alocar e parsear o que um header já bastava para
 * rejeitar; consultar o banco antes do limite por IP significaria deixar o
 * flood escolher quantas conexões ele gasta.
 *
 * Uma resposta sempre vazia, sempre rápida: quem chama é um `sendBeacon` que
 * descarta o corpo da resposta de qualquer maneira.
 */

/** Sem cache: cada evento é um evento. */
export const dynamic = 'force-dynamic'

const VAZIO = { status: 204 } as const

export async function POST(request: NextRequest) {
  // ── 1. Tamanho, por header, antes de tocar no stream ──────────────────────
  if (excedeuTamanho(request)) return new Response(null, { status: 413 })

  // ── 1b. Content-type ──────────────────────────────────────────────────────
  // Não estava no roteiro, mas é header e custa nada. Vale por si: um POST
  // cross-site montado com <form> só consegue emitir text/plain,
  // application/x-www-form-urlencoded ou multipart. Exigir application/json
  // obriga o atacante a passar por preflight de CORS — que o browser barra.
  // É o par natural da checagem de Origin logo abaixo.
  const tipo = request.headers.get('content-type')
  if (tipo === null || !tipo.startsWith('application/json')) {
    return new Response(null, { status: 415 })
  }

  // ── 2. Origem ─────────────────────────────────────────────────────────────
  if (!origemValida(request)) return new Response(null, { status: 403 })

  // ── 3. Limite por IP (amortecedor por instância; o teto real é no banco) ──
  const ip = extrairIp(request)
  if (!dentroDoLimite(ip)) return new Response(null, { status: 429 })

  // ── 7. Validação ──────────────────────────────────────────────────────────
  // Só agora o corpo é lido: as recusas acima não precisaram dele.
  let bruto: unknown
  try {
    bruto = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }

  const analisado = eventoClienteSchema.safeParse(bruto)
  if (!analisado.success) return new Response(null, { status: 422 })

  // ── 4, 5, 6, 8. Classificação e enriquecimento ────────────────────────────
  // Bot e tráfego interno são MARCAS, não porteiros: como nada é descartado por
  // causa deles, não haveria trabalho a economizar em classificá-los antes. O
  // lugar certo é aqui, junto do resto do enriquecimento — e a heurística de
  // tela só existe depois que o zod garantiu o formato do campo.
  const payload = montarPayload({
    request,
    evento: analisado.data,
    ip,
    ua: request.headers.get('user-agent'),
  })

  // ── 9. Responder já; gravar depois ────────────────────────────────────────
  // `after()` roda o callback depois que a resposta foi entregue. O visitante
  // nunca espera o round-trip do Postgres para continuar navegando, e um banco
  // lento vira latência de gravação, não latência de página.
  after(() => gravar(payload))

  // ── 10. (dentro de gravar) supabase.rpc('analytics_ingest', { p }) ────────
  return new Response(null, VAZIO)
}
