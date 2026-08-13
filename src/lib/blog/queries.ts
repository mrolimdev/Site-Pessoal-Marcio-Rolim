import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { VALORES_CATEGORIA, type Categoria } from '@/lib/blog/constantes'
import { env } from '@/lib/env'

/**
 * Consultas de LEITURA PÚBLICA do blog.
 *
 * ─── Por que um cliente próprio, e não `lib/supabase/server.ts` ───────────────
 * Aquele cliente lê `cookies()`. Duas consequências que inviabilizam estas
 * páginas:
 *   1. `cookies()` é Request-time API — o simples acesso empurra a rota para
 *      renderização dinâmica, e aí `generateStaticParams` + `revalidate` viram
 *      enfeite: nada é pré-renderizado.
 *   2. `generateStaticParams` roda no BUILD, fora de qualquer requisição.
 *      Não existe cookie para ler ali.
 *
 * O blog público não tem usuário: o papel correto é `anon`, e é exatamente o
 * que a chave publicável dá. O RLS continua valendo — a política
 * "publico le posts publicados" é a ÚNICA policy de SELECT para `anon`, então
 * rascunho, arquivado e agendado são invisíveis por construção, não por
 * disciplina de quem escreve a query.
 *
 * `createAdminClient()` não entra aqui em hipótese alguma: ele ignora RLS.
 */

// ─── Cache ───────────────────────────────────────────────────────────────────

/** Alvo de `revalidateTag()` quando o painel salvar/publicar um post. */
export const TAG_CACHE_POSTS = 'posts'

/**
 * Precisa ser IGUAL ao `export const revalidate` das páginas do blog, nunca
 * menor: o Next rebaixa a revalidação da rota inteira para o menor valor entre
 * o segmento e os fetches que ele faz. Um fetch de 60s aqui transformaria
 * `revalidate = 3600` da página em 60s sem nenhum aviso.
 */
/**
 * Em desenvolvimento ou revalidação rápida, usa 0s para que alterações no
 * banco reflitam imediatamente na página ao atualizar o navegador.
 */
const SEGUNDOS_DE_CACHE = process.env.NODE_ENV === 'development' ? 0 : 60


/**
 * O supabase-js usa o `fetch` global, que no servidor do Next é o fetch
 * instrumentado. Envolvê-lo aqui é o que coloca as respostas do PostgREST no
 * Data Cache: a listagem (que é dinâmica, por causa do `?pagina=`) passa a
 * responder sem ida ao banco, e o painel ganha `revalidateTag('posts')` como
 * botão de "publicar agora".
 */
const fetchCacheado: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    next: { revalidate: SEGUNDOS_DE_CACHE, tags: [TAG_CACHE_POSTS] },
  })

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchCacheado },
})

// ─── Tipos do domínio ────────────────────────────────────────────────────────

/**
 * A lista de categorias e os rótulos vivem em `lib/blog/constantes` — mesmo
 * vocabulário que o painel usa para validar antes de gravar. Duas listas
 * divergentes dariam uma categoria que o admin consegue salvar e o site
 * público não sabe exibir.
 *
 * A normalização existe porque o tipo do PostgREST é `string`: se um dia
 * entrar uma categoria nova pela migration antes de o site conhecer, ela cai
 * em 'tecnologia' em vez de estourar a página.
 */
function normalizarCategoria(valor: string): Categoria {
  return (VALORES_CATEGORIA as readonly string[]).includes(valor)
    ? (valor as Categoria)
    : 'tecnologia'
}

/**
 * Documento ProseMirror serializado, como o Tiptap grava em `content_json`.
 *
 * Descrito aqui em vez de importado de `@tiptap/core` de propósito: o pacote é
 * dependência transitiva (entra por @tiptap/react) e este módulo não deve
 * depender do editor para nada. O formato é estável — é o JSON do ProseMirror.
 */
export type MarcaTiptap = {
  type: string
  attrs?: Record<string, unknown>
}

export type NoTiptap = {
  type?: string
  attrs?: Record<string, unknown>
  content?: NoTiptap[]
  marks?: readonly MarcaTiptap[]
  text?: string
}

/** Documento vazio: o que devolvemos quando `content_json` vier corrompido. */
export const DOCUMENTO_VAZIO: NoTiptap = { type: 'doc', content: [] }

export type PostResumo = {
  slug: string
  titulo: string
  resumo: string | null
  capaUrl: string | null
  capaAlt: string | null
  categoria: Categoria
  tags: string[]
  minutosDeLeitura: number
  /** ISO 8601. Garantido não-nulo pelo filtro da consulta. */
  publicadoEm: string
}

export type PostCompleto = PostResumo & {
  conteudo: NoTiptap
  seoTitulo: string | null
  seoDescricao: string | null
  noindex: boolean
  atualizadoEm: string
}

export type PaginaDePosts = {
  posts: PostResumo[]
  pagina: number
  totalPaginas: number
  total: number
}

// ─── Consultas ───────────────────────────────────────────────────────────────

export const POSTS_POR_PAGINA = 9

const COLUNAS_RESUMO =
  'slug,title,excerpt,cover_url,cover_alt,category,tags,reading_minutes,published_at'

const COLUNAS_COMPLETAS = `${COLUNAS_RESUMO},content_json,seo_title,seo_description,noindex,updated_at`

type LinhaResumo = {
  slug: string
  title: string
  excerpt: string | null
  cover_url: string | null
  cover_alt: string | null
  category: string
  tags: string[] | null
  reading_minutes: number
  published_at: string
}

type LinhaCompleta = LinhaResumo & {
  content_json: unknown
  seo_title: string | null
  seo_description: string | null
  noindex: boolean
  updated_at: string
}

function paraResumo(linha: LinhaResumo): PostResumo {
  return {
    slug: linha.slug,
    titulo: linha.title,
    resumo: linha.excerpt,
    capaUrl: linha.cover_url,
    capaAlt: linha.cover_alt,
    categoria: normalizarCategoria(linha.category),
    tags: linha.tags ?? [],
    minutosDeLeitura: Math.max(1, linha.reading_minutes),
    publicadoEm: linha.published_at,
  }
}

function paraDocumento(valor: unknown): NoTiptap {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as NoTiptap)
    : DOCUMENTO_VAZIO
}

/**
 * ─── O filtro público ────────────────────────────────────────────────────────
 * Toda consulta daqui repete `.eq('status', 'published')` e
 * `.not('published_at', 'is', null)`.
 *
 * É redundante com o RLS de propósito — defesa em profundidade e, de quebra,
 * plano de query melhor: `status = 'published'` casa exatamente com o índice
 * parcial `posts_public_idx (published_at desc) where status = 'published'`.
 *
 * O que NÃO fazemos é comparar `published_at` com o relógio DESTE processo. A
 * fronteira do agendamento (`published_at <= now()`) fica onde é exata e
 * inviolável: dentro da policy, avaliada pelo Postgres. Mandar um `now()` daqui
 * acrescentaria uma diferença de relógio e, pior, um timestamp variável na URL
 * do PostgREST — o que trocaria a chave do Data Cache a cada requisição e
 * jogaria o cache inteiro fora.
 */

type OpcoesListagem = {
  pagina?: number
  porPagina?: number
  /** Filtra por tag exata (operador `@>` do array de tags). */
  tag?: string
}

/**
 * PostgREST responde **416 / PGRST103** quando o offset pedido passa do fim da
 * lista — `/blog?pagina=99` num blog de dois posts. Isso não é falha: é página
 * vazia, e a listagem tem estado próprio para ela. Verificado contra a API:
 * `{"code":"PGRST103","message":"Requested range not satisfiable"}`.
 */
const OFFSET_ALEM_DO_FIM = 'PGRST103'

/**
 * Só é chamada quando cai o 416 acima. É o preço de continuar dizendo a
 * verdade no cabeçalho ("N publicações"): na resposta de erro o supabase-js
 * ignora o `content-range`, então o total volta `null` e precisa ser refeito.
 * `head: true` traz só a contagem, sem uma linha de dado.
 */
async function contarPublicados(tag?: string): Promise<number> {
  const base = supabase
    .from('posts')
    .select('slug', { count: 'exact', head: true })
    .eq('status', 'published')
    .not('published_at', 'is', null)

  const { count } = await (tag ? base.contains('tags', [tag]) : base)

  return count ?? 0
}

/**
 * Listagem paginada, `published_at desc`.
 *
 * O desempate por `slug` não é preciosismo: sem uma segunda chave estável, dois
 * posts com o mesmo `published_at` podem trocar de lugar entre a página 1 e a
 * 2, e o visitante vê um sumindo e outro repetido.
 */
export async function listarPosts({
  pagina = 1,
  porPagina = POSTS_POR_PAGINA,
  tag,
}: OpcoesListagem = {}): Promise<PaginaDePosts> {
  const paginaSegura = Number.isFinite(pagina) && pagina >= 1 ? Math.floor(pagina) : 1
  const inicio = (paginaSegura - 1) * porPagina

  const base = supabase
    .from('posts')
    .select(COLUNAS_RESUMO, { count: 'exact' })
    .eq('status', 'published')
    .not('published_at', 'is', null)

  const { data, error, count } = await (tag ? base.contains('tags', [tag]) : base)
    .order('published_at', { ascending: false })
    .order('slug', { ascending: true })
    .range(inicio, inicio + porPagina - 1)
    .returns<LinhaResumo[]>()

  if (error) {
    if (error.code === OFFSET_ALEM_DO_FIM) {
      const totalReal = await contarPublicados(tag)
      return {
        posts: [],
        pagina: paginaSegura,
        total: totalReal,
        totalPaginas: Math.max(1, Math.ceil(totalReal / porPagina)),
      }
    }

    throw new Error(`Falha ao listar posts do blog: ${error.message}`)
  }

  const total = count ?? 0

  return {
    posts: (data ?? []).map(paraResumo),
    pagina: paginaSegura,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  }
}

/** Post individual. `null` quando não existe ou não está publicado. */
export async function obterPostPorSlug(slug: string): Promise<PostCompleto | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(COLUNAS_COMPLETAS)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .eq('slug', slug)
    .maybeSingle<LinhaCompleta>()

  if (error) {
    throw new Error(`Falha ao carregar o post "${slug}": ${error.message}`)
  }

  if (!data) return null

  return {
    ...paraResumo(data),
    conteudo: paraDocumento(data.content_json),
    seoTitulo: data.seo_title,
    seoDescricao: data.seo_description,
    noindex: data.noindex,
    atualizadoEm: data.updated_at,
  }
}

/** Teto de segurança para as consultas que varrem tudo (params estáticos, RSS). */
const LIMITE_VARREDURA = 500

/** Slugs publicados, para `generateStaticParams` do post. */
export async function listarSlugsPublicados(): Promise<string[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(LIMITE_VARREDURA)
    .returns<{ slug: string }[]>()

  if (error) {
    // Um build não pode quebrar porque o banco piscou. Sem params estáticos as
    // páginas continuam existindo: `dynamicParams` (padrão `true`) as gera sob
    // demanda na primeira visita, e daí em diante elas ficam em cache.
    console.error('[blog] generateStaticParams sem slugs:', error.message)
    return []
  }

  return (data ?? []).map((linha) => linha.slug)
}

export type ItemSitemap = {
  slug: string
  atualizadoEm: string
  publicadoEm: string
  capaUrl: string | null
  titulo: string
}

/**
 * Tudo que o sitemap precisa de cada post publicado.
 *
 * `updated_at` e não `published_at` no `lastModified`: o buscador usa esse campo
 * para decidir se vale reprocessar a página, e o que interessa a ele é quando o
 * CONTEÚDO mudou pela última vez — não quando o post estreou.
 */
export async function listarPostsParaSitemap(): Promise<ItemSitemap[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('slug, updated_at, published_at, cover_url, title, noindex')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    // Post marcado como noindex não entra: pedir indexação no sitemap e negá-la
    // na meta tag é sinal contraditório, e o Search Console reporta como erro.
    .eq('noindex', false)
    .order('published_at', { ascending: false })
    .limit(LIMITE_VARREDURA)
    .returns<
      {
        slug: string
        updated_at: string
        published_at: string
        cover_url: string | null
        title: string
      }[]
    >()

  if (error) {
    console.error('[sitemap] falha ao listar posts:', error.message)
    return []
  }

  return (data ?? []).map((linha) => ({
    slug: linha.slug,
    atualizadoEm: linha.updated_at,
    publicadoEm: linha.published_at,
    capaUrl: linha.cover_url,
    titulo: linha.title,
  }))
}

/** Tags distintas dos posts publicados, em ordem alfabética. */
export async function listarTagsPublicadas(): Promise<string[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('tags')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .limit(LIMITE_VARREDURA)
    .returns<{ tags: string[] | null }[]>()

  if (error) {
    console.error('[blog] falha ao listar tags:', error.message)
    return []
  }

  const distintas = new Set<string>()
  for (const linha of data ?? []) {
    for (const tag of linha.tags ?? []) {
      const limpa = tag.trim()
      if (limpa) distintas.add(limpa)
    }
  }

  return [...distintas].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

/** Itens do feed RSS — os mais recentes primeiro. */
export async function listarPostsParaFeed(limite = 20): Promise<PostResumo[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(COLUNAS_RESUMO)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .order('slug', { ascending: true })
    .limit(Math.min(limite, LIMITE_VARREDURA))
    .returns<LinhaResumo[]>()

  if (error) {
    throw new Error(`Falha ao montar o feed do blog: ${error.message}`)
  }

  return (data ?? []).map(paraResumo)
}

export type PostsPorSecao = {
  postsTecnologia: PostResumo[]
  postsVidaCrista: PostResumo[]
  totalTecnologia: number
  totalVidaCrista: number
}

/**
 * Busca posts agrupados nas duas seções principais:
 * - Tecnologia (categorias: tecnologia, ia, automacao, negocios)
 * - Vida Cristã (categoria: fe)
 */
export async function listarPostsAgrupadosPorSecoes(): Promise<PostsPorSecao> {
  const { data, error } = await supabase
    .from('posts')
    .select(COLUNAS_RESUMO)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .order('slug', { ascending: true })
    .limit(LIMITE_VARREDURA)
    .returns<LinhaResumo[]>()

  if (error) {
    throw new Error(`Falha ao listar posts por seção: ${error.message}`)
  }

  const todos = (data ?? []).map(paraResumo)

  const postsVidaCrista = todos.filter((p) => p.categoria === 'fe')
  const postsTecnologia = todos.filter((p) => p.categoria !== 'fe')

  return {
    postsTecnologia,
    postsVidaCrista,
    totalTecnologia: postsTecnologia.length,
    totalVidaCrista: postsVidaCrista.length,
  }
}

export type TagComContagem = {
  nome: string
  count: number
  origem?: 'tecnologia' | 'fe' | 'ambas'
}


export type CategoriaNo = {
  chave: string
  rotulo: string
  count: number
}

export type RamoCategoria = {
  titulo: string
  subcategorias: CategoriaNo[]
  totalRamo: number
}

export type DadosWidgets = {
  nuvemTags: TagComContagem[]
  arvoreCategorias: RamoCategoria[]
}

/**
 * Retorna dados estruturados para a Nuvem de Tags e a Árvore de Categorias dos Widgets do blog.
 */
export async function obterEstatisticasWidgets(): Promise<DadosWidgets> {
  const { data, error } = await supabase
    .from('posts')
    .select('category, tags')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .limit(LIMITE_VARREDURA)
    .returns<{ category: string; tags: string[] | null }[]>()

  if (error) {
    console.error('[widgets] Erro ao carregar estatísticas:', error.message)
    return { nuvemTags: [], arvoreCategorias: [] }
  }

  // 1. Contagem de Tags
  const mapaTags = new Map<string, number>()
  const mapaCategorias = new Map<string, number>()

  for (const linha of data ?? []) {
    // Categorias
    const cat = normalizarCategoria(linha.category)
    mapaCategorias.set(cat, (mapaCategorias.get(cat) ?? 0) + 1)

    // Tags
    for (const t of linha.tags ?? []) {
      const limpa = t.trim().toLowerCase()
      if (limpa) {
        mapaTags.set(limpa, (mapaTags.get(limpa) ?? 0) + 1)
      }
    }
  }

  const nuvemTags: TagComContagem[] = Array.from(mapaTags.entries())
    .map(([nome, count]) => ({ nome, count }))
    .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, 'pt-BR'))

  // 2. Árvore de Categorias Hierárquica
  const ramoTech: RamoCategoria = {
    titulo: 'Tecnologia & Inovação',
    subcategorias: [
      { chave: 'ia', rotulo: 'Inteligência Artificial', count: mapaCategorias.get('ia') ?? 0 },
      { chave: 'automacao', rotulo: 'Automação & n8n', count: mapaCategorias.get('automacao') ?? 0 },
      { chave: 'tecnologia', rotulo: 'Engenharia & Web', count: mapaCategorias.get('tecnologia') ?? 0 },
      { chave: 'negocios', rotulo: 'Estratégia & Negócios', count: mapaCategorias.get('negocios') ?? 0 },
    ],
    totalRamo:
      (mapaCategorias.get('ia') ?? 0) +
      (mapaCategorias.get('automacao') ?? 0) +
      (mapaCategorias.get('tecnologia') ?? 0) +
      (mapaCategorias.get('negocios') ?? 0),
  }

  const ramoFe: RamoCategoria = {
    titulo: 'Vida Cristã & Fé',
    subcategorias: [
      { chave: 'fe', rotulo: 'Fé, Devocional & Família', count: mapaCategorias.get('fe') ?? 0 },
    ],
    totalRamo: mapaCategorias.get('fe') ?? 0,
  }

  return {
    nuvemTags,
    arvoreCategorias: [ramoTech, ramoFe],
  }
}

/**
 * Busca 3 posts relacionados (ESTRITAMENTE dentro da mesma área: Tecnologia com Tecnologia, Fé com Fé).
 */
export async function obterPostsRelacionados(
  slugAtual: string,
  categoria: Categoria,
  limite = 3
): Promise<PostResumo[]> {
  const eFe = categoria === 'fe'

  // 1. Busca da mesma categoria exata primeiro
  const { data: daMesmaCategoria } = await supabase
    .from('posts')
    .select(COLUNAS_RESUMO)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .eq('category', categoria)
    .neq('slug', slugAtual)
    .order('published_at', { ascending: false })
    .limit(limite)
    .returns<LinhaResumo[]>()

  const resultados = (daMesmaCategoria ?? []).map(paraResumo)

  // 2. Se faltar para completar 3, busca posts dentro da MESMA ÁREA (sem misturar Fé e Tech)
  if (resultados.length < limite) {
    const slugsExistentes = new Set([slugAtual, ...resultados.map((p) => p.slug)])

    let queryComplementar = supabase
      .from('posts')
      .select(COLUNAS_RESUMO)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .neq('slug', slugAtual)

    if (eFe) {
      queryComplementar = queryComplementar.eq('category', 'fe')
    } else {
      queryComplementar = queryComplementar.neq('category', 'fe')
    }

    const { data: complementares } = await queryComplementar
      .order('published_at', { ascending: false })
      .limit(limite * 3)
      .returns<LinhaResumo[]>()

    for (const linha of complementares ?? []) {
      if (resultados.length >= limite) break
      if (!slugsExistentes.has(linha.slug)) {
        slugsExistentes.add(linha.slug)
        resultados.push(paraResumo(linha))
      }
    }
  }

  return resultados
}

/**
 * Retorna os N posts publicados mais recentes para o carrossel da Homepage.
 */
export async function obterPostsRecentesHomepage(limite: number = 6): Promise<PostResumo[]> {
  const agora = new Date().toISOString()
  const { data } = await supabase
    .from('posts')
    .select(COLUNAS_RESUMO)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', agora)
    .order('published_at', { ascending: false })
    .limit(limite)
    .returns<LinhaResumo[]>()

  if (!data) return []
  return data.map(paraResumo)
}



