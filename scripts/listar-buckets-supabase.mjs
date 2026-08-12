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

async function listarBucketsEArquivos() {
  console.log('--- BUSCANDO BUCKETS NO SUPABASE STORAGE ---')
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets()

  if (bErr) {
    console.error('Erro ao listar buckets:', bErr)
    return
  }

  console.log(`Buckets encontrados (${buckets?.length || 0}):`)
  for (const b of buckets || []) {
    console.log(`\nBucket: [${b.name}] (id: ${b.id}, public: ${b.public})`)
    const { data: files, error: fErr } = await supabase.storage.from(b.name).list('', { limit: 100 })
    if (fErr) {
      console.error(`  Erro ao listar arquivos do bucket ${b.name}:`, fErr)
    } else {
      console.log(`  Total de arquivos: ${files?.length || 0}`)
      for (const f of files || []) {
        const publicUrl = supabase.storage.from(b.name).getPublicUrl(f.name).data.publicUrl
        console.log(`  - ${f.name} (${f.metadata?.size || 0} bytes) -> ${publicUrl}`)
      }
    }
  }
}

listarBucketsEArquivos()
