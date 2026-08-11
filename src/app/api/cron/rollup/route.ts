import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { envServidor } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Consolidação diária: agrega `analytics_event` em `analytics_daily` e aplica a
 * retenção. Agendado em `vercel.json`.
 *
 * O painel NUNCA varre analytics_event — ele lê o rollup. É esta rota que faz a
 * diferença entre um dashboard que abre instantaneamente e um que degrada junto
 * com o volume de eventos.
 *
 * A retenção não é higiene: os prazos aqui (180 dias para eventos, 48h para o
 * salt) são os mesmos que a política publicada promete ao titular. Se esta rota
 * parar de rodar, o site passa a guardar dado além do prazo declarado — que é
 * um problema de conformidade, não de disco.
 */

export const dynamic = 'force-dynamic'

/** Rollup e retenção varrem tabelas: o default de 10s da Vercel é apertado. */
export const maxDuration = 60

/**
 * Comparação em tempo constante.
 *
 * `a === b` em string sai no primeiro byte diferente, e esse tempo vaza o
 * prefixo correto — dá para descobrir o segredo byte a byte. O sha256 antes do
 * timingSafeEqual resolve o outro lado do problema: timingSafeEqual LANÇA se os
 * buffers tiverem tamanhos diferentes, e o próprio lançar já vazaria o
 * comprimento. Hashear iguala tudo em 32 bytes.
 */
function segredoConfere(recebido: string, esperado: string): boolean {
  const a = createHash('sha256').update(recebido).digest()
  const b = createHash('sha256').update(esperado).digest()
  return timingSafeEqual(a, b)
}

export async function GET(request: NextRequest) {
  const { CRON_SECRET } = envServidor()

  const autorizacao = request.headers.get('authorization')
  if (autorizacao === null || !segredoConfere(autorizacao, `Bearer ${CRON_SECRET}`)) {
    // Sem detalhe no corpo: a resposta não ensina nada a quem está tentando.
    return new NextResponse(null, { status: 401 })
  }

  const supabase = createAdminClient()

  // Reprocessa os últimos dias inteiros em vez de acumular janelas parciais.
  // Somar count(distinct) de fatias do mesmo dia superestima visitantes; usar
  // greatest() subestima. Reprocessar é exato, e o volume torna o custo trivial.
  const { data: rollup, error: erroRollup } = await supabase.rpc('analytics_rollup', {
    p_dias: 3,
  })

  if (erroRollup) {
    console.error('[cron/rollup] analytics_rollup falhou:', erroRollup.message)
    return NextResponse.json({ ok: false, etapa: 'rollup' }, { status: 500 })
  }

  // A retenção só roda se o rollup deu certo, e nesta ordem. Apagar evento cru
  // que ainda não foi agregado perderia o dado nas duas pontas: some da tabela
  // de eventos e nunca chega em analytics_daily.
  const { data: retencao, error: erroRetencao } = await supabase.rpc('analytics_retention')

  if (erroRetencao) {
    console.error('[cron/rollup] analytics_retention falhou:', erroRetencao.message)
    return NextResponse.json({ ok: false, etapa: 'retencao', rollup }, { status: 500 })
  }

  return NextResponse.json({ ok: true, rollup, retencao })
}
