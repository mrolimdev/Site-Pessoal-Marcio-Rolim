import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'

export interface ChatSessaoRow {
  id: string
  modo_inicial: 'tech' | 'pastoral'
  modo_atual: 'tech' | 'pastoral'
  total_mensagens: number
  clicou_whatsapp: boolean
  houve_transferencia: boolean
  nome_lead?: string | null
  contato_lead?: string | null
  resumo_conversa?: string | null
  qualificado: boolean
  user_agent?: string | null
  created_at: string
  updated_at: string
}

export interface ChatMensagemRow {
  id: string
  sessao_id: string
  role: 'user' | 'assistant' | 'system'
  modo: 'tech' | 'pastoral'
  content: string
  modelo_usado?: string | null
  created_at: string
}

export interface SessaoComMensagens extends ChatSessaoRow {
  mensagens: ChatMensagemRow[]
}

export interface EstatisticasChat {
  totalSessoes: number
  totalMensagens: number
  sessoesTech: number
  sessoesPastoral: number
  conversoesWhatsApp: number
  taxaConversaoWhatsApp: number
  totalTransferencias: number
  totalLeadsQualificados: number
}

/**
 * Registra ou atualiza uma sessão e insere uma mensagem no banco (via chave secreta admin).
 * Projetado para não quebrar a API do chat mesmo se a migration ainda não tiver sido aplicada.
 */
export async function salvarMensagemChatNoBanco({
  sessaoId,
  modoInicial,
  modoAtual,
  role,
  content,
  modeloUsado,
  userAgent,
  houveTransferencia = false,
}: {
  sessaoId: string
  modoInicial: 'tech' | 'pastoral'
  modoAtual: 'tech' | 'pastoral'
  role: 'user' | 'assistant'
  content: string
  modeloUsado?: string
  userAgent?: string
  houveTransferencia?: boolean
}) {
  try {
    const supabase = createAdminClient()

    // 1. Garante que a sessão existe (Upsert)
    const { error: sessaoErr } = await supabase.from('chat_sessoes').upsert(
      {
        id: sessaoId,
        modo_inicial: modoInicial,
        modo_atual: modoAtual,
        user_agent: userAgent?.slice(0, 500),
        houve_transferencia: houveTransferencia,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false },
    )

    if (sessaoErr) {
      console.warn('[Chat DB] Aviso ao upsert de sessão:', sessaoErr.message)
      return
    }

    // 2. Insere a mensagem
    const { error: msgErr } = await supabase.from('chat_mensagens').insert({
      sessao_id: sessaoId,
      role,
      modo: modoAtual,
      content,
      modelo_usado: modeloUsado || null,
    })

    if (msgErr) {
      console.warn('[Chat DB] Aviso ao inserir mensagem:', msgErr.message)
      return
    }

    // 3. Atualiza o contador de mensagens na sessão
    const { count } = await supabase
      .from('chat_mensagens')
      .select('*', { count: 'exact', head: true })
      .eq('sessao_id', sessaoId)

    if (typeof count === 'number') {
      await supabase
        .from('chat_sessoes')
        .update({ total_mensagens: count, updated_at: new Date().toISOString() })
        .eq('id', sessaoId)
    }
  } catch (err: any) {
    console.warn('[Chat DB] Falha ao salvar mensagem:', err.message)
  }
}

/**
 * Marca que o usuário clicou no botão de WhatsApp durante o atendimento.
 */
export async function registrarCliqueWhatsAppNoBanco(sessaoId: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('chat_sessoes')
      .update({ clicou_whatsapp: true, updated_at: new Date().toISOString() })
      .eq('id', sessaoId)

    if (error) {
      console.warn('[Chat DB] Erro ao registrar clique WhatsApp:', error.message)
    }
  } catch (err: any) {
    console.warn('[Chat DB] Exceção ao registrar clique WhatsApp:', err.message)
  }
}

/**
 * Carrega a lista de sessões de chat para o painel Admin.
 */
export async function carregarSessoesChatAdmin({
  modo,
  somenteWhatsApp,
  somenteQualificados,
  termo,
  limite = 50,
}: {
  modo?: 'tech' | 'pastoral' | 'todos'
  somenteWhatsApp?: boolean
  somenteQualificados?: boolean
  termo?: string
  limite?: number
} = {}) {
  await requireAdmin()
  const supabase = await createClient()

  let query = supabase
    .from('chat_sessoes')
    .select(`
      id,
      modo_inicial,
      modo_atual,
      total_mensagens,
      clicou_whatsapp,
      houve_transferencia,
      nome_lead,
      contato_lead,
      resumo_conversa,
      qualificado,
      user_agent,
      created_at,
      updated_at
    `)
    .order('updated_at', { ascending: false })
    .limit(limite)

  if (modo && modo !== 'todos') {
    query = query.eq('modo_atual', modo)
  }

  if (somenteWhatsApp) {
    query = query.eq('clicou_whatsapp', true)
  }

  if (somenteQualificados) {
    query = query.eq('qualificado', true)
  }

  const { data: sessoes, error } = await query

  if (error) {
    console.warn('[Chat Admin] Aviso ao buscar sessões:', error.message)
    return []
  }

  if (!sessoes || sessoes.length === 0) {
    return []
  }

  // Busca a primeira mensagem de cada sessão para prévia
  const sessaoIds = sessoes.map((s) => s.id)
  const { data: primeirasMsgs } = await supabase
    .from('chat_mensagens')
    .select('sessao_id, role, content, created_at')
    .in('sessao_id', sessaoIds)
    .eq('role', 'user')
    .order('created_at', { ascending: true })

  const mapaPrimeirasMsgs = new Map<string, string>()
  primeirasMsgs?.forEach((m) => {
    if (!mapaPrimeirasMsgs.has(m.sessao_id)) {
      mapaPrimeirasMsgs.set(m.sessao_id, m.content)
    }
  })

  return sessoes.map((s) => ({
    ...s,
    primeiraMensagem: mapaPrimeirasMsgs.get(s.id) || '',
  }))
}

/**
 * Carrega uma sessão de chat completa com todas as mensagens para depuração.
 */
export async function carregarSessaoCompletaAdmin(sessaoId: string): Promise<SessaoComMensagens | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data: sessao, error: sessaoErr } = await supabase
    .from('chat_sessoes')
    .select('*')
    .eq('id', sessaoId)
    .single()

  if (sessaoErr || !sessao) {
    return null
  }

  const { data: mensagens, error: msgErr } = await supabase
    .from('chat_mensagens')
    .select('*')
    .eq('sessao_id', sessaoId)
    .order('created_at', { ascending: true })

  if (msgErr) {
    return { ...sessao, mensagens: [] }
  }

  return {
    ...sessao,
    mensagens: mensagens || [],
  }
}

/** Meia-noite UTC do dia seguinte — limite superior exclusivo de um intervalo. */
function diaSeguinteUTC(dia: string): string {
  const data = new Date(`${dia}T00:00:00.000Z`)
  data.setUTCDate(data.getUTCDate() + 1)
  return data.toISOString()
}

/**
 * Carrega métricas agregadas de atendimento IA.
 *
 * Aceita duas formas de janela porque as duas telas perguntam diferente: o
 * painel manda um intervalo fechado de dias (o mesmo do analytics, para que
 * "ontem" signifique ontem nas duas seções), e a tela de IA manda um número de
 * dias corridos.
 */
export async function carregarEstatisticasChatAdmin(
  janela: number | { inicio: string; fim: string } = 30,
): Promise<EstatisticasChat> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    let de: string
    let ate: string | null = null

    if (typeof janela === 'number') {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - janela)
      de = dataLimite.toISOString()
    } else {
      // Mesma fronteira de dia do analytics: meia-noite UTC. Calcular no fuso
      // local faria "hoje" no painel começar três horas depois de "hoje" no
      // gráfico ao lado.
      de = `${janela.inicio}T00:00:00.000Z`
      ate = diaSeguinteUTC(janela.fim)
    }

    let consulta = supabase
      .from('chat_sessoes')
      .select('id, modo_atual, clicou_whatsapp, houve_transferencia, qualificado, total_mensagens')
      .gte('created_at', de)

    if (ate) consulta = consulta.lt('created_at', ate)

    const { data: sessoes, error } = await consulta

    if (error || !sessoes) {
      return {
        totalSessoes: 0,
        totalMensagens: 0,
        sessoesTech: 0,
        sessoesPastoral: 0,
        conversoesWhatsApp: 0,
        taxaConversaoWhatsApp: 0,
        totalTransferencias: 0,
        totalLeadsQualificados: 0,
      }
    }

    const totalSessoes = sessoes.length
    const totalMensagens = sessoes.reduce((acc, s) => acc + (s.total_mensagens || 0), 0)
    const sessoesTech = sessoes.filter((s) => s.modo_atual === 'tech').length
    const sessoesPastoral = sessoes.filter((s) => s.modo_atual === 'pastoral').length
    const conversoesWhatsApp = sessoes.filter((s) => s.clicou_whatsapp).length
    const totalTransferencias = sessoes.filter((s) => s.houve_transferencia).length
    const totalLeadsQualificados = sessoes.filter((s) => s.qualificado).length
    const taxaConversaoWhatsApp =
      totalSessoes > 0 ? Math.round((conversoesWhatsApp / totalSessoes) * 100) : 0

    return {
      totalSessoes,
      totalMensagens,
      sessoesTech,
      sessoesPastoral,
      conversoesWhatsApp,
      taxaConversaoWhatsApp,
      totalTransferencias,
      totalLeadsQualificados,
    }
  } catch (err) {
    console.warn('[Chat Admin Stats Error]:', err)
    return {
      totalSessoes: 0,
      totalMensagens: 0,
      sessoesTech: 0,
      sessoesPastoral: 0,
      conversoesWhatsApp: 0,
      taxaConversaoWhatsApp: 0,
      totalTransferencias: 0,
      totalLeadsQualificados: 0,
    }
  }
}
