import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { carregarSessaoCompletaAdmin } from '@/lib/chat/queries'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ erro: 'ID da sessão é obrigatório' }, { status: 400 })
    }

    const sessaoCompleta = await carregarSessaoCompletaAdmin(id)

    if (!sessaoCompleta) {
      return NextResponse.json({ erro: 'Sessão não encontrada' }, { status: 404 })
    }

    return NextResponse.json(sessaoCompleta)
  } catch (err: any) {
    return NextResponse.json(
      { erro: err.message || 'Erro ao carregar sessão' },
      { status: 403 },
    )
  }
}
