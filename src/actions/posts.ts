'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/require-admin'
import {
  LIMITES,
  REGEX_SLUG,
  STATUS_QUE_EXIGEM_DATA,
  VALORES_CATEGORIA,
  VALORES_STATUS,
  campoDataParaIso,
  type Categoria,
  type StatusPost,
} from '@/lib/blog/constantes'
import { ConteudoInvalido, derivarConteudo } from '@/lib/blog/derivar'
import { revalidarBlog } from '@/lib/blog/revalidar'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Actions do blog.
 *
 * `await requireAdmin()` é a PRIMEIRA linha de cada action exportada, sem
 * exceção. Não é redundância com o proxy nem com o layout: uma Server Action é
 * um endpoint POST com id estável, alcançável por curl sem passar por página
 * nenhuma. O proxy só sabe dizer "tem cookie"; quem sabe dizer "é admin" é o
 * banco, via `public.is_admin()`.
 *
 * Todas usam o cliente com o JWT do admin (`lib/supabase/server`), nunca o
 * `createAdminClient()`. Assim o RLS continua sendo a última linha de defesa —
 * se um bug deixar passar um usuário comum aqui, o banco ainda recusa.
 */

// ─── Estado devolvido à UI ───────────────────────────────────────────────────
export type EstadoPost = {
  /** Erro geral (banco, permissão, conteúdo). Vai para o alerta do topo. */
  erro?: string
  /** Erro por campo. Chave = `name` do input. Vai para baixo do campo. */
  erros?: Record<string, string>
  ok?: boolean
  mensagem?: string
  /** ISO do momento do save, para a UI mostrar "salvo às HH:mm". */
  salvoEm?: string
}

// ─── Tipos das leituras ──────────────────────────────────────────────────────
/**
 * Só o que as actions precisam ler de volta. Escrito à mão porque o projeto não
 * gera tipos do banco: sem isso `data` é `any` e o compilador para de ajudar.
 */
type LinhaAtual = {
  slug: string
  status: StatusPost
  published_at: string | null
  content_text: string
}

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CAMPOS_ATUAIS = 'slug, status, published_at, content_text'

// ─── Validação ───────────────────────────────────────────────────────────────
const esquemaPost = z.object({
  titulo: z
    .string()
    .min(LIMITES.tituloMin, `O título precisa de pelo menos ${LIMITES.tituloMin} caracteres.`)
    .max(LIMITES.tituloMax, `O título passa de ${LIMITES.tituloMax} caracteres.`),
  slug: z
    .string()
    .min(LIMITES.slugMin, `O slug precisa de pelo menos ${LIMITES.slugMin} caracteres.`)
    .max(LIMITES.slugMax, `O slug passa de ${LIMITES.slugMax} caracteres.`)
    .regex(REGEX_SLUG, 'Use só minúsculas, números e hífen simples entre palavras.'),
  resumo: z.string().max(LIMITES.resumoMax, `O resumo passa de ${LIMITES.resumoMax} caracteres.`),
  categoria: z.enum(VALORES_CATEGORIA),
  status: z.enum(VALORES_STATUS),
  capaUrl: z.string(),
  capaAlt: z.string().max(300, 'O texto alternativo está longo demais.'),
  seoTitulo: z.string().max(200, 'O título de SEO passa de 200 caracteres.'),
  seoDescricao: z
    .string()
    .max(LIMITES.seoDescricaoMax, `A descrição de SEO passa de ${LIMITES.seoDescricaoMax} caracteres.`),
})

type CamposValidados = {
  titulo: string
  slug: string
  resumo: string | null
  categoria: Categoria
  tags: string[]
  capaUrl: string | null
  capaAlt: string | null
  seoTitulo: string | null
  seoDescricao: string | null
  noindex: boolean
  status: StatusPost
  publicadoEm: string | null
  conteudo: unknown
}

function texto(formData: FormData, nome: string): string {
  const valor = formData.get(nome)
  return typeof valor === 'string' ? valor.trim() : ''
}

/** Campo vazio vira NULL no banco, e não string vazia. */
function ouNulo(valor: string): string | null {
  return valor ? valor : null
}

/**
 * "ia, automação, N8N" → ['ia', 'automação', 'n8n'].
 * Minúsculas para "IA" e "ia" não virarem duas tags distintas no filtro.
 */
function normalizarTags(bruto: string): string[] {
  const vistas = new Set<string>()

  for (const pedaco of bruto.split(',')) {
    const tag = pedaco.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40)
    if (tag) vistas.add(tag)
    if (vistas.size >= 12) break
  }

  return [...vistas]
}

function urlDeCapaValida(valor: string): boolean {
  if (!valor) return false
  if (valor.startsWith('/') || valor.startsWith('data:image/')) return true
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * FormData → campos validados, ou os erros por campo.
 *
 * Nunca lê `content_html` nem `content_text` do formulário: os dois são
 * derivados de `content_json` aqui no servidor, por `lib/blog/derivar`.
 */
function validarFormulario(
  formData: FormData,
): { ok: true; campos: CamposValidados } | { ok: false; estado: EstadoPost } {
  const erros: Record<string, string> = {}

  const resultado = esquemaPost.safeParse({
    titulo: texto(formData, 'titulo'),
    slug: texto(formData, 'slug').toLowerCase(),
    resumo: texto(formData, 'resumo'),
    categoria: texto(formData, 'categoria'),
    status: texto(formData, 'status'),
    capaUrl: texto(formData, 'capa_url'),
    capaAlt: texto(formData, 'capa_alt'),
    seoTitulo: texto(formData, 'seo_titulo'),
    seoDescricao: texto(formData, 'seo_descricao'),
  })

  if (!resultado.success) {
    // Primeira mensagem por campo: mostrar três erros no mesmo input só polui.
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? '')
      if (campo && !erros[campo]) erros[campo] = problema.message
    }
  }

  // ── Conteúdo ───────────────────────────────────────────────────────────────
  let conteudo: unknown = null
  const conteudoBruto = formData.get('conteudo')

  if (typeof conteudoBruto !== 'string' || !conteudoBruto) {
    erros.conteudo = 'O conteúdo não chegou. Recarregue a página e tente de novo.'
  } else {
    try {
      conteudo = JSON.parse(conteudoBruto)
    } catch {
      erros.conteudo = 'O conteúdo chegou corrompido. Recarregue a página e tente de novo.'
    }
  }

  // Sem o parse bem-sucedido do zod não dá para seguir com as regras cruzadas.
  if (!resultado.success) {
    return { ok: false, estado: { erro: 'Confira os campos destacados.', erros } }
  }

  const dados = resultado.data

  // ── Capa ───────────────────────────────────────────────────────────────────
  if (dados.capaUrl && !urlDeCapaValida(dados.capaUrl)) {
    erros.capa_url = 'Informe uma URL http(s) completa.'
  }

  // Texto alternativo obrigatório quando há capa: sem ele a imagem é invisível
  // para leitor de tela e some sem explicação quando não carrega.
  if (dados.capaUrl && !dados.capaAlt) {
    erros.capa_alt = 'Descreva a imagem de capa — é obrigatório para acessibilidade.'
  }

  // ── Data de publicação ─────────────────────────────────────────────────────
  const dataBruta = texto(formData, 'publicado_em')
  let publicadoEm = campoDataParaIso(dataBruta)

  if (dataBruta && !publicadoEm) {
    erros.publicado_em = 'Data inválida.'
  }

  if (STATUS_QUE_EXIGEM_DATA.includes(dados.status)) {
    if (dados.status === 'scheduled' && !publicadoEm) {
      erros.publicado_em = 'Um post agendado precisa de data e hora.'
    }
    // `posts_published_needs_date` recusa 'published' sem data. Publicar sem
    // preencher o campo é o caso comum, então assume-se agora em vez de errar.
    if (dados.status === 'published' && !publicadoEm) {
      publicadoEm = new Date().toISOString()
    }
  }

  if (Object.keys(erros).length > 0) {
    return { ok: false, estado: { erro: 'Confira os campos destacados.', erros } }
  }

  return {
    ok: true,
    campos: {
      titulo: dados.titulo,
      slug: dados.slug,
      resumo: ouNulo(dados.resumo),
      categoria: dados.categoria,
      tags: normalizarTags(texto(formData, 'tags')),
      capaUrl: ouNulo(dados.capaUrl),
      // Sem capa, o texto alternativo não descreve nada — não fica órfão no banco.
      capaAlt: dados.capaUrl ? ouNulo(dados.capaAlt) : null,
      seoTitulo: ouNulo(dados.seoTitulo),
      seoDescricao: ouNulo(dados.seoDescricao),
      noindex: formData.get('noindex') === 'on',
      status: dados.status,
      publicadoEm,
      conteudo,
    },
  }
}

// ─── Erros do banco ──────────────────────────────────────────────────────────
type ErroBanco = { code?: string; message?: string }

/**
 * Traduz o erro do Postgres para algo acionável.
 *
 * Sem isto o usuário vê "duplicate key value violates unique constraint
 * posts_slug_key" e não tem como saber que o problema é o campo slug.
 */
function traduzirErro(erro: ErroBanco): EstadoPost {
  const codigo = erro.code ?? ''
  const mensagem = erro.message ?? ''

  if (codigo === '23505') {
    return {
      erro: 'Já existe um post com este slug.',
      erros: { slug: 'Este slug já está em uso. Escolha outro.' },
    }
  }

  if (codigo === '23514') {
    return { erro: `O banco recusou os dados (restrição ${mensagem.slice(0, 120)}).` }
  }

  // 42501 = insufficient_privilege. PGRST301 = JWT expirado no PostgREST.
  if (codigo === '42501' || codigo === 'PGRST301') {
    return { erro: 'Sua sessão perdeu a permissão. Entre de novo e repita a operação.' }
  }

  return { erro: mensagem ? `Falha ao gravar: ${mensagem}` : 'Falha ao gravar no banco.' }
}

// ─── Revalidação ─────────────────────────────────────────────────────────────

// ─── Revisão ─────────────────────────────────────────────────────────────────
/**
 * Grava o histórico. Falhar aqui NÃO derruba o save: perder o histórico é ruim,
 * perder o texto que a pessoa acabou de escrever é pior. O retorno diz se deu
 * certo para a UI poder avisar, em vez de a falha sumir.
 */
async function registrarRevisao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  titulo: string,
  conteudo: unknown,
  autorId: string,
): Promise<boolean> {
  const { error } = await supabase.from('post_revisions').insert({
    post_id: postId,
    title: titulo,
    content_json: conteudo,
    created_by: autorId,
  })

  return !error
}

// ─── Actions ─────────────────────────────────────────────────────────────────
/** Cria o post e leva o usuário para o editor dele. */
export async function criarPost(_anterior: EstadoPost, formData: FormData): Promise<EstadoPost> {
  const claims = await requireAdmin()

  const validacao = validarFormulario(formData)
  if (!validacao.ok) return validacao.estado

  const campos = validacao.campos

  let derivado
  try {
    derivado = derivarConteudo(campos.conteudo)
  } catch (erro) {
    if (erro instanceof ConteudoInvalido) return { erro: erro.message }
    throw erro
  }

  if (derivado.palavras === 0 && STATUS_QUE_EXIGEM_DATA.includes(campos.status)) {
    return {
      erro: 'Escreva o conteúdo antes de publicar ou agendar.',
      erros: { conteudo: 'O post está vazio.' },
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .insert({
      slug: campos.slug,
      title: campos.titulo,
      excerpt: campos.resumo,
      content_json: campos.conteudo,
      content_html: derivado.html,
      content_text: derivado.texto,
      cover_url: campos.capaUrl,
      cover_alt: campos.capaAlt,
      category: campos.categoria,
      tags: campos.tags,
      reading_minutes: derivado.minutos,
      status: campos.status,
      published_at: campos.publicadoEm,
      seo_title: campos.seoTitulo,
      seo_description: campos.seoDescricao,
      noindex: campos.noindex,
      author_id: claims.sub,
    })
    .select('id')
    .single()

  if (error) return traduzirErro(error)

  const criado = data as { id: string }

  await registrarRevisao(supabase, criado.id, campos.titulo, campos.conteudo, claims.sub)

  if (campos.status === 'published') revalidarBlog([campos.slug])

  // Fora de qualquer try: `redirect` sinaliza com uma exceção de controle de
  // fluxo, e um catch por perto a engoliria.
  redirect(`/admin/posts/${criado.id}`)
}

/** Salva o post inteiro e grava uma revisão. */
export async function salvarPost(_anterior: EstadoPost, formData: FormData): Promise<EstadoPost> {
  const claims = await requireAdmin()

  const id = texto(formData, 'id')
  if (!REGEX_UUID.test(id)) return { erro: 'Post inválido.' }

  const validacao = validarFormulario(formData)
  if (!validacao.ok) return validacao.estado

  const campos = validacao.campos

  let derivado
  try {
    derivado = derivarConteudo(campos.conteudo)
  } catch (erro) {
    if (erro instanceof ConteudoInvalido) return { erro: erro.message }
    throw erro
  }

  if (derivado.palavras === 0 && STATUS_QUE_EXIGEM_DATA.includes(campos.status)) {
    return {
      erro: 'Escreva o conteúdo antes de publicar ou agendar.',
      erros: { conteudo: 'O post está vazio.' },
    }
  }

  const supabase = await createClient()

  // Lê o estado anterior ANTES de gravar: é o que permite revalidar a URL
  // antiga quando o slug muda, e o que confirma que o post existe (e que o RLS
  // deixa este usuário vê-lo).
  const { data: antesBruto, error: erroLeitura } = await supabase
    .from('posts')
    .select(CAMPOS_ATUAIS)
    .eq('id', id)
    .maybeSingle()

  if (erroLeitura) return traduzirErro(erroLeitura)

  const antes = antesBruto as LinhaAtual | null
  if (!antes) return { erro: 'Post não encontrado.' }

  const { error } = await supabase
    .from('posts')
    .update({
      slug: campos.slug,
      title: campos.titulo,
      excerpt: campos.resumo,
      content_json: campos.conteudo,
      content_html: derivado.html,
      content_text: derivado.texto,
      cover_url: campos.capaUrl,
      cover_alt: campos.capaAlt,
      category: campos.categoria,
      tags: campos.tags,
      reading_minutes: derivado.minutos,
      status: campos.status,
      published_at: campos.publicadoEm,
      seo_title: campos.seoTitulo,
      seo_description: campos.seoDescricao,
      noindex: campos.noindex,
    })
    .eq('id', id)

  if (error) return traduzirErro(error)

  const revisaoOk = await registrarRevisao(
    supabase,
    id,
    campos.titulo,
    campos.conteudo,
    claims.sub,
  )

  // Revalida se o post está público AGORA ou estava ANTES — despublicar também
  // precisa tirar a página do cache.
  if (campos.status === 'published' || antes.status === 'published') {
    revalidarBlog([campos.slug, antes.slug])
  }

  return {
    ok: true,
    salvoEm: new Date().toISOString(),
    mensagem: revisaoOk
      ? 'Post salvo.'
      : 'Post salvo, mas a revisão no histórico não foi gravada.',
  }
}

/** Publica um post já salvo. Usada pela lista e pelo cabeçalho do editor. */
export async function publicarPost(_anterior: EstadoPost, formData: FormData): Promise<EstadoPost> {
  await requireAdmin()

  const id = texto(formData, 'id')
  if (!REGEX_UUID.test(id)) return { erro: 'Post inválido.' }

  const supabase = await createClient()

  const { data: atualBruto, error: erroLeitura } = await supabase
    .from('posts')
    .select(CAMPOS_ATUAIS)
    .eq('id', id)
    .maybeSingle()

  if (erroLeitura) return traduzirErro(erroLeitura)

  const atual = atualBruto as LinhaAtual | null
  if (!atual) return { erro: 'Post não encontrado.' }

  if (!atual.content_text.trim()) {
    return { erro: 'Este post está vazio. Escreva o conteúdo antes de publicar.' }
  }

  // Republicar preserva a data original: sobrescrever com now() reordenaria o
  // blog inteiro a cada correção de digitação.
  const publicadoEm = atual.published_at ?? new Date().toISOString()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'published', published_at: publicadoEm })
    .eq('id', id)

  if (error) return traduzirErro(error)

  revalidarBlog([atual.slug])

  return { ok: true, mensagem: 'Post publicado.', salvoEm: new Date().toISOString() }
}

/** Tira o post do ar, voltando para rascunho. */
export async function despublicarPost(
  _anterior: EstadoPost,
  formData: FormData,
): Promise<EstadoPost> {
  await requireAdmin()

  const id = texto(formData, 'id')
  if (!REGEX_UUID.test(id)) return { erro: 'Post inválido.' }

  const supabase = await createClient()

  const { data: atualBruto, error: erroLeitura } = await supabase
    .from('posts')
    .select(CAMPOS_ATUAIS)
    .eq('id', id)
    .maybeSingle()

  if (erroLeitura) return traduzirErro(erroLeitura)

  const atual = atualBruto as LinhaAtual | null
  if (!atual) return { erro: 'Post não encontrado.' }

  // `published_at` fica como está. O CHECK só o exige para published/scheduled,
  // e guardá-lo preserva a data original caso o post volte ao ar.
  const { error } = await supabase.from('posts').update({ status: 'draft' }).eq('id', id)

  if (error) return traduzirErro(error)

  revalidarBlog([atual.slug])

  return { ok: true, mensagem: 'Post despublicado.', salvoEm: new Date().toISOString() }
}

/** Exclui o post. As revisões vão junto, por ON DELETE CASCADE. */
export async function excluirPost(_anterior: EstadoPost, formData: FormData): Promise<EstadoPost> {
  await requireAdmin()

  const id = texto(formData, 'id')
  if (!REGEX_UUID.test(id)) return { erro: 'Post inválido.' }

  const supabase = await createClient()

  const { data: atualBruto, error: erroLeitura } = await supabase
    .from('posts')
    .select(CAMPOS_ATUAIS)
    .eq('id', id)
    .maybeSingle()

  if (erroLeitura) return traduzirErro(erroLeitura)

  const atual = atualBruto as LinhaAtual | null
  if (!atual) return { erro: 'Post não encontrado.' }

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) return traduzirErro(error)

  revalidarBlog([atual.slug])

  redirect('/admin/posts')
}
