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

// Slugs de referência real para interlinking categorizado sem 404
const LINKS_TECH_REAIS = [
  { rotulo: 'Otimização de Banco de Dados Postgres no Supabase', href: '/blog/otimizacao-de-banco-de-dados-postgres-supabase' },
  { rotulo: 'Segurança em Aplicações Web Modernas', href: '/blog/seguranca-em-aplicacoes-web-modernas' },
  { rotulo: 'Migrando de React SPA para Next.js 16 App Router', href: '/blog/migrando-spa-para-nextjs-16' },
  { rotulo: 'RAG Empresarial com Supabase Vector', href: '/blog/rag-empresarial-com-supabase-vector' },
  { rotulo: 'Agentes de IA na automação de processos', href: '/blog/agentes-de-ia-na-automacao-de-processos' },
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
      'Nenhuma chave de API do Gemini foi configurada. Informe a sua API Key no campo acima ou defina GEMINI_API_KEY no arquivo .env.local'
    )
  }
  return key
}

/**
 * Passo 1: Analisa tendências e sugere 4 títulos de alta busca com base no tema.
 */
export async function obterSugestoesDeTitulosAction({
  tema,
  categoria,
  apiKeyInformada,
}: {
  tema: string
  categoria: Categoria
  apiKeyInformada?: string
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
}: {
  titulo: string
  tema: string
  categoria: Categoria
  apiKeyInformada?: string
}): Promise<{ ok: boolean; post?: ResultadoPostIa; erro?: string }> {
  try {
    await requireAdmin()
    const apiKey = obterApiKey(apiKeyInformada)

    const eFe = categoria === 'fe'
    const linksReais = eFe ? LINKS_FE_REAIS : LINKS_TECH_REAIS

    const promptRedacao = `Você é um autor especialista escrevendo para o blog pessoal de Márcio Rolim (Engenheiro de IA & Software e Cristão).
Você deve escrever um artigo completo, profundamente rico e articulado, com aproximadamente 1300 a 1500 palavras.

DETALHES DO ARTIGO:
- Título Escolhido: "${titulo}"
- Tema Geral: "${tema}"
- Categoria do Blog: "${categoria}" (Área: ${eFe ? 'Vida Cristã & Fé' : 'Tecnologia & Inovação'})

DIRETRIZES RÍGIDAS DE CONTEÚDO E ESTRUTURA:
1. O texto deve ter 6 a 7 seções completas com títulos H2 (nível 2) e H3 (nível 3).
2. Para posts de Tecnologia: inclua 1 bloco de código TypeScript ou SQL prático, 1 citação blockquote marcante, diagnóstico do problema e estudo de caso com métricas de performance.
3. Para posts de Fé: inclua 1 verso bíblico formatado, 1 citação blockquote reflexiva, exegese bíblica e sabedoria prática no dia a dia e trabalho.
4. LINKS INTERNOS: Insira 1 a 2 links internos usando ESTRITAMENTE as seguintes URLs reais fornecidas abaixo (nunca invente URLs inexistentes!):
${linksReais.map((l) => `- Texto: "${l.rotulo}" -> href: "${l.href}"`).join('\n')}

FORMATO DA RESPOSTA:
Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema rigoroso:
{
  "titulo": "${titulo}",
  "resumo": "Resumo envolvente de 2 frases em tom jornalístico",
  "seoTitulo": "Título otimizado para SEO com até 60 caracteres",
  "seoDescricao": "Meta description para o Google de até 155 caracteres",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "capaAlt": "Descrição acessível e detalhada da imagem de capa",
  "minutosDeLeitura": 8,
  "artigoFormatado": {
    "introducao": ["paragrafo 1 completo", "paragrafo 2 completo"],
    "secoes": [
      {
        "tituloH2": "1. Nome da Seção H2",
        "paragrafos": ["paragrafo A", "paragrafo B"],
        "subsecaoH3": "Nome da Subseção H3",
        "itensLista": ["item 1", "item 2", "item 3"]
      }
    ],
    "codigoOuVerso": "Código ou Citação Bíblica em destaque",
    "blockquote": "Frase de destaque para blockquote",
    "conclusao": ["paragrafo final 1", "paragrafo final 2"]
  }
}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    // Converte a estrutura recebida em formato Tiptap JSON (doc)
    const contentNodes: any[] = []

    // 1. Introdução
    if (gerado.artigoFormatado?.introducao) {
      gerado.artigoFormatado.introducao.forEach((pText: string) => {
        contentNodes.push({
          type: 'paragraph',
          content: [{ type: 'text', text: pText }],
        })
      })
    }

    // Blockquote inicial
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

    // 2. Seções H2 e H3
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
            // Tenta inserir 1 link interno real no meio do texto se for apropriado
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

    // Bloco de Código ou Escritura Bíblica
    if (gerado.artigoFormatado?.codigoOuVerso) {
      contentNodes.push({
        type: 'codeBlock',
        attrs: { language: eFe ? 'markdown' : 'typescript' },
        content: [{ type: 'text', text: gerado.artigoFormatado.codigoOuVerso }],
      })
    }

    // 3. Conclusão
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

    // Gera um slug amigável
    const slug = titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Seleciona URL de imagem temática de alta resolução via Unsplash / Curada
    const imagemKeyword = eFe ? 'bible,faith,inspiration' : 'technology,ai,workspace'
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
