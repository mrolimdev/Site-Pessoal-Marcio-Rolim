import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

function getEnv(key) {
  if (process.env[key]) return process.env[key]
  if (fs.existsSync('.env.local')) {
    const lines = fs.readFileSync('.env.local', 'utf8').split('\n')
    for (const line of lines) {
      if (line.startsWith(key + '=')) {
        return line.substring(key.length + 1).trim().replace(/^['"]|['"]$/g, '')
      }
    }
  }
  return ''
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('SUPABASE_SECRET_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

async function listarImagens() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, cover_url, content_json, content_html')

  if (error) {
    console.error('Erro ao buscar posts:', error)
    return
  }

  console.log(`--- CAPAS DOS ${posts.length} POSTS NO BANCO DE DADOS ---`)
  posts.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.slug}] -> ${p.cover_url || '(Sem Capa)'}`)
  })

  console.log('\n--- IMAGENS NO CORPO DOS POSTS (content_json / content_html) ---')
  for (const p of posts) {
    const str = JSON.stringify(p.content_json || {}) + ' ' + (p.content_html || '')
    const matches = str.match(/https?:\/\/[^"'\s\>\)]+/g) || []
    const imageUrls = matches.filter((u) =>
      /\.(png|jpg|jpeg|webp|gif)/i.test(u) ||
      u.includes('image') ||
      u.includes('unsplash') ||
      u.includes('pollinations') ||
      u.includes('restaure') ||
      u.includes('supabase') ||
      u.includes('r2.dev')
    )
    if (imageUrls.length > 0) {
      console.log(`\n[${p.slug}] (${imageUrls.length} links de imagem):`)
      imageUrls.forEach((u) => console.log(`  - ${u}`))
    }
  }
}

listarImagens()
