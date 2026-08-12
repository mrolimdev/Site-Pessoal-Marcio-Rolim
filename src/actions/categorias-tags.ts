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
  cor: string
}

export type EstatisticaRamoCategoria = {
  titulo: string
  chaveRamo: 'tecnologia_ia' | 'fe_vida_crista'
  descricao: string
  totalPosts: number
  publicados: number
  rascunhos: number
  subcategorias: EstatisticaCategoria[]
}

export type RespostaEstatisticasCategorias = {
  subcategorias: EstatisticaCategoria[]
  ramos: EstatisticaRamoCategoria[]
}

export type EstatisticaTag = {
  tag: string
  totalPosts: number
  publicados: number
  rascunhos: number
}

const METADADOS_CATEGORIAS: Record<
  Categoria,
  { descricao: string; cor: string }
> = {
  tecnologia: {
    descricao: 'Artigos sobre engenharia de software, desenvolvimento web, arquitetura e infraestrutura.',
    cor: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400',
  },
  ia: {
    descricao: 'Inteligência Artificial, modelos LLM, engenharia de prompt e agentes autônomos.',
    cor: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400',
  },
  automacao: {
    descricao: 'Workflows automatizados, n8n, integração de APIs e otimização de processos digitais.',
    cor: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400',
  },
  negocios: {
    descricao: 'Empreendedorismo, estratégias de negócios, gestão de produtos e liderança técnica.',
    cor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  },
  fe: {
    descricao: 'Estudos bíblicos, vida cristã, teologia prática e reflexões de fé no cotidiano.',
    cor: 'from-amber-600/20 to-yellow-600/20 border-amber-600/30 text-amber-700 dark:text-amber-300',
  },
}

/**
 * Retorna as estatísticas detalhadas de todas as categorias do blog (organizadas hierarquicamente em ramos e subcategorias).
 */
export async function obterEstatisticasCategorias(): Promise<RespostaEstatisticasCategorias> {
  await requireAdmin()
  const supabase = await createClient()

  // 1. Busca estatísticas dos posts no banco
  const { data: posts } = await supabase.from('posts').select('category, status')

  const estatisticas: Record<string, { total: number; publicados: number; rascunhos: number }> = {}

  if (posts) {
    posts.forEach((p) => {
      const cat = p.category as string
      if (!estatisticas[cat]) {
        estatisticas[cat] = { total: 0, publicados: 0, rascunhos: 0 }
      }
      estatisticas[cat].total++
      if (p.status === 'published') estatisticas[cat].publicados++
      else estatisticas[cat].rascunhos++
    })
  }

  // 2. Tenta buscar categorias cadastradas na tabela public.categories
  const { data: catsDoBanco } = await supabase
    .from('categories')
    .select('id, name, description, parent_id, color')

  let subcategoriasList: EstatisticaCategoria[] = []
  let ramos: EstatisticaRamoCategoria[] = []

  if (catsDoBanco && catsDoBanco.length > 0) {
    // Separa Categoriapai (parent_id IS NULL) e Subcategorias
    const paisDoBanco = catsDoBanco.filter((c) => !c.parent_id)
    const subsDoBanco = catsDoBanco.filter((c) => Boolean(c.parent_id))

    subcategoriasList = subsDoBanco.map((sub) => ({
      id: sub.id as Categoria,
      nome: sub.name,
      descricao: sub.description || 'Subcategoria de artigos.',
      cor: sub.color || 'from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-600',
      totalPosts: estatisticas[sub.id]?.total || 0,
      publicados: estatisticas[sub.id]?.publicados || 0,
      rascunhos: estatisticas[sub.id]?.rascunhos || 0,
    }))

    ramos = paisDoBanco.map((pai) => {
      const subsDoPai = subcategoriasList.filter((s) => {
        const itemObj = subsDoBanco.find((b) => b.id === s.id)
        return itemObj?.parent_id === pai.id
      })

      return {
        titulo: pai.name,
        chaveRamo: pai.id as any,
        descricao: pai.description || 'Categoria Pai',
        totalPosts: subsDoPai.reduce((acc, c) => acc + c.totalPosts, 0),
        publicados: subsDoPai.reduce((acc, c) => acc + c.publicados, 0),
        rascunhos: subsDoPai.reduce((acc, c) => acc + c.rascunhos, 0),
        subcategorias: subsDoPai,
      }
    })
  } else {
    // Fallback estático caso a migration ainda não tenha sido rodada
    subcategoriasList = VALORES_CATEGORIA.map((cat) => ({
      id: cat,
      nome: ROTULO_CATEGORIA[cat] || cat,
      descricao: METADADOS_CATEGORIAS[cat]?.descricao || 'Categoria de artigos.',
      cor: METADADOS_CATEGORIAS[cat]?.cor || 'from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-600',
      totalPosts: estatisticas[cat]?.total || 0,
      publicados: estatisticas[cat]?.publicados || 0,
      rascunhos: estatisticas[cat]?.rascunhos || 0,
    }))

    const subsTech = subcategoriasList.filter((s) => s.id !== 'fe')
    const subsFe = subcategoriasList.filter((s) => s.id === 'fe')

    ramos = [
      {
        titulo: 'Tecnologia & IA',
        chaveRamo: 'tecnologia_ia',
        descricao: 'Grande área dedicada a Engenharia de Software, Agentes de IA, Automações e Estratégia Digital.',
        totalPosts: subsTech.reduce((acc, c) => acc + c.totalPosts, 0),
        publicados: subsTech.reduce((acc, c) => acc + c.publicados, 0),
        rascunhos: subsTech.reduce((acc, c) => acc + c.rascunhos, 0),
        subcategorias: subsTech,
      },
      {
        titulo: 'Vida Cristã & Fé',
        chaveRamo: 'fe_vida_crista',
        descricao: 'Grande área dedicada a Estudos Bíblicos, Teologia Prática e Reflexões sobre Fé no Cotidiano.',
        totalPosts: subsFe.reduce((acc, c) => acc + c.totalPosts, 0),
        publicados: subsFe.reduce((acc, c) => acc + c.publicados, 0),
        rascunhos: subsFe.reduce((acc, c) => acc + c.rascunhos, 0),
        subcategorias: subsFe,
      },
    ]
  }

  return {
    subcategorias: subcategoriasList,
    ramos,
  }
}

/**
 * Salva (cria ou edita) uma Categoria Pai ou Subcategoria.
 */
export async function salvarCategoriaAction({
  id,
  nome,
  descricao,
  parentId,
  isParent,
}: {
  id: string
  nome: string
  descricao: string
  parentId?: string | null
  isParent?: boolean
}): Promise<{ ok: boolean; erro?: string }> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const slugLimpo = id
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]+/g, '-')

    if (!slugLimpo) {
      return { ok: false, erro: 'Informe um identificador/slug válido para a categoria.' }
    }

    if (!nome.trim()) {
      return { ok: false, erro: 'Informe um nome legível para a categoria.' }
    }

    const payload = {
      id: slugLimpo,
      name: nome.trim(),
      description: descricao.trim(),
      parent_id: isParent ? null : parentId || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('categories').upsert(payload, { onConflict: 'id' })

    if (error) {
      console.error('[salvarCategoriaAction] Erro no Supabase:', error)
      return { ok: false, erro: `Falha ao salvar no banco: ${error.message}` }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/admin/posts')
    revalidatePath('/blog')
    return { ok: true }
  } catch (err: any) {
    console.error('[salvarCategoriaAction] Exceção:', err)
    return { ok: false, erro: err.message || 'Falha ao salvar categoria.' }
  }
}

/**
 * Exclui uma subcategoria ou categoria pai.
 */
export async function excluirCategoriaAction({
  id,
}: {
  id: string
}): Promise<{ ok: boolean; erro?: string }> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Realoca posts vinculados a esta subcategoria para a categoria 'tecnologia' padrão
    await supabase.from('posts').update({ category: 'tecnologia' }).eq('category', id)

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
      console.error('[excluirCategoriaAction] Erro no Supabase:', error)
      return { ok: false, erro: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/admin/posts')
    revalidatePath('/blog')
    return { ok: true }
  } catch (err: any) {
    console.error('[excluirCategoriaAction] Exceção:', err)
    return { ok: false, erro: err.message || 'Falha ao excluir categoria.' }
  }
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
