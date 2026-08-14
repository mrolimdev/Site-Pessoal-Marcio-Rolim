import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export interface DadosQualificacaoLead {
  nomeLead?: string | null
  contatoLead?: string | null
  resumoConversa?: string | null
  qualificado: boolean
}

/**
 * Analisa o histórico de mensagens da conversa, extrai dados de contato do visitante
 * e gera um resumo executivo da necessidade / atendimento usando o Gemini.
 */
export async function extrairLeadESumarizarConversa({
  mensagens,
  modo,
}: {
  mensagens: Array<{ role: string; content: string }>
  modo: 'tech' | 'pastoral'
}): Promise<DadosQualificacaoLead> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey || mensagens.length < 2) {
    return {
      nomeLead: null,
      contatoLead: null,
      resumoConversa: null,
      qualificado: false,
    }
  }

  const promptExtracao = `Você é um analisador de conversas do site de Márcio Rolim (${modo === 'pastoral' ? 'Atendimento Pastoral & Fé' : 'Consultoria de Tecnologia & IA'}).

Analise o histórico abaixo e responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "nomeLead": "Nome do visitante se ele tiver informado em qualquer momento, ou null",
  "contatoLead": "WhatsApp, telefone ou e-mail que o visitante informou, ou null",
  "resumoConversa": "Resumo de 2 a 3 frases claras e diretas sobre o que o visitante precisa, objetivos ou situação trazida",
  "qualificado": true/false (true SE o visitante informou Nome E/OU Contato/WhatsApp/Email)
}

HISTÓRICO DA CONVERSA:
${mensagens.map((m) => `${m.role === 'user' ? 'VISITANTE' : 'ASSISTENTE'}: ${m.content}`).join('\n\n')}`

  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptExtracao }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    if (!res.ok) {
      return { nomeLead: null, contatoLead: null, resumoConversa: null, qualificado: false }
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!rawText) {
      return { nomeLead: null, contatoLead: null, resumoConversa: null, qualificado: false }
    }

    const parsed = JSON.parse(rawText) as {
      nomeLead?: string | null
      contatoLead?: string | null
      resumoConversa?: string | null
      qualificado?: boolean
    }

    return {
      nomeLead: parsed.nomeLead || null,
      contatoLead: parsed.contatoLead || null,
      resumoConversa: parsed.resumoConversa || null,
      qualificado: Boolean(parsed.qualificado || parsed.contatoLead || parsed.nomeLead),
    }
  } catch (err: any) {
    console.warn('[Qualificacao Chat Error]:', err.message)
    return { nomeLead: null, contatoLead: null, resumoConversa: null, qualificado: false }
  }
}

/**
 * Executa a qualificação e sumarização e atualiza a sessão no Supabase.
 */
export async function processarEAtualizarQualificacaoNoBanco({
  sessaoId,
  mensagens,
  modo,
}: {
  sessaoId: string
  mensagens: Array<{ role: string; content: string }>
  modo: 'tech' | 'pastoral'
}) {
  try {
    const dados = await extrairLeadESumarizarConversa({ mensagens, modo })
    if (!dados.resumoConversa && !dados.nomeLead && !dados.contatoLead) {
      return
    }

    const supabase = createAdminClient()
    await supabase
      .from('chat_sessoes')
      .update({
        nome_lead: dados.nomeLead,
        contato_lead: dados.contatoLead,
        resumo_conversa: dados.resumoConversa,
        qualificado: dados.qualificado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessaoId)
  } catch (err: any) {
    console.warn('[Atualizar Qualificacao DB Error]:', err.message)
  }
}
