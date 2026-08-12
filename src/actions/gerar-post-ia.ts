'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import { Categoria } from '@/lib/blog/constantes'
import { derivarConteudo } from '@/lib/blog/derivar'
import { createClient } from '@/lib/supabase/server'

export type SugestaoTitulo = {
  titulo: string
  subtituloOuJustificativa: string
  palavrasChave: string[]
}

export type ResultadoPostIa = {
  titulo: string
  slug: string
  categoria: Categoria
  resumo: string
  seoTitulo: string
  seoDescricao: string
  tags: string[]
  capaUrl: string
  capaAlt: string
  contentJson: any
  minutosDeLeitura: number
}

export type ModeloGemini = {
  id: string
  nome: string
  descricao: string
  limiteTokensInput: number
  limiteTokensOutput: number
  eRecomendado: boolean
}

// Slugs de referência real para interlinking categorizado sem 404
const LINKS_TECH_REAIS = [
  { rotulo: 'O Futuro do Trabalho com Agentes de IA', href: '/blog/o-futuro-do-trabalho-com-agentes-de-ia' },
  { rotulo: '10 Ferramentas de IA Essenciais para Dobrar sua Produtividade', href: '/blog/10-ferramentas-de-ia-essenciais-para-produtividade' },
  { rotulo: 'DeepSeek vs ChatGPT e Claude: Qual Escolher', href: '/blog/deepseek-vs-chatgpt-e-claude-qual-usar' },
  { rotulo: 'O Que São MCPs (Model Context Protocol)? Explicado', href: '/blog/o-que-sao-mcps-model-context-protocol-explicado' },
  { rotulo: 'Como Proteger seus Dados Pessoais na Era da IA', href: '/blog/como-proteger-seus-dados-pessoais-na-era-da-ia' },
]

const LINKS_FE_REAIS = [
  { rotulo: 'Cultivando o Devocional Diário na Rotina Corrida', href: '/blog/cultivando-o-devocional-diario-na-rotina-corrida' },
  { rotulo: 'Esperança e Resiliência em Tempos de Incerteza', href: '/blog/esperanca-e-resiliencia-em-tempos-de-incerteza' },
  { rotulo: 'Liderança Cristã no Mercado de Trabalho', href: '/blog/lideranca-crista-no-mercado-de-trabalho' },
  { rotulo: 'Generosidade e Mordomia Financeira', href: '/blog/generosidade-e-mordomia-financeira' },
  { rotulo: 'Ansiedade e a Paz de Deus no Mundo Acelerado', href: '/blog/ansiedade-e-paz-de-deus-no-mundo-acelerado' },
]

function obterApiKey(apiKeyInformada?: string): string {
  const key = apiKeyInformada?.trim() || process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error(
      'Nenhuma chave de API do Gemini foi configurada. Configure a sua chave na aba "Configurações IA" do Painel Admin.'
    )
  }
  return key
}

const MODELOS_FALLBACK = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']

/**
 * Chamada resiliente à API do Gemini com retries exponenciais e comutação para modelos de reserva.
 * Trata erros 503 (serviço indisponível / alta demanda), 429 (rate limit), 404 (modelo indisponível) e 5xx.
 */
async function chamarGeminiComRetryEFallback({
  apiKey,
  modeloId = 'gemini-2.0-flash',
  contents,
  generationConfig,
}: {
  apiKey: string
  modeloId?: string
  contents: any[]
  generationConfig?: any
}): Promise<any> {
  const modelosParaTestar = Array.from(new Set([modeloId, ...MODELOS_FALLBACK]))

  let ultimoErro: Error | null = null

  for (const mod of modelosParaTestar) {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          return data
        }

        const status = res.status
        const errText = await res.text()

        // 404: O modelo não existe nesta versão da API -> Pula para o próximo modelo de fallback
        if (status === 404) {
          console.warn(`[Gemini API] Modelo ${mod} retornou 404. Testando próximo modelo de fallback...`)
          ultimoErro = new Error(`O modelo ${mod} não foi encontrado na API do Gemini.`)
          break
        }

        if (status === 503 || status === 429 || status >= 500) {
          console.warn(
            `[Gemini API] Modelo ${mod} (tentativa ${tentativa}/2) retornou HTTP ${status}. Tentando novamente com retry/fallback...`
          )
          ultimoErro = new Error(
            'Os servidores do Gemini estão enfrentando alta demanda temporária no momento (Erro 503). Por favor, aguarde alguns segundos e tente novamente.'
          )
          await new Promise((r) => setTimeout(r, tentativa * 1000))
          continue
        }

        throw new Error(`Erro na API do Gemini (${status}): ${errText}`)
      } catch (err: any) {
        ultimoErro = err
        if (err.message?.includes('400') || err.message?.includes('API key')) {
          throw err
        }
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  throw (
    ultimoErro ||
    new Error(
      'Os servidores do Gemini estão enfrentando alta demanda no momento (Erro 503). Por favor, tente novamente em alguns segundos.'
    )
  )
}

/**
 * Valida a chave da API do Gemini e lista todos os modelos disponíveis.
 */
export async function validarEListarModelosGeminiAction(apiKeyInformada: string): Promise<{
  ok: boolean
  modelos?: ModeloGemini[]
  erro?: string
}> {
  try {
    await requireAdmin()
    const key = apiKeyInformada.trim()
    if (!key) {
      throw new Error('Por favor, digite a chave de API do Gemini para validar.')
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      const msg = errJson.error?.message || `Chave inválida ou acesso não autorizado (HTTP ${res.status}).`
      throw new Error(msg)
    }

    const data = await res.json()
    const rawModels: any[] = data.models || []

    const modelosFiltrados: ModeloGemini[] = rawModels
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => {
        const idLimpo = m.name.replace(/^models\//, '')
        const eRecomendado = idLimpo === 'gemini-2.0-flash' || idLimpo === 'gemini-1.5-flash' || idLimpo === 'gemini-1.5-pro'

        return {
          id: idLimpo,
          nome: m.displayName || idLimpo,
          descricao: m.description || 'Modelo de Inteligência Artificial da família Gemini.',
          limiteTokensInput: m.inputTokenLimit || 1048576,
          limiteTokensOutput: m.outputTokenLimit || 8192,
          eRecomendado,
        }
      })
      .sort((a, b) => (b.eRecomendado ? 1 : 0) - (a.eRecomendado ? 1 : 0) || a.nome.localeCompare(b.nome))

    return { ok: true, modelos: modelosFiltrados }
  } catch (error: any) {
    return { ok: false, erro: error.message || 'Falha ao conectar à API do Gemini.' }
  }
}

/**
 * Executa um teste real com a chave, modelo de texto e modelo de imagem selecionados.
 */
export async function testarConfiguracaoModeloAction({
  apiKeyInformada,
  modeloId,
  modeloImagemId = 'imagen-3.0-generate-002',
}: {
  apiKeyInformada: string
  modeloId: string
  modeloImagemId?: string
}): Promise<{ ok: boolean; mensagem?: string; erro?: string }> {
  try {
    await requireAdmin()
    const key = apiKeyInformada.trim()
    if (!key) throw new Error('Chave de API não fornecida.')
    if (!modeloId) throw new Error('Modelo de texto não selecionado.')

    // 1. Teste do Modelo de Texto
    const resTexto = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modeloId}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responda apenas a palavra: OK_TEXTO' }] }],
        }),
      }
    )

    if (!resTexto.ok) {
      const errText = await resTexto.text()
      throw new Error(`Falha no modelo de texto "${modeloId}" (${resTexto.status}): ${errText}`)
    }

    // 2. Teste do Modelo de Imagem (Imagen 3)
    const resImagem = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modeloImagemId}:predict?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: 'A minimalist abstract shape, warm lighting, high quality' }],
          parameters: { sampleCount: 1, aspectRatio: '16:9' },
        }),
      }
    )

    if (!resImagem.ok) {
      const errImg = await resImagem.text()
      // Se não tiver quota de Imagen 3, avisa amigavelmente sem bloquear texto
      console.warn(`[Aviso Imagen 3] Teste de imagem retornou ${resImagem.status}: ${errImg}`)
      return {
        ok: true,
        mensagem: `Modelo de texto "${modeloId}" testado com sucesso! (Nota: O teste do Imagen 3 retornou status ${resImagem.status}, mas a geração de texto funcionará normalmente).`,
      }
    }

    return {
      ok: true,
      mensagem: `Teste de conexão concluído com sucesso! Modelo de Texto ("${modeloId}") e Modelo de Imagem ("${modeloImagemId}") testados e operacionais.`,
    }
  } catch (error: any) {
    return { ok: false, erro: error.message || 'Falha ao testar configuração.' }
  }
}

/**
 * Valida o Token de API do Apify consultando a conta do usuário
 */
export async function testarChaveApifyAction(apifyTokenInformado?: string): Promise<{
  ok: boolean
  usuario?: string
  plano?: string
  erro?: string
}> {
  try {
    await requireAdmin()
    const token = (apifyTokenInformado || process.env.APIFY_API_TOKEN || '').trim()

    if (!token) {
      return { ok: false, erro: 'Informe um Token de API do Apify válido (ex: apify_api_...).' }
    }

    const res = await fetch(`https://api.apify.com/v2/users/me?token=${token}`)

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return {
        ok: false,
        erro: errData.error?.message || `Token do Apify inválido ou recusado (Status HTTP ${res.status}).`,
      }
    }

    const data = await res.json()
    const usuario = data.data?.username || data.data?.email || 'Usuário Apify'
    const plano = data.data?.plan?.name || 'Ativo'

    return {
      ok: true,
      usuario,
      plano,
    }
  } catch (error: any) {
    return { ok: false, erro: error.message || 'Falha ao validar token do Apify.' }
  }
}

/**
 * Passo 1: Analisa tendências e sugere 4 títulos de alta busca com base no tema.
 */
export async function obterSugestoesDeTitulosAction({
  tema,
  categoria,
  apiKeyInformada,
  modeloId = 'gemini-2.0-flash',
}: {
  tema: string
  categoria: Categoria
  apiKeyInformada?: string
  modeloId?: string
}): Promise<{ ok: boolean; sugestoes?: SugestaoTitulo[]; erro?: string }> {
  try {
    await requireAdmin()
    const apiKey = obterApiKey(apiKeyInformada)

    const promptSystem = `Você é um especialista renomado em SEO, Copywriting e Estratégia de Conteúdo Digital.
O usuário quer escrever um artigo de blog no segmento de "${categoria === 'fe' ? 'Vida Cristã, Fé e Espiritualidade' : 'Tecnologia, Inteligência Artificial e Engenharia de Software'}".

Tema sugerido pelo usuário: "${tema}".

Sua tarefa: Analise as tendências de busca do Google e comportamento dos leitores. Sugira exatamente 4 títulos altamente atraentes, informativos e com alto potencial de busca orgânica.

Responda ESTRITAMENTE em formato JSON com o seguinte schema de array:
[
  {
    "titulo": "Título principal e chamativo para o post",
    "subtituloOuJustificativa": "Por que este título é uma tendência quente de busca no Google",
    "palavrasChave": ["palavra1", "palavra2", "palavra3"]
  }
]`

    const data = await chamarGeminiComRetryEFallback({
      apiKey,
      modeloId,
      contents: [{ parts: [{ text: promptSystem }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    })

    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawContent) {
      throw new Error('A API do Gemini não retornou texto válido.')
    }

    const sugestoes: SugestaoTitulo[] = JSON.parse(rawContent)

    return { ok: true, sugestoes }
  } catch (error: any) {
    console.error('[Action Gerar Títulos IA] Erro:', error)
    return { ok: false, erro: error.message || 'Falha ao buscar sugestões com a IA.' }
  }
}

/**
 * Passo 2: Gera o post completo (~1500 palavras, Tiptap JSON, SEO, tags e imagem).
 */
export async function gerarPostCompletoComIaAction({
  titulo,
  tema,
  categoria,
  apiKeyInformada,
  modeloId = 'gemini-2.0-flash',
  modeloImagemId = 'imagen-3.0-generate-002',
  publicarDireto = true,
}: {
  titulo: string
  tema: string
  categoria: Categoria
  apiKeyInformada?: string
  modeloId?: string
  modeloImagemId?: string
  publicarDireto?: boolean
}): Promise<{ ok: boolean; post?: ResultadoPostIa; postCriadoId?: string; publicado?: boolean; erro?: string }> {
  try {
    await requireAdmin()
    const apiKey = obterApiKey(apiKeyInformada)

    const eFe = categoria === 'fe'
    const linksReais = eFe ? LINKS_FE_REAIS : LINKS_TECH_REAIS
    const supabase = await createClient()

    // 1. Busca todas as tags que já existem no banco de dados para priorizar o reuso
    const { data: postsTags } = await supabase.from('posts').select('tags')
    const setTagsExistentes = new Set<string>()
    if (postsTags) {
      postsTags.forEach((p: any) => {
        if (Array.isArray(p.tags)) {
          p.tags.forEach((t: string) => {
            const limpa = t.toLowerCase().trim()
            if (limpa) setTagsExistentes.add(limpa)
          })
        }
      })
    }
    const listaTagsExistentes = Array.from(setTagsExistentes)

    const promptRedacao = `Você é um autor especialista escrevendo para o blog pessoal de Márcio Rolim (Engenheiro de IA & Software e Pastor Evangélico).
Você DEVE escrever um artigo completo, articulado, rico em detalhes e com extensão fixa entre 1300 e 1500 PALAVRAS (~8 a 10 minutos de leitura).

DETALHES DO ARTIGO:
- Título Escolhido: "${titulo}"
- Tema Geral: "${tema}"
- Categoria do Blog: "${categoria}" (Área: ${eFe ? 'Vida Cristã & Fé' : 'Tecnologia & Inovação'})

ESTRUTURA FIXA OBRIGATÓRIA DO ARTIGO:
1. EXTENSÃO MÍNIMA: O artigo deve conter obrigatoriamente entre 1300 e 1500 palavras divididas em parágrafos bem desenvolvidos.
2. SEÇÕES E TÍTULOS: O artigo deve possuir exatamente 5 a 6 seções principais H2 e subseções H3 bem definidas.
3. LINGUAGEM E TOM:
   - Para Tecnologia & IA: Linguagem amigável, clara, didática e inspiradora, focando em novidades, tendências, impacto no trabalho e dicas práticas de uso (SEM blocos de código densos ou jargões obscuros).
   - Para Vida Cristã & Fé: Tom pastoral, encorajador, fundamentado biblicamente e focado na aplicação da fé no cotidiano.
4. DESTAQUE (BLOCKQUOTE): Inclua exatamente 1 frase de citação ou reflexão em destaque ("blockquote").
5. LISTAS PRÁTICAS: Em 2 ou mais seções, inclua listas com bullet points contendo conselhos práticos e orientações claras.
6. TAGS INTELIGENTES (OBRIGATÓRIO: ENTRE 5 E 10 TAGS):
   - Analise cuidadosamente o conteúdo e gere OBRIGATORIAMENTE entre 5 e 10 tags relevantes.
   - DÊ PREFERÊNCIA ABSOLUTA em reutilizar as seguintes tags que JÁ EXISTEM no banco de dados:
   [${listaTagsExistentes.join(', ')}]
   - Se o conceito do artigo exigir novos termos que não estão na lista acima, crie novas tags curtas e precisas em minúsculas.
7. OTIMIZAÇÃO SEO COMPLETA:
   - Título SEO ("seoTitulo"): Título otimizado para o Google com até 60 caracteres.
   - Descrição SEO ("seoDescricao"): Meta description envolvente entre 120 e 155 caracteres.
8. PROMPT VISUAL DA CAPA ("promptVisualCapa"): Descreva em inglês um conceito visual fotográfico de alta qualidade, 16:9, sem textos ou logos, para a geração da imagem de capa.
9. LINKS INTERNOS ISOLADOS: Insira 1 a 2 links internos usando ESTRITAMENTE as seguintes URLs reais fornecidas (nunca invente URLs externas ou inexistentes!):
${linksReais.map((l) => `- Texto: "${l.rotulo}" -> href: "${l.href}"`).join('\n')}

FORMATO DA RESPOSTA (JSON RIGOROSO):
Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "titulo": "${titulo}",
  "resumo": "Resumo envolvente de 2 a 3 frases explicando os pontos principais do artigo",
  "seoTitulo": "Título otimizado para SEO com até 60 caracteres",
  "seoDescricao": "Meta description concisa para o Google entre 120 e 155 caracteres",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
  "capaAlt": "Descrição acessível e detalhada da imagem de capa",
  "promptVisualCapa": "Professional editorial photograph of modern tech artificial intelligence, 16:9 aspect ratio, warm cinematic lighting",
  "minutosDeLeitura": 8,
  "artigoFormatado": {
    "introducao": ["paragrafo 1 com 4-5 linhas", "paragrafo 2 com 4-5 linhas", "paragrafo 3 com 4-5 linhas"],
    "secoes": [
      {
        "tituloH2": "1. Nome da Primeira Seção H2",
        "paragrafos": ["Parágrafo detalhado A de 5 linhas", "Parágrafo detalhado B de 5 linhas", "Parágrafo detalhado C de 5 linhas"],
        "subsecaoH3": "Subseção Prática H3",
        "itensLista": ["Dica prática 1 explicada", "Dica prática 2 explicada", "Dica prática 3 explicada"]
      }
    ],
    "blockquote": "Frase marcante ou citação bíblica reflexiva para destaque visual",
    "conclusao": ["Paragrafo de sintese 1", "Paragrafo de sintese 2"]
  }
}`

    const data = await chamarGeminiComRetryEFallback({
      apiKey,
      modeloId,
      contents: [{ parts: [{ text: promptRedacao }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    })

    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawContent) {
      throw new Error('A API do Gemini não retornou o texto do post.')
    }

    const gerado = JSON.parse(rawContent)

    const contentNodes: any[] = []

    if (gerado.artigoFormatado?.introducao) {
      gerado.artigoFormatado.introducao.forEach((pText: string) => {
        contentNodes.push({
          type: 'paragraph',
          content: [{ type: 'text', text: pText }],
        })
      })
    }

    if (gerado.artigoFormatado?.blockquote) {
      contentNodes.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: gerado.artigoFormatado.blockquote }],
          },
        ],
      })
    }

    if (Array.isArray(gerado.artigoFormatado?.secoes)) {
      gerado.artigoFormatado.secoes.forEach((sec: any) => {
        if (sec.tituloH2) {
          contentNodes.push({
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: sec.tituloH2 }],
          })
        }

        if (Array.isArray(sec.paragrafos)) {
          sec.paragrafos.forEach((pText: string, idx: number) => {
            if (idx === 0 && linksReais.length > 0) {
              const linkRef = linksReais[Math.floor(Math.random() * linksReais.length)]
              contentNodes.push({
                type: 'paragraph',
                content: [
                  { type: 'text', text: pText + ' Conforme abordamos em nosso guia sobre ' },
                  { type: 'text', text: linkRef.rotulo, marks: [{ type: 'link', attrs: { href: linkRef.href } }] },
                  { type: 'text', text: ', a disciplina de engenharia e consistência faz toda a diferença.' },
                ],
              })
            } else {
              contentNodes.push({
                type: 'paragraph',
                content: [{ type: 'text', text: pText }],
              })
            }
          })
        }

        if (sec.subsecaoH3) {
          contentNodes.push({
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: sec.subsecaoH3 }],
          })
        }

        if (Array.isArray(sec.itensLista) && sec.itensLista.length > 0) {
          contentNodes.push({
            type: 'bulletList',
            content: sec.itensLista.map((itemText: string) => ({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: itemText }],
                },
              ],
            })),
          })
        }
      })
    }

    if (gerado.artigoFormatado?.conclusao) {
      contentNodes.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Conclusão' }],
      })

      gerado.artigoFormatado.conclusao.forEach((pText: string) => {
        contentNodes.push({
          type: 'paragraph',
          content: [{ type: 'text', text: pText }],
        })
      })
    }

    if (contentNodes.length === 0) {
      const textoFallback = typeof gerado.artigoFormatado === 'string'
        ? gerado.artigoFormatado
        : gerado.resumo || `Artigo completo sobre ${titulo}`

      textoFallback.split('\n\n').forEach((pStr: string) => {
        if (pStr.trim()) {
          contentNodes.push({
            type: 'paragraph',
            content: [{ type: 'text', text: pStr.trim() }],
          })
        }
      })
    }

    const contentJson = {
      type: 'doc',
      content: contentNodes,
    }

    const slug = titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Geração de imagem de capa por IA (Imagen 3 com fallback dinâmico de IA por tema)
    let capaUrl = ''
    const promptVisual = gerado.promptVisualCapa || `Professional editorial photograph about ${titulo}, 16:9 aspect ratio, warm cinematic lighting`

    try {
      const resImagen = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modeloImagemId}:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: `${promptVisual}. High resolution, 8k, warm lighting, no text, no letters, no logos` }],
            parameters: {
              sampleCount: 1,
              aspectRatio: '16:9',
              outputOptions: { mimeType: 'image/jpeg' },
            },
          }),
        }
      )

      if (resImagen.ok) {
        const dataImagen = await resImagen.json()
        const base64Img = dataImagen.predictions?.[0]?.bytesBase64Encoded
        if (base64Img) {
          const buffer = Buffer.from(base64Img, 'base64')
          const filename = `capa-ia-${slug}-${Date.now()}.jpg`
          const { error: uploadErr } = await supabase.storage
            .from('capas')
            .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })

          if (!uploadErr) {
            const { data: publicData } = supabase.storage.from('capas').getPublicUrl(filename)
            if (publicData?.publicUrl) {
              capaUrl = publicData.publicUrl
            }
          } else {
            capaUrl = `data:image/jpeg;base64,${base64Img}`
          }
        }
      } else {
        console.warn(`[Imagen 3 API] Retornou HTTP ${resImagen.status}. Gerando capa temática por IA...`)
      }
    } catch (errImagen) {
      console.warn('Aviso: Geração do Imagen 3 usou fallback:', errImagen)
    }

    // Se o Imagen 3 não gerou a capa (ex: sem quota na API Key), gera uma capa fotográfica realista temática via IA e faz upload ao Supabase
    if (!capaUrl) {
      try {
        const promptCodificado = encodeURIComponent(`${promptVisual} professional editorial photography 16:9 warm lighting no text`)
        const urlIaImg = `https://image.pollinations.ai/prompt/${promptCodificado}?width=1200&height=675&nologo=true`

        const resIaImg = await fetch(urlIaImg)
        if (resIaImg.ok) {
          const arrayBuffer = await resIaImg.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const filename = `capa-ia-${slug}-${Date.now()}.jpg`
          const { error: uploadErr } = await supabase.storage
            .from('capas')
            .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })

          if (!uploadErr) {
            const { data: publicData } = supabase.storage.from('capas').getPublicUrl(filename)
            if (publicData?.publicUrl) {
              capaUrl = publicData.publicUrl
            }
          } else {
            capaUrl = urlIaImg
          }
        }
      } catch (errFallback) {
        console.warn('Erro ao gerar capa de fallback por IA:', errFallback)
      }
    }

    if (!capaUrl) {
      capaUrl = `https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop`
    }

    // Garante entre 5 e 10 tags
    let tagsFinais: string[] = Array.isArray(gerado.tags)
      ? gerado.tags.map((tg: string) => tg.toLowerCase().trim()).filter(Boolean)
      : []

    if (tagsFinais.length < 5) {
      const complemento = ['tecnologia', 'ia', 'inovação', 'produtividade', 'dicas', 'artigo']
      complemento.forEach((c) => {
        if (tagsFinais.length < 5 && !tagsFinais.includes(c)) tagsFinais.push(c)
      })
    }
    tagsFinais = tagsFinais.slice(0, 10)

    const postFinal: ResultadoPostIa = {
      titulo,
      slug,
      categoria,
      resumo: gerado.resumo || `Artigo completo sobre ${titulo}.`,
      seoTitulo: gerado.seoTitulo || titulo,
      seoDescricao: gerado.seoDescricao || gerado.resumo,
      tags: tagsFinais,
      capaUrl,
      capaAlt: gerado.capaAlt || `Imagem de capa fotográfica para o post ${titulo}`,
      contentJson,
      minutosDeLeitura: gerado.minutosDeLeitura || 8,
    }

    let publicado = false
    let postCriadoId: string | undefined = undefined

    if (publicarDireto) {
      try {
        const derivado = derivarConteudo(contentJson)
        const claims = await requireAdmin()

        // Garante slug único
        let slugFinal = slug
        const { data: existente } = await supabase.from('posts').select('id').eq('slug', slugFinal).maybeSingle()
        if (existente) {
          slugFinal = `${slug}-${Date.now().toString(36)}`
          postFinal.slug = slugFinal
        }

        const { data: criado, error: insertErr } = await supabase
          .from('posts')
          .insert({
            slug: slugFinal,
            title: titulo,
            excerpt: postFinal.resumo,
            content_json: contentJson,
            content_html: derivado.html,
            content_text: derivado.texto,
            cover_url: capaUrl,
            cover_alt: postFinal.capaAlt,
            category: categoria,
            tags: tagsFinais,
            reading_minutes: derivado.minutos,
            status: 'published',
            published_at: new Date().toISOString(),
            seo_title: postFinal.seoTitulo,
            seo_description: postFinal.seoDescricao,
            author_id: claims.sub,
          })
          .select('id')
          .single()

        if (!insertErr && criado) {
          publicado = true
          postCriadoId = criado.id
          revalidatePath('/blog')
          revalidatePath(`/blog/${slugFinal}`)
          revalidatePath('/admin/posts')
        } else if (insertErr) {
          console.error('[Action Gerar Post] Erro no INSERT Supabase:', insertErr)
        }
      } catch (errPublish) {
        console.warn('Aviso ao publicar diretamente no banco:', errPublish)
      }
    }

    return { ok: true, post: postFinal, postCriadoId, publicado }
  } catch (error: any) {
    console.error('[Action Gerar Post IA] Erro:', error)
    return { ok: false, erro: error.message || 'Falha ao gerar post completo com IA.' }
  }
}

/**
 * ⚡ Criar Post de Tecnologia com 1 Clique (Notícias Quentes & Zero Duplicações):
 * 1. Consulta títulos e slugs existentes no banco de dados para evitar  * 3. Escolhe a notícia mais recente e quente que NÃO possua assunto/slug no banco de dados.
 * 4. Redige o post completo de ~1500 palavras em formato TipTap JSON com SEO, tags e imagem de capa.
 */
export async function gerarPostAutomaticoUmCliqueAction({
  apiKeyInformada,
  apifyTokenInformado,
  modeloId = 'gemini-2.0-flash',
}: {
  apiKeyInformada?: string
  apifyTokenInformado?: string
  modeloId?: string
}): Promise<{ ok: boolean; post?: ResultadoPostIa; noticiaUsada?: string; erro?: string }> {
  try {
    await requireAdmin()
    const apiKey = obterApiKey(apiKeyInformada)
    const supabase = await createClient()

    // 1. Busca os posts existentes no banco para checar duplicações
    const { data: postsExistentes } = await supabase
      .from('posts')
      .select('title, slug')
      .order('published_at', { ascending: false })

    const titulosExistentes = (postsExistentes || []).map((p: any) => p.title)

    // 2. Busca notícias reais se houver token do Apify
    let contextoNoticias = ''
    const apifyToken = (apifyTokenInformado || process.env.APIFY_API_TOKEN || '').trim()

    if (apifyToken) {
      try {
        const resApify = await fetch(
          `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apifyToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              queries: 'Inteligencia Artificial novidades tendencias tecnologia',
              maxPagesPerQuery: 1,
              resultsPerPage: 10,
              type: 'NEWS',
            }),
          }
        )

        if (resApify.ok) {
          const itens = await resApify.json()
          if (Array.isArray(itens) && itens.length > 0) {
            const manchetes = (itens[0]?.organicResults || itens || [])
              .slice(0, 8)
              .map((it: any) => `- ${it.title || it.headline}: ${it.description || it.snippet || ''}`)
              .join('\n')
            if (manchetes) {
              contextoNoticias = `NOTÍCIAS EXTRAÍDAS DA WEB VIA APIFY:\n${manchetes}`
            }
          }
        }
      } catch (errApify) {
        console.warn('Aviso: Falha ao consultar Apify, usando fallback do Gemini:', errApify)
      }
    }

    // 3. Prompt do Gemini para escolher uma notícia quente e inédita
    const promptNoticiaInedita = `Você é um curador de conteúdo e jornalista de tecnologia para o blog de Márcio Rolim.
Sua missão: Identifique a notícia recente mais quente, inovadora e relevante sobre Tecnologia / Inteligência Artificial.

REGRA CRÍTICA DE ANTI-DUPLICAÇÃO:
Você NUNCA deve escolher um assunto ou título que seja igual ou semelhante a qualquer um dos seguintes posts que JÁ EXISTEM no banco de dados:
${titulosExistentes.map((t: string) => `- "${t}"`).join('\n')}

${contextoNoticias ? contextoNoticias : 'Escolha uma tendência real e atual sobre novidades de IA (DeepSeek, ChatGPT, agentes, automação No-Code ou novos lançamentos).'}

Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "tituloInedito": "Título chamativo e inédito para o novo post de tecnologia",
  "temaResumido": "Resumo em 1 frase da notícia quente selecionada",
  "porQueEQuente": "Breve justificativa do motivo desta notícia ser uma tendência atual"
}`

    const resGeminiNoticia = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modeloId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptNoticiaInedita }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
        }),
      }
    )

    if (!resGeminiNoticia.ok) {
      throw new Error(`Erro na API ao selecionar notícia inédita (${resGeminiNoticia.status}).`)
    }

    const dataNoticia = await resGeminiNoticia.json()
    const rawNoticia = dataNoticia.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawNoticia) throw new Error('Não foi possível extrair a notícia inédita do Gemini.')

    const infoNoticia = JSON.parse(rawNoticia)
    const tituloFinal = infoNoticia.tituloInedito
    const temaFinal = infoNoticia.temaResumido

    // 4. Gera o post completo usando nossa função padrão de ~1500 palavras!
    const resultadoPost = await gerarPostCompletoComIaAction({
      titulo: tituloFinal,
      tema: temaFinal,
      categoria: 'tecnologia',
      apiKeyInformada,
      modeloId,
    })

    if (!resultadoPost.ok || !resultadoPost.post) {
      return { ok: false, erro: resultadoPost.erro || 'Falha ao redigir o artigo completo de 1 clique.' }
    }

    return {
      ok: true,
      post: resultadoPost.post,
      noticiaUsada: `${tituloFinal} (${infoNoticia.porQueEQuente})`,
    }
  } catch (error: any) {
    console.error('[Action Gerar Post 1 Clique] Erro:', error)
    return { ok: false, erro: error.message || 'Falha ao gerar o post automático com 1 clique.' }
  }
}

export type OpcaoNoticiaQuente = {
  id: number
  titulo: string
  resumo: string
  porQueEQuente: string
  categoria: Categoria
}

/**
 * ⚡ Obter 5 Opções de Notícias/Assuntos Quentes e Inéditos (Tecnologia ou Fé Cristã)
 */
export async function obter5OpcoesNoticiasQuentesAction({
  categoria = 'tecnologia',
  assuntoOpcional = '',
  apiKeyInformada,
  apifyTokenInformado,
  modeloId = 'gemini-2.0-flash',
}: {
  categoria?: Categoria
  assuntoOpcional?: string
  apiKeyInformada?: string
  apifyTokenInformado?: string
  modeloId?: string
}): Promise<{ ok: boolean; opcoes?: OpcaoNoticiaQuente[]; erro?: string }> {
  try {
    await requireAdmin()
    const apiKey = obterApiKey(apiKeyInformada)
    const supabase = await createClient()

    // 1. Busca posts existentes no banco para anti-duplicação
    const { data: postsExistentes } = await supabase
      .from('posts')
      .select('title, slug')
      .order('published_at', { ascending: false })

    const titulosExistentes = (postsExistentes || []).map((p: any) => p.title)

    // 2. Busca notícias com Apify
    let contextoNoticias = ''
    const apifyToken = (apifyTokenInformado || process.env.APIFY_API_TOKEN || '').trim()

    const eFe = categoria === 'fe'
    const termoBusca = assuntoOpcional.trim()
      ? assuntoOpcional.trim()
      : eFe
      ? 'Vida crista fe devocional espiritualidade biblia rotina'
      : 'Inteligencia Artificial novidades tendencias tecnologia automacao'

    if (apifyToken) {
      try {
        const resApify = await fetch(
          `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apifyToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              queries: termoBusca,
              maxPagesPerQuery: 1,
              resultsPerPage: 10,
              type: 'NEWS',
            }),
          }
        )

        if (resApify.ok) {
          const itens = await resApify.json()
          if (Array.isArray(itens) && itens.length > 0) {
            const manchetes = (itens[0]?.organicResults || itens || [])
              .slice(0, 10)
              .map((it: any) => `- ${it.title || it.headline}: ${it.description || it.snippet || ''}`)
              .join('\n')
            if (manchetes) {
              contextoNoticias = `NOTÍCIAS/TENDÊNCIAS EXTRAÍDAS DA WEB:\n${manchetes}`
            }
          }
        }
      } catch (errApify) {
        console.warn('Aviso: Falha no Apify ao buscar notícias, usando fallback Gemini:', errApify)
      }
    }

    // 3. Prompt do Gemini para gerar 5 opções de notícias/assuntos quentes e inéditos
    const prompt5Opcoes = eFe
      ? `Você é um pastor e autor cristão curando conteúdo para o blog de Márcio Rolim (Área: Vida Cristã & Fé).
Sua missão: Identifique exatamente 5 ASSUNTOS OU DEVOCIONAIS PRÁTICOS, profundos e atuais sobre Fé Cristã, espiritualidade no cotidiano e vida bíblica${
          assuntoOpcional.trim() ? ` focados no tema "${assuntoOpcional.trim()}"` : ''
        }.

REGRA CRÍTICA DE ANTI-DUPLICAÇÃO:
Nenhuma das 5 opções pode ser igual ou semelhante a qualquer um dos seguintes posts que JÁ EXISTEM no banco de dados:
${titulosExistentes.map((t: string) => `- "${t}"`).join('\n')}

${contextoNoticias ? contextoNoticias : 'Busque 5 assuntos devocionais relevantes para o cristão moderno (ex: oração na rotina agitada, fé no ambiente de trabalho, sabedoria em tempos incertos, família, propósito de vida).'}

Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "opcoes": [
    {
      "id": 1,
      "titulo": "Título inspirador e inédito sobre fé cristã",
      "resumo": "Resumo conciso em 1 a 2 frases do artigo devocional",
      "porQueEQuente": "Relevância bíblica e espiritual para os dias de hoje"
    },
    { "id": 2, "titulo": "...", "resumo": "...", "porQueEQuente": "..." },
    { "id": 3, "titulo": "...", "resumo": "...", "porQueEQuente": "..." },
    { "id": 4, "titulo": "...", "resumo": "...", "porQueEQuente": "..." },
    { "id": 5, "titulo": "...", "resumo": "...", "porQueEQuente": "..." }
  ]
}`
      : `Você é um curador de conteúdo e jornalista de tecnologia para o blog de Márcio Rolim (Área: Tecnologia & IA).
Sua missão: Identifique exatamente 5 NOTÍCIAS OU TENDÊNCIAS RECENTES, inovadoras e quentes sobre Tecnologia, Inteligência Artificial e Automação${
          assuntoOpcional.trim() ? ` focados no tema "${assuntoOpcional.trim()}"` : ''
        }.

REGRA CRÍTICA DE ANTI-DUPLICAÇÃO:
Nenhuma das 5 opções pode ser igual ou semelhante a qualquer um dos seguintes posts que JÁ EXISTEM no banco de dados:
${titulosExistentes.map((t: string) => `- "${t}"`).join('\n')}

${contextoNoticias ? contextoNoticias : 'Busque 5 tendências reais e atuais do setor de tecnologia (ex: DeepSeek V3, ChatGPT 5/o1, agentes autônomos, frameworks de IA, automações no-code, novidades Apple/Google/Microsoft).'}

Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "opcoes": [
    {
      "id": 1,
      "titulo": "Título chamativo e inédito para o post de tecnologia",
      "resumo": "Resumo conciso em 1 a 2 frases da notícia",
      "porQueEQuente": "Por que este tema é uma grande tendência agora"
    },
    { "id": 2, "titulo": "...", "resumo": "...", "porQueEQuente": "..." },
    { "id": 3, "titulo": "...", "resumo": "...", "porQueEQuente": "..." },
    { "id": 4, "titulo": "...", "resumo": "...", "porQueEQuente": "..." },
    { "id": 5, "titulo": "...", "resumo": "...", "porQueEQuente": "..." }
  ]
}`

    const data = await chamarGeminiComRetryEFallback({
      apiKey,
      modeloId,
      contents: [{ parts: [{ text: prompt5Opcoes }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    })

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) throw new Error('Retorno vazio da API Gemini.')

    const parsed = JSON.parse(rawText)
    const opcoesList: OpcaoNoticiaQuente[] = (parsed.opcoes || []).map((op: any, index: number) => ({
      id: index + 1,
      titulo: op.titulo,
      resumo: op.resumo,
      porQueEQuente: op.porQueEQuente,
      categoria,
    }))

    return { ok: true, opcoes: opcoesList }
  } catch (error: any) {
    console.error('[Action Obter 5 Opções Notícias Quentes] Erro:', error)
    return { ok: false, erro: error.message || 'Falha ao buscar 5 opções de notícias quentes.' }
  }
}
