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

async function buscarTabelasEValores() {
  console.log('--- BUSCANDO TODAS AS TABELAS NO BANCO ---')

  // Testa tabelas possíveis
  const possiveis = [
    'posts',
    'categories',
    'tags',
    'analytics_daily_rollup',
    'analytics_events',
    'analytics_sessions',
    'configs',
    'config',
    'settings',
    'site_settings',
    'ia_settings',
    'integrations',
    'api_keys',
    'keys',
    'secrets',
    'profiles',
    'users',
    'admins',
  ]

  for (const t of possiveis) {
    const { data, error } = await supabase.from(t).select('*')
    if (!error && data) {
      console.log(`Tabela [${t}] -> ${data.length} registros`)
      if (data.length > 0) {
        const str = JSON.stringify(data)
        if (str.toLowerCase().includes('apify') || str.includes('apify_api_')) {
          console.log(`✨ ENCONTRADO APIFY NA TABELA [${t}]:`, str)
        }
      }
    }
  }
}

buscarTabelasEValores()
