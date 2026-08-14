import { NextRequest, NextResponse } from 'next/server'
import { registrarCliqueWhatsAppNoBanco } from '@/lib/chat/queries'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessaoId, evento } = body as { sessaoId?: string; evento?: string }

    if (!sessaoId || !UUID_REGEX.test(sessaoId)) {
      return NextResponse.json({ erro: 'sessaoId inválido' }, { status: 400 })
    }

    if (evento === 'whatsapp_click') {
      await registrarCliqueWhatsAppNoBanco(sessaoId)
    }

    return NextResponse.json({ sucesso: true })
  } catch (err: any) {
    console.warn('[Chat Evento Error]:', err.message)
    return NextResponse.json({ erro: 'Falha ao processar evento' }, { status: 500 })
  }
}
