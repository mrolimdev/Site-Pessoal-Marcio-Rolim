import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY

if (!url || !key) {
  console.error('ERRO: Variaveis SUPABASE nao encontradas em .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

function extrairTextoDoJson(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.type === 'text' && node.text) return node.text
  if (Array.isArray(node)) return node.map(extrairTextoDoJson).join(' ')
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extrairTextoDoJson).join(' ')
  }
  return ''
}

function contarPalavras(texto) {
  if (!texto) return 0
  const limpo = texto.replace(/<[^>]*>/g, ' ').replace(/[#*`_~]/g, ' ')
  const palavras = limpo.trim().split(/\s+/)
  return palavras.filter((p) => p.length > 0).length
}

async function relatorioContagemPalavras() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('title, category, content_json, content_text, excerpt, slug')
    .eq('status', 'published')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (error) {
    console.error('Erro ao buscar posts:', error.message)
    process.exit(1)
  }

  console.log('\n=============================================================')
  console.log('📊 RELATÓRIO DE CONTAGEM DE PALAVRAS DE CADA POST DO BLOG')
  console.log('=============================================================\n')

  let totalGeralPalavras = 0
  const categoriasMap = {
    ia: '💻 IA Generativa',
    automacao: '💻 Automação',
    tecnologia: '💻 Engenharia & Web',
    negocios: '💻 Estratégia & Negócios',
    fe: '✝️ Vida Cristã & Fé',
  }

  const postsFormatados = posts.map((post, index) => {
    const textoCorpo = extrairTextoDoJson(post.content_json) || post.content_text || ''
    const qtdTitulo = contarPalavras(post.title)
    const qtdResumo = contarPalavras(post.excerpt)
    const qtdCorpo = contarPalavras(textoCorpo)
    const totalPost = qtdTitulo + qtdResumo + qtdCorpo

    totalGeralPalavras += totalPost

    return {
      index: index + 1,
      titulo: post.title,
      categoria: categoriasMap[post.category] || post.category,
      palavras: totalPost,
    }
  })

  postsFormatados.forEach((item) => {
    const num = item.index.toString().padStart(2, '0')
    console.log(`${num}. [${item.categoria}]`)
    console.log(`    📌 ${item.titulo}`)
    console.log(`    📊 Contagem: ${item.palavras.toLocaleString('pt-BR')} palavras\n`)
  })

  console.log('-------------------------------------------------------------')
  console.log(`📈 TOTAL DE ARTIGOS PUBLICADOS: ${posts.length}`)
  console.log(`📝 TOTAL GERAL DE PALAVRAS DO BLOG: ${totalGeralPalavras.toLocaleString('pt-BR')} palavras`)
  console.log(`📏 MÉDIA GERAL POR ARTIGO: ${Math.round(totalGeralPalavras / posts.length).toLocaleString('pt-BR')} palavras`)
  console.log('-------------------------------------------------------------\n')
}

relatorioContagemPalavras()
