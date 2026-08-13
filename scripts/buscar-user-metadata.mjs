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
const supabaseKey = getEnv('SUPABASE_SECRET_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

async function buscarAuthMetadata() {
  console.log('--- BUSCANDO EM AUTH.USERS METADATA ---')
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Erro ao listar auth users:', error)
    return
  }

  console.log(`Total de usuários em auth: ${data.users.length}`)
  for (const u of data.users) {
    console.log(`- ID: ${u.id} | Email: ${u.email}`)
    console.log('  app_metadata:', JSON.stringify(u.app_metadata))
    console.log('  user_metadata:', JSON.stringify(u.user_metadata))
  }
}

buscarAuthMetadata()
