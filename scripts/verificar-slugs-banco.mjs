import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY

const supabase = createClient(url, key)

async function listarSlugs() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, category')
    .order('category')

  if (error) {
    console.error(error)
    return
  }

  console.log('--- SLUGS NO BANCO DE DADOS ---')
  posts.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.category}] "${p.title}" -> /blog/${p.slug}`)
  })
}

listarSlugs()
