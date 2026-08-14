import { NextRequest, NextResponse } from 'next/server'
import { CONTACT, SITE, SOCIAL_LINKS } from '@/content/site'
import { MODELOS_TEXTO_PREFERIDOS } from '@/lib/blog/constantes'

export const runtime = 'nodejs'

// ─── Prompts de Sistema para cada Personalidade ─────────────────────────────

const PROMPT_SISTEMA_TECH = `Você é o Assistente de IA e Consultor Técnico de Márcio Rolim (https://marciorolim.com.br).

EXPERTISE DE MÁRCIO ROLIM:
- Mais de 30 anos em TI, Ciência da Computação (1996), ex-TOTVS (Protheus), SBT, Sul América.
- Especialista em: IA Generativa, Agentes Autônomos, Automação de Processos (n8n/Make/Python), Web Apps Modernos (Next.js/Node/Supabase) e Tráfego Pago (Meta/Google Ads).

DIRETRIZES DE CONVERSAÇÃO CONSULTIVA & QUALIFICAÇÃO:
1. FLUIDEZ DE CHAT REAL (NÃO REPITA SAUDAÇÕES): Se já houver mensagens no histórico, NUNCA repita "Olá", "Oi", "Tudo bem?". Entre direto no assunto como uma conversa contínua.
2. NUNCA FAÇA QUESTIONÁRIOS OU LISTAS DE PERGUNTAS (CRÍTICO): Jamais envie listas de perguntas em tópicos (ex: "É para X? É para Y? Já pensou em Z?"). Isso parece um formulário chato. Fale como um consultor humano e experiente.
3. ENTREGUE VALOR E SUGESTÕES PRÁTICAS PRIMEIRO: Assim que o visitante der uma resposta (ex: "um site pessoal", "um blog", "uma automação"), explique logo na prática como Márcio Rolim resolve isso com excelência (ex: arquitetura Next.js, SEO avançado, integração com IA, automações no n8n) e dê uma recomendação de valor.
4. NO MÁXIMO UMA PERGUNTA POR VEZ: No final da resposta, se necessário para avançar, faça apenas UMA única pergunta curta, natural e objetiva.
5. QUALIFICAÇÃO DE CONTATO & WHATSAPP:
   - Quando o visitante quiser orçamento, proposta, agendar reunião ou conversar diretamente com Márcio Rolim, colha os dados com naturalidade (ex: "Excelente! Para que o Márcio receba todo o contexto do seu projeto, qual é o seu nome e seu WhatsApp ou e-mail?").
   - Quando a pessoa passar os dados, confirme com gentileza e oriente a clicar no botão de WhatsApp abaixo caso queira iniciar a conversa imediatamente.
   - NUNCA digite números de telefone no texto (o botão verde oficial já cuida do direcionamento).
6. RESPOSTAS CURTAS & DIRETAS: Máximo 2 parágrafos concisos. Vá direto ao ponto, com autoridade e linguagem acessível.
7. SEM TÍTULOS '###': Use apenas **negrito** e marcadores simples (•) quando for listar benefícios técnicos.
8. TRANSFERÊNCIA INTELIGENTE: Se a dúvida for estritamente pastoral, oração ou espiritual, avise cordialmente que transferiu para o modo Pastoral do Pr. Márcio Rolim e acolha o visitante com sabedoria bíblica.`

const PROMPT_SISTEMA_PASTORAL = `Você é o Assistente IA Pastoral do Pr. Márcio Rolim (https://marciorolim.com.br).

SOBRE O MINISTÉRIO DO PASTOR MÁRCIO ROLIM:
- Pastor evangélico ordenado desde 2012, casado, pai de 4 filhas e avô. Dedicado ao aconselhamento de vidas, casais e famílias com empatia, graça e sabedoria bíblica.

DIRETRIZES DE CONVERSAÇÃO PASTORAL & QUALIFICAÇÃO:
1. FLUIDEZ DE CHAT REAL (NÃO REPITA SAUDAÇÕES): Se já houver mensagens no histórico, NUNCA repita saudações iniciais ("Olá", "A paz", "Olá querido"). Responda de forma contínua, espontânea e calorosa.
2. NUNCA FAÇA QUESTIONÁRIOS: Não bombardeie o visitante com perguntas. Traga acolhimento, conselho bíblico e palavras de fé e encorajamento. No máximo faça UMA pergunta suave de acolhimento se fizer sentido.
3. DIALOGUE E ACOLHA: Ouça com carinho, traga a presença de Deus e responda com sabedoria e empatia.
4. QUALIFICAÇÃO PASTORAL & ATENDIMENTO INDIVIDUAL:
   - Se a pessoa pedir aconselhamento pessoal, oração individual ou desejar falar diretamente com o Pr. Márcio, peça com carinho o nome e o WhatsApp ou e-mail (ex: "Qual é o seu nome e WhatsApp ou e-mail, querido(a), para que o Pr. Márcio possa orar e entrar em contato com você?").
   - Após ela informar os dados, acolha com amor, profira uma bênção e informe que ela também pode clicar no botão de WhatsApp abaixo.
   - NUNCA digite números de telefone no texto.
5. REAÇÃO A ELOGIOS E MENSAGENS CURTAS: Se a pessoa fizer um elogio ou agradecimento simples, responda com simpatia e afeto em 1 ou 2 frases leves, sem discursos longos.
6. CITAÇÃO BÍBLICA EM DESTAQUE: Quando citar a Bíblia, coloque SEMPRE em linha própria separada no formato:
> "Texto do versículo..." — **Livro Capítulo:Versículo**
7. CONCISÃO & EMPATIA: Responda em no máximo 2 a 3 parágrafos curtos, calorosos e confortadores.
8. TRANSFERÊNCIA INTELIGENTE: Se a dúvida for sobre desenvolvimento de software, automação ou projetos técnicos, inicie avisando cordialmente que transferiu para o modo Técnico de Márcio Rolim e atenda com excelência técnica.`

type MensagemChat = {
  role: 'user' | 'model' | 'assistant'
  content: string
}

function obterApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.')
  }
  return key
}

function detectarIntencaoTransferencia(
  ultimaMensagem: string,
  modoAtual: 'tech' | 'pastoral',
): 'tech' | 'pastoral' | null {
  const t = ultimaMensagem.toLowerCase()

  // Padrões de intenção pastoral / fé / espiritual
  const termosPastorais = [
    /\bor(ar|ação|e por mim|ando|ações)\b/,
    /\b(pastor|pastoral|pastores)\b/,
    /\b(deus|jesus|cristo|senhor|espírito santo|pai celeste)\b/,
    /\b(bíblia|bíblico|versículo|versiculo|salmo|salmos|evangelho|gênesis|genesis|apocalipse|provérbios|proverbios)\b/,
    /\b(igreja|culto|congregação|ministério pastoral)\b/,
    /\b(pecado|perdão de deus|salvação|arrependimento|vida eterna|fé|benção|abencoar)\b/,
    /\b(casamento em crise|divórcio|crise conjugal|família abençoada)\b/,
    /\b(luto|falecimento|perdi|vazio na alma|angústia|tristeza profunda|depressão|desânimo com a vida)\b/,
    /\b(devocional|palavra de conforto|aconselhamento espiritual)\b/,
  ]

  // Padrões de intenção técnica / tecnologia / desenvolvimento / negócios
  const termosTecnicos = [
    /\b(código|programação|programar|desenvolvimento|desenvolver|programador|dev)\b/,
    /\b(software|sistema|aplicativo|aplicação|app|site|landing page|website|portal)\b/,
    /\b(api|rest|nextjs|react|node|typescript|javascript|python|supabase|postgres|sql|banco de dados)\b/,
    /\b(n8n|make|zapier|automação|automatizar|fluxo de trabalho|workflow)\b/,
    /\b(ia|inteligência artificial|agente de ia|agentes autônomos|chatgpt|gemini|llm|deepseek|claude)\b/,
    /\b(tráfego pago|meta ads|google ads|campanha|anúncios|facebook ads|marketing digital)\b/,
    /\b(consultoria de ti|orçamento|proposta comercial|quanto custa|contratar)\b/,
    /\b(totvs|protheus|erp|infraestrutura|nuvem|aws|cloud|deploy)\b/,
  ]

  if (modoAtual === 'tech') {
    const temPastoral = termosPastorais.some((r) => r.test(t))
    const temTech = termosTecnicos.some((r) => r.test(t))
    if (temPastoral && !temTech) {
      return 'pastoral'
    }
  } else if (modoAtual === 'pastoral') {
    const temTech = termosTecnicos.some((r) => r.test(t))
    const temPastoral = termosPastorais.some((r) => r.test(t))
    if (temTech && !temPastoral) {
      return 'tech'
    }
  }

  return null
}

import { salvarMensagemChatNoBanco } from '@/lib/chat/queries'
import { processarEAtualizarQualificacaoNoBanco } from '@/lib/chat/qualificacao'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      messages,
      modo = 'tech',
      sessionId,
    } = body as {
      messages: MensagemChat[]
      modo?: 'tech' | 'pastoral'
      sessionId?: string
    }

    const sessaoId = sessionId && UUID_REGEX.test(sessionId) ? sessionId : crypto.randomUUID()
    const userAgent = req.headers.get('user-agent') || undefined

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { erro: 'O array de mensagens é obrigatório e não pode estar vazio.' },
        { status: 400 },
      )
    }

    // Proteção contra abuso de tokens e DoS: limita histórico e tamanho por mensagem
    const mensagensSanitizadas = messages.slice(-25).map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? ('model' as const) : ('user' as const),
      content: String(m.content || '').slice(0, 3000),
    }))

    // Detecção inteligente de intenção e transferência de atendimento
    const ultimaMensagemUsuario =
      [...mensagensSanitizadas].reverse().find((m) => m.role === 'user')?.content || ''
    const novoModoDetectado = detectarIntencaoTransferencia(ultimaMensagemUsuario, modo)
    const modoEfetivo = novoModoDetectado || modo
    const houveTransferencia = modoEfetivo !== modo

    const apiKey = obterApiKey()
    const promptSistema =
      modoEfetivo === 'pastoral' ? PROMPT_SISTEMA_PASTORAL : PROMPT_SISTEMA_TECH

    // Formata o histórico de mensagens para a estrutura da API do Gemini
    const contents = mensagensSanitizadas.map((m) => ({
      role: m.role,
      parts: [{ text: m.content || '' }],
    }))

    // Filtra para garantir que começa com uma mensagem de 'user'
    while (contents.length > 0 && contents[0]?.role !== 'user') {
      contents.shift()
    }

    if (contents.length === 0) {
      return NextResponse.json(
        { erro: 'Nenhuma mensagem de usuário válida encontrada no histórico.' },
        { status: 400 },
      )
    }

    const modelosParaTentar = [
      'gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-3-flash-preview',
      'gemini-2.5-pro',
    ]

    let streamResponse: Response | null = null
    let modeloEscolhido = ''

    for (const mod of modelosParaTentar) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${mod}:streamGenerateContent?alt=sse`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: promptSistema }],
              },
              contents,
              generationConfig: {
                temperature: modoEfetivo === 'pastoral' ? 0.6 : 0.7,
                maxOutputTokens: 600,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
          },
        )

        if (res.ok && res.body) {
          streamResponse = res
          modeloEscolhido = mod
          break
        }

        const status = res.status
        if (status === 404) {
          console.warn(`[Chat API] Modelo ${mod} retornou 404, tentando fallback...`)
          continue
        }

        const erroTexto = await res.text()
        console.error(`[Chat API] Erro no modelo ${mod} (${status}):`, erroTexto.slice(0, 500))
      } catch (fetchErr) {
        console.warn(`[Chat API] Falha de conexão com modelo ${mod}:`, fetchErr)
      }
    }

    if (!streamResponse || !streamResponse.body) {
      return NextResponse.json(
        {
          erro: 'Não foi possível conectar ao serviço de inteligência artificial no momento. Por favor, tente novamente em instantes ou entre em contato pelo WhatsApp.',
        },
        { status: 503 },
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const reader = streamResponse.body.getReader()

    const readableStream = new ReadableStream({
      async start(controller) {
        // Envia ID de sessão e evento de transferência se houver
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ sessionId: sessaoId, ...(houveTransferencia ? { transfer: modoEfetivo } : {}) })}\n\n`,
          ),
        )

        let buffer = ''
        let respostaCompleta = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const events = buffer.split(/\r?\n\r?\n/)
            buffer = events.pop() || ''

            for (const event of events) {
              const trimmed = event.trim()
              if (!trimmed) continue

              // Extrai todo o conteúdo após "data:" (mesmo com quebras de linha internas)
              const dataIndex = trimmed.indexOf('data:')
              if (dataIndex === -1) continue

              const jsonStr = trimmed.slice(dataIndex + 5).trim()
              if (jsonStr === '[DONE]') continue

              try {
                const parsed = JSON.parse(jsonStr)
                const candidate = parsed.candidates?.[0]
                const textPart = candidate?.content?.parts?.[0]?.text

                if (textPart) {
                  respostaCompleta += textPart
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: textPart })}\n\n`),
                  )
                }
              } catch (parseError) {
                // Se falhar o parse por chunk truncado, recoloca no buffer
                buffer = event + '\n\n' + buffer
              }
            }
          }

          // Se sobrou algum buffer no final
          if (buffer.trim()) {
            const trimmed = buffer.trim()
            const dataIndex = trimmed.indexOf('data:')
            if (dataIndex !== -1) {
              const jsonStr = trimmed.slice(dataIndex + 5).trim()
              if (jsonStr && jsonStr !== '[DONE]') {
                try {
                  const parsed = JSON.parse(jsonStr)
                  const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                  if (textPart) {
                    respostaCompleta += textPart
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text: textPart })}\n\n`),
                    )
                  }
                } catch {
                  // ignora
                }
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // Grava a conversa e atualiza a qualificação do lead de forma assíncrona no Supabase
          if (respostaCompleta) {
            Promise.all([
              salvarMensagemChatNoBanco({
                sessaoId,
                modoInicial: modo,
                modoAtual: modoEfetivo,
                role: 'user',
                content: ultimaMensagemUsuario,
                userAgent,
                houveTransferencia,
              }),
              salvarMensagemChatNoBanco({
                sessaoId,
                modoInicial: modo,
                modoAtual: modoEfetivo,
                role: 'assistant',
                content: respostaCompleta,
                modeloUsado: modeloEscolhido,
                userAgent,
                houveTransferencia,
              }),
            ])
              .then(() =>
                processarEAtualizarQualificacaoNoBanco({
                  sessaoId,
                  mensagens: [
                    ...messages,
                    { role: 'assistant', content: respostaCompleta },
                  ],
                  modo: modoEfetivo,
                }),
              )
              .catch((err) => console.warn('[Chat DB Async Error]:', err))
          }
        } catch (streamError) {
          console.error('[Chat API Stream] Erro durante o stream:', streamError)
          controller.error(streamError)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: any) {
    console.error('[Chat API Error]:', error)
    return NextResponse.json(
      { erro: error.message || 'Erro interno no servidor de chat.' },
      { status: 500 },
    )
  }
}
