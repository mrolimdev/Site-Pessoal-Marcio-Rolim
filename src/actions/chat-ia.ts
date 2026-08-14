'use server'

import { revalidatePath } from 'next/cache'

import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Teto por lote. Não é limitação técnica: é para que um clique errado em
 * "selecionar tudo" não varra a base inteira de uma vez.
 */
const LIMITE_LOTE = 200

export type RespostaExclusaoIa = {
  ok: boolean
  excluidos?: number
  erro?: string
}

/**
 * Exclui atendimentos de IA (sessão + todas as mensagens, por ON DELETE CASCADE).
 *
 * Usa o cliente com o JWT do admin, não a chave secreta: assim o RLS continua
 * valendo e o `requireAdmin()` daqui é a segunda tranca, não a única. Server
 * Action é um endpoint POST alcançável direto, sem passar por esta tela — os
 * ids que chegam são tratados como entrada hostil.
 */
export async function excluirAtendimentosIaAction({
  ids,
}: {
  ids: string[]
}): Promise<RespostaExclusaoIa> {
  try {
    await requireAdmin()

    if (!Array.isArray(ids)) {
      return { ok: false, erro: 'Lista de atendimentos inválida.' }
    }

    const alvos = [...new Set(ids.filter((id) => typeof id === 'string' && REGEX_UUID.test(id)))]

    if (alvos.length === 0) {
      return { ok: false, erro: 'Nenhum atendimento válido foi informado.' }
    }

    if (alvos.length > LIMITE_LOTE) {
      return {
        ok: false,
        erro: `Selecione no máximo ${LIMITE_LOTE} atendimentos por vez (foram ${alvos.length}).`,
      }
    }

    const supabase = await createClient()

    // .select() depois do delete devolve as linhas removidas — é assim que
    // sabemos quantas realmente saíram, e não quantas foram pedidas.
    const { data, error } = await supabase
      .from('chat_sessoes')
      .delete()
      .in('id', alvos)
      .select('id')

    if (error) {
      console.error('[Chat IA] Falha ao excluir atendimentos:', error)

      // 42501 = permission denied. Acontece quando a migration
      // 20260814100000_chat_ia_exclusao.sql ainda não foi aplicada no banco.
      if (error.code === '42501') {
        return {
          ok: false,
          erro: 'O banco ainda não permite exclusão. Aplique a migration 20260814100000_chat_ia_exclusao.sql.',
        }
      }

      return { ok: false, erro: 'O banco recusou a exclusão. Tente novamente.' }
    }

    const excluidos = data?.length ?? 0

    if (excluidos === 0) {
      return { ok: false, erro: 'Nenhum atendimento foi encontrado para excluir.' }
    }

    revalidatePath('/admin/ia')
    revalidatePath('/admin/analytics')
    revalidatePath('/admin')

    return { ok: true, excluidos }
  } catch (err) {
    console.error('[Chat IA] Erro inesperado ao excluir atendimentos:', err)
    return { ok: false, erro: 'Sem permissão para excluir atendimentos.' }
  }
}
