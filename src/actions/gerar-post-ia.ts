'use server'

import { requireAdmin } from '@/lib/auth/require-admin'
import { Categoria } from '@/lib/blog/constantes'

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
 * Executa um teste real com a chave e modelo selecionados.
 */
export async function testarConfiguracaoModeloAction({
  apiKeyInformada,
  modeloId,
}: {
  apiKeyInformada: string
  modeloId: string
}): Promise<{ ok: boolean; mensagem?: string; erro?: string }> {
  try {
    await requireAdmin()
    const key = apiKeyInformada.trim()
    if (!key) throw new Error('Chave de API não fornecida.')
    if (!modeloId) throw new Error('Modelo de IA não selecionado.')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modeloId}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responda apenas a palavra: CONFIGURADO_COM_SUCESSO' }] }],
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Falha no teste do modelo ${modeloId} (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      ok: true,
      mensagem: `Teste concluído com sucesso! O modelo "${modeloId}" respondeu: "${resposta.trim()}".`,
    }
  } catch (error: any) {
    return { ok: false, erro: error.message || 'Falha ao testar configuração.' }
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

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modeloId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptSystem }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Erro na API do Gemini (${res.status}): ${errText}`)
    }

    const data = await res.json()
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
}: {
  titulo: string
  tema: string
  categoria: Categoria
  apiKeyInformada?: string
  modeloId?: string
}): Promise<{ ok: boolean; post?: ResultadoPostIa; erro?: string }> {
  try {
    await requireAdmin()
    const apiKey = obterApiKey(apiKeyInformada)

    const eFe = categoria === 'fe'
    const linksReais = eFe ? LINKS_FE_REAIS : LINKS_TECH_REAIS

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
6. LINKS INTERNOS ISOLADOS: Insira 1 a 2 links internos usando ESTRITAMENTE as seguintes URLs reais fornecidas (nunca invente URLs externas ou inexistentes!):
${linksReais.map((l) => `- Texto: "${l.rotulo}" -> href: "${l.href}"`).join('\n')}

FORMATO DA RESPOSTA (JSON RIGOROSO):
Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "titulo": "${titulo}",
  "resumo": "Resumo envolvente de 2 a 3 frases explicando os pontos principais do artigo",
  "seoTitulo": "Título otimizado para SEO com até 60 caracteres",
  "seoDescricao": "Meta description concisa para o Google com até 155 caracteres",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "capaAlt": "Descrição acessível e detalhada da imagem de capa",
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

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modeloId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptRedacao }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Erro na API do Gemini (${res.status}): ${errText}`)
    }

    const data = await res.json()
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
            content: sec.itensLista.map((item: string) => ({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: item }],
                },
              ],
            })),
          })
        }
      })
    }

    if (gerado.artigoFormatado?.codigoOuVerso) {
      if (eFe) {
        contentNodes.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: gerado.artigoFormatado.codigoOuVerso }],
            },
          ],
        })
      } else {
        contentNodes.push({
          type: 'codeBlock',
          attrs: { language: 'typescript' },
          content: [{ type: 'text', text: gerado.artigoFormatado.codigoOuVerso }],
        })
      }
    }

    if (gerado.artigoFormatado?.conclusao) {
      contentNodes.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Conclusão e Próximos Passos' }],
      })

      gerado.artigoFormatado.conclusao.forEach((pText: string) => {
        contentNodes.push({
          type: 'paragraph',
          content: [{ type: 'text', text: pText }],
        })
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

    const capaUrl = `https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop`

    const postFinal: ResultadoPostIa = {
      titulo,
      slug,
      categoria,
      resumo: gerado.resumo || `Artigo completo sobre ${titulo}.`,
      seoTitulo: gerado.seoTitulo || titulo,
      seoDescricao: gerado.seoDescricao || gerado.resumo,
      tags: Array.isArray(gerado.tags) ? gerado.tags : ['tecnologia', 'artigo'],
      capaUrl,
      capaAlt: gerado.capaAlt || `Imagem de capa ilustrativa para o post ${titulo}`,
      contentJson,
      minutosDeLeitura: gerado.minutosDeLeitura || 8,
    }

    return { ok: true, post: postFinal }
  } catch (error: any) {
    console.error('[Action Gerar Post IA] Erro:', error)
    return { ok: false, erro: error.message || 'Falha ao gerar post completo com IA.' }
  }
}
