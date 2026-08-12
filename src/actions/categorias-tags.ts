'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { ROTULO_CATEGORIA, VALORES_CATEGORIA, type Categoria } from '@/lib/blog/constantes'

export type EstatisticaCategoria = {
  id: Categoria
  nome: string
  descricao: string
  totalPosts: number
  publicados: number
  rascunhos: number
  icone: string
  cor: string
}

export type EstatisticaTag = {
  tag: string
  totalPosts: number
  publicados: number
  rascunhos: number
}

const METADADOS_CATEGORIAS: Record<
  Categoria,
  { descricao: string; icone: string; cor: string }
> = {
  tecnologia: {
    descricao: 'Artigos sobre engenharia de software, desenvolvimento web, arquitetura e infraestrutura.',
    icone: '💻',
    cor: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400',
  },
  ia: {
    descricao: 'Inteligência Artificial, modelos LLM, engenharia de prompt e agentes autônomos.',
    icone: '🤖',
    cor: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400',
  },
  automacao: {
    descricao: 'Workflows automatizados, n8n, integração de APIs e otimização de processos digitais.',
    icone: '⚡',
    cor: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400',
  },
  negocios: {
    descricao: 'Empreendedorismo, estratégias de negócios, gestão de produtos e liderança técnica.',
    icone: '📈',
    cor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  },
  fe: {
    descricao: 'Estudos bíblicos, vida cristã, teologia prática e reflexões de fé no cotidiano.',
    icone: '✝️',
    cor: 'from-amber-600/20 to-yellow-600/20 border-amber-600/30 text-amber-700 dark:text-amber-300',
  },
}

/**
 * Retorna as estatísticas detalhadas de todas as categorias do blog.
 */
export async function obterEstatisticasCategorias(): Promise<EstatisticaCategoria[]> {
  await requireAdmin()
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('category, status')

  if (error) {
    console.error('Erro ao buscar posts para estatísticas de categorias:', error)
  }

  const estatisticas: Record<string, { total: number; publicados: number; rascunhos: number }> = {}

  VALORES_CATEGORIA.forEach((cat) => {
    estatisticas[cat] = { total: 0, publicados: 0, rascunhos: 0 }
  })

  if (posts) {
    posts.forEach((p) => {
      const cat = p.category as Categoria
      if (!estatisticas[cat]) {
        estatisticas[cat] = { total: 0, publicados: 0, rascunhos: 0 }
      }
      estatisticas[cat].total++
      if (p.status === 'published') estatisticas[cat].publicados++
      else estatisticas[cat].rascunhos++
    })
  }

  return VALORES_CATEGORIA.map((cat) => ({
    id: cat,
    nome: ROTULO_CATEGORIA[cat] || cat,
    descricao: METADADOS_CATEGORIAS[cat]?.descricao || 'Categoria de artigos.',
    icone: METADADOS_CATEGORIAS[cat]?.icone || '📁',
    cor: METADADOS_CATEGORIAS[cat]?.cor || 'from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-600',
    totalPosts: estatisticas[cat]?.total || 0,
    publicados: estatisticas[cat]?.publicados || 0,
    rascunhos: estatisticas[cat]?.rascunhos || 0,
  }))
}

/**
 * Retorna a lista de todas as tags e a contagem de posts onde cada uma é usada.
 */
export async function obterEstatisticasTags(): Promise<EstatisticaTag[]> {
  await requireAdmin()
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('tags, status')

  if (error) {
    console.error('Erro ao buscar posts para estatísticas de tags:', error)
    return []
  }

  const mapaTags = new Map<string, { total: number; publicados: number; rascunhos: number }>()

  if (posts) {
    posts.forEach((p) => {
      const listaTags = Array.isArray(p.tags) ? p.tags : []
      listaTags.forEach((t: string) => {
        const tagLimpa = t.trim().toLowerCase()
        if (!tagLimpa) return

        const atual = mapaTags.get(tagLimpa) || { total: 0, publicados: 0, rascunhos: 0 }
        atual.total++
        if (p.status === 'published') atual.publicados++
        else atual.rascunhos++
        mapaTags.set(tagLimpa, atual)
      })
    })
  }

  const resultado: EstatisticaTag[] = []
  mapaTags.forEach((val, tag) => {
    resultado.push({
      tag,
      totalPosts: val.total,
      publicados: val.publicados,
      rascunhos: val.rascunhos,
    })
  })

  // Ordena pelas mais usadas primeiro
  return resultado.sort((a, b) => b.totalPosts - a.totalPosts)
}

/**
 * Renomeia uma tag em todos os posts que a utilizam.
 */
export async function renomearTagAction(tagAntiga: string, novaTag: string) {
  await requireAdmin()
  const oldTag = tagAntiga.trim().toLowerCase()
  const newTag = novaTag.trim().toLowerCase()

  if (!oldTag || !newTag || oldTag === newTag) {
    return { ok: false, erro: 'Tags inválidas para renomeação.' }
  }

  const supabase = await createClient()

  // Busca todos os posts que contêm a tag antiga
  const { data: posts, error: fetchErr } = await supabase
    .from('posts')
    .select('id, tags')
    .contains('tags', [oldTag])

  if (fetchErr) {
    return { ok: false, erro: `Erro ao consultar posts: ${fetchErr.message}` }
  }

  if (!posts || posts.length === 0) {
    return { ok: true, afetados: 0, mensagem: `Nenhum post continha a tag "${oldTag}".` }
  }

  let modificados = 0

  for (const post of posts) {
    const tagsAtuais: string[] = Array.isArray(post.tags) ? post.tags : []
    const tagsAtualizadas = Array.from(
      new Set(tagsAtuais.map((t) => (t.toLowerCase() === oldTag ? newTag : t)))
    )

    const { error: updErr } = await supabase
      .from('posts')
      .update({ tags: tagsAtualizadas, updated_at: new Date().toISOString() })
      .eq('id', post.id)

    if (!updErr) modificados++
  }

  revalidatePath('/blog')
  revalidatePath('/admin/posts')
  revalidatePath('/admin/tags')

  return {
    ok: true,
    afetados: modificados,
    mensagem: `Tag "${oldTag}" foi renomeada para "${newTag}" em ${modificados} post(s).`,
  }
}

/**
 * Remove uma tag de todos os posts que a utilizam.
 */
export async function removerTagAction(tagParaRemover: string) {
  await requireAdmin()
  const targetTag = tagParaRemover.trim().toLowerCase()

  if (!targetTag) {
    return { ok: false, erro: 'Tag inválida para remoção.' }
  }

  const supabase = await createClient()

  const { data: posts, error: fetchErr } = await supabase
    .from('posts')
    .select('id, tags')
    .contains('tags', [targetTag])

  if (fetchErr) {
    return { ok: false, erro: `Erro ao consultar posts: ${fetchErr.message}` }
  }

  if (!posts || posts.length === 0) {
    return { ok: true, afetados: 0, mensagem: `Nenhum post continha a tag "${targetTag}".` }
  }

  let modificados = 0

  for (const post of posts) {
    const tagsAtuais: string[] = Array.isArray(post.tags) ? post.tags : []
    const tagsFiltradas = tagsAtuais.filter((t) => t.toLowerCase() !== targetTag)

    const { error: updErr } = await supabase
      .from('posts')
      .update({ tags: tagsFiltradas, updated_at: new Date().toISOString() })
      .eq('id', post.id)

    if (!updErr) modificados++
  }

  revalidatePath('/blog')
  revalidatePath('/admin/posts')
  revalidatePath('/admin/tags')

  return {
    ok: true,
    afetados: modificados,
    mensagem: `Tag "${targetTag}" foi removida de ${modificados} post(s).`,
  }
}
