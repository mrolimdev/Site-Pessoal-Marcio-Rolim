import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export class NaoAutorizado extends Error {
  constructor() {
    super('Não autenticado')
    this.name = 'NaoAutorizado'
  }
}

export class NaoPermitido extends Error {
  constructor() {
    super('Sem permissão de administrador')
    this.name = 'NaoPermitido'
  }
}

/**
 * Autorização de verdade do painel.
 *
 * Chame na PRIMEIRA LINHA de toda página, Server Action e Route Handler de
 * /admin. Não basta checar no layout, por três motivos:
 *   a) Server Actions são endpoints POST alcançáveis diretamente, sem passar
 *      pela UI que os renderiza;
 *   b) layouts não re-renderizam a cada navegação e não controlam se os
 *      segmentos filhos renderizam — eles vão para o RSC Payload de qualquer jeito;
 *   c) mover uma action de arquivo pode tirá-la da cobertura do proxy sem
 *      qualquer sinal.
 *
 * `cache()` do React deduplica a chamada dentro de uma mesma requisição, então
 * chamar em todo lugar não multiplica round-trips.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) throw new NaoAutorizado()

  // A verificação acontece no banco, via SECURITY DEFINER sobre private.admins.
  const { data: ehAdmin, error: erroRpc } = await supabase.rpc('is_admin')
  if (erroRpc || !ehAdmin) throw new NaoPermitido()

  return data.claims
})

/** Versão que não lança: para decidir o que mostrar, não para proteger. */
export async function ehAdmin(): Promise<boolean> {
  try {
    await requireAdmin()
    return true
  } catch {
    return false
  }
}
