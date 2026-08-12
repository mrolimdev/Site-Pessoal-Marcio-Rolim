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

async function migrarCapasParaR2() {
  console.log('--- INICIANDO MIGRAÇÃO DE IMAGENS DAS CAPAS PARA O CLOUDFLARE R2 ---')
  console.log(`Domínio R2: ${publicDomain}`)
  console.log(`Bucket: ${bucketName}`)

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, cover_url, content_json, content_html')

  if (error) {
    console.error('Erro ao buscar posts:', error)
    return
  }

  console.log(`Total de posts no banco de dados: ${posts.length}`)
  let sucessos = 0
  let falhas = 0

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    console.log(`\n[${i + 1}/${posts.length}] Processando: "${post.title}" (${post.slug})`)

    const coverUrlAtual = post.cover_url
    if (!coverUrlAtual) {
      console.log('  ⚠️ Sem URL de capa configurada. Pulando.')
      continue
    }

    if (coverUrlAtual.startsWith(publicDomain)) {
      console.log(`  ✅ Já está hospedado no R2 (${coverUrlAtual}).`)
      sucessos++
      continue
    }

    try {
      console.log(`  📥 Baixando imagem original: ${coverUrlAtual.substring(0, 80)}...`)
      const res = await fetch(coverUrlAtual, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) {
        console.error(`  ❌ Falha ao baixar imagem: HTTP ${res.status}`)
        falhas++
        continue
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const keyName = `capas/${post.slug}.${ext}`
      console.log(`  📤 Enviando para o Cloudflare R2: ${keyName} (${buffer.length} bytes)...`)

      const putCmd = new PutObjectCommand({
        Bucket: bucketName,
        Key: keyName,
        Body: buffer,
        ContentType: contentType,
      })
      await s3.send(putCmd)

      const novaUrlR2 = `${publicDomain.replace(/\/$/, '')}/${keyName}`
      console.log(`  🔗 Nova URL no R2: ${novaUrlR2}`)

      // Atualiza o registro do post no banco de dados Supabase
      const { error: updateErr } = await supabase
        .from('posts')
        .update({ cover_url: novaUrlR2, updated_at: new Date().toISOString() })
        .eq('id', post.id)

      if (updateErr) {
        console.error(`  ❌ Erro ao atualizar no Supabase:`, updateErr)
        falhas++
      } else {
        console.log(`  ✨ Post atualizado no banco de dados com sucesso!`)
        sucessos++
      }
    } catch (err) {
      console.error(`  ❌ Erro ao processar post ${post.slug}:`, err.message)
      falhas++
    }
  }

  console.log('\n==========================================')
  console.log(`MIGRAÇÃO CONCLUÍDA!`)
  console.log(`Total de posts: ${posts.length}`)
  console.log(`Sucessos: ${sucessos}`)
  console.log(`Falhas: ${falhas}`)
  console.log('==========================================')
}

migrarCapasParaR2()
