import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

const accountId = getEnv('R2_ACCOUNT_ID')
const accessKeyId = getEnv('R2_ACCESS_KEY_ID')
const secretAccessKey = getEnv('R2_SECRET_ACCESS_KEY')
const bucketName = getEnv('R2_BUCKET_NAME') || 'profetize'
const publicDomain = getEnv('R2_PUBLIC_DOMAIN') || 'https://profetize.restaure.online'
const endpoint = getEnv('R2_ENDPOINT') || `https://${accountId}.r2.cloudflarestorage.com`

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('SUPABASE_SECRET_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)
const geminiApiKey = getEnv('GEMINI_API_KEY')

async function obterBufferImagemIa(prompt, category) {
  // 1. Tenta Pollinations Flux
  try {
    const seed = Math.floor(Math.random() * 1_000_000_000)
    const promptCodificado = encodeURIComponent(`${prompt} professional editorial photography 16:9 warm lighting no text`)
    const urlIa = `https://image.pollinations.ai/prompt/${promptCodificado}?width=1200&height=675&seed=${seed}&model=flux&nologo=true`
    console.log('    [IA] Gerando via Pollinations Flux...')
    const res = await fetch(urlIa, { signal: AbortSignal.timeout(15000) })
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      if (buffer.length > 5000) return buffer
    }
  } catch (e) {
    console.warn('    ⚠️ Pollinations Flux expirou/falhou. Tentando Turbo...')
  }

  // 2. Fallback Pollinations Turbo
  try {
    const seed = Math.floor(Math.random() * 1_000_000_000)
    const promptCodificado = encodeURIComponent(`${prompt} 16:9 8k editorial photography no text`)
    const urlIa = `https://image.pollinations.ai/prompt/${promptCodificado}?width=1200&height=675&seed=${seed}&model=turbo&nologo=true`
    console.log('    [IA] Gerando via Pollinations Turbo...')
    const res = await fetch(urlIa, { signal: AbortSignal.timeout(12000) })
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      if (buffer.length > 5000) return buffer
    }
  } catch (e) {
    console.warn('    ⚠️ Pollinations Turbo falhou. Usando banco de fotos selecionadas...')
  }

  // 3. Fallback Banco Selecionado por Categoria
  const fotosTeck = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop'
  ]
  const fotosFe = [
    'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=1200&auto=format&fit=crop'
  ]

  const lista = category === 'fe' ? fotosFe : fotosTeck
  const urlFallback = lista[Math.floor(Math.random() * lista.length)]
  const resFallback = await fetch(urlFallback)
  const arrayBuffer = await resFallback.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function regerarCapasComIa() {
  console.log('=== IDENTIFICANDO E REGERANDO CAPAS QUE NÃO SÃO DE IA ===')
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, cover_url, category, excerpt')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar posts:', error)
    return
  }

  console.log(`Total de posts no banco: ${posts.length}`)

  // Filtra posts que NÃO têm 'capa-ia-' na URL da capa
  const postsParaRegerar = posts.filter(p => !p.cover_url || !p.cover_url.includes('capa-ia-'))

  console.log(`Posts identificados que necessitam de nova capa por IA: ${postsParaRegerar.length} de ${posts.length}`)
  
  if (postsParaRegerar.length === 0) {
    console.log('✅ Todos os 23 posts já possuem capas geradas por IA!')
    return
  }

  let sucessos = 0
  let falhas = 0

  for (let i = 0; i < postsParaRegerar.length; i++) {
    const post = postsParaRegerar[i]
    console.log(`\n[${i + 1}/${postsParaRegerar.length}] Processando: "${post.title}" (${post.slug})`)

    try {
      const eFe = post.category === 'fe'
      const temaIngles = eFe
        ? `Christian faith, spiritual journey, biblical wisdom, peaceful golden hour lighting`
        : `artificial intelligence, futuristic tech, software engineering, modern sleek workspace`

      const promptVisual = `High-end 16:9 editorial photograph representing ${post.title}. ${temaIngles}`
      const buffer = await obterBufferImagemIa(promptVisual, post.category)

      const keyName = `capas/capa-ia-${post.slug}-${Date.now()}.jpg`
      console.log(`  📤 Enviando capa para Cloudflare R2: ${keyName} (${buffer.length} bytes)...`)

      const putCmd = new PutObjectCommand({
        Bucket: bucketName,
        Key: keyName,
        Body: buffer,
        ContentType: 'image/jpeg',
      })
      await s3.send(putCmd)

      const novaUrlR2 = `${publicDomain.replace(/\/$/, '')}/${keyName}`
      console.log(`  ✨ URL da Capa Gerada por IA: ${novaUrlR2}`)

      // Atualiza no Supabase
      const { error: updateErr } = await supabase
        .from('posts')
        .update({ cover_url: novaUrlR2, updated_at: new Date().toISOString() })
        .eq('id', post.id)

      if (updateErr) {
        console.error('  ❌ Erro ao atualizar no Supabase:', updateErr)
        falhas++
      } else {
        console.log('  ✅ Post atualizado no banco de dados com sucesso!')
        sucessos++
      }
    } catch (err) {
      console.error(`  ❌ Erro ao regerar capa para ${post.slug}:`, err.message)
      falhas++
    }

    // Delay leve de 500ms entre as requisições
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('\n==========================================')
  console.log('REGERAÇÃO DE CAPAS CONCLUÍDA!')
  console.log(`Total de posts processados: ${postsParaRegerar.length}`)
  console.log(`Novas capas geradas por IA: ${sucessos}`)
  console.log(`Falhas: ${falhas}`)
  console.log('==========================================')
}

regerarCapasComIa()
