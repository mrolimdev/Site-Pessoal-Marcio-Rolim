/**
 * Redistribui `published_at` dos posts aleatoriamente entre outubro/2025 e hoje.
 *
 *   node scripts/ajustar-datas-posts.mjs                    # simula, não grava
 *   node scripts/ajustar-datas-posts.mjs --aplicar          # grava
 *   node scripts/ajustar-datas-posts.mjs --restaurar=<arq>  # desfaz pelo backup
 *
 * ─── Decisões que valem explicação ──────────────────────────────────────────
 *
 * Só entram posts que JÁ TÊM `published_at`. Rascunho tem a coluna nula de
 * propósito, e a checagem da tabela (`status not in ('published','scheduled')
 * or published_at is not null`) existe justamente para o par não se desencontrar
 * — inventar data para rascunho seria mexer em estado que não é de publicação.
 *
 * O teto da janela é uma hora atrás, não agora. A view pública filtra
 * `published_at <= now()`: um post sorteado para hoje às 21h enquanto são 14h
 * simplesmente sumiria do site até a noite.
 *
 * A hora do dia é sorteada entre 08h e 22h de Brasília, e não no dia inteiro.
 * Data de publicação às 03h47 não parece data de publicação — parece o que é,
 * um número aleatório. O Brasil não tem horário de verão desde 2019, então o
 * deslocamento fixo de -03:00 basta.
 */

import { writeFileSync, readFileSync } from 'node:fs'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY

if (!url || !key) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SECRET_KEY no ambiente.')
  process.exit(1)
}

const supabase = createClient(url, key)

const argumentos = process.argv.slice(2)
const aplicar = argumentos.includes('--aplicar')
const restaurarDe = argumentos.find((a) => a.startsWith('--restaurar='))?.split('=')[1]

/** Fuso de Brasília, sem horário de verão desde 2019. */
const OFFSET_BRT = '-03:00'

/** Início da janela: 1º de outubro de 2025, 00h de Brasília. */
const INICIO = Date.parse(`2025-10-01T00:00:00${OFFSET_BRT}`)

/** Teto: uma hora atrás, para nenhum sorteio cair no futuro da view pública. */
const FIM = Date.now() - 60 * 60 * 1000

const HORA_MIN = 8
const HORA_MAX = 21

const inteiro = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

/**
 * Um instante aleatório na janela, com hora comercial de Brasília.
 *
 * O dia é sorteado primeiro e a hora depois, em vez de um milissegundo solto na
 * janela inteira: sortear o instante e só então empurrar a hora para dentro do
 * expediente entortaria a distribuição nas pontas de cada dia.
 */
function dataAleatoria() {
  const diaEmMs = 24 * 60 * 60 * 1000
  const totalDias = Math.floor((FIM - INICIO) / diaEmMs)

  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const dia = new Date(INICIO + inteiro(0, totalDias) * diaEmMs)
    // `sv-SE` devolve `AAAA-MM-DD`, que é o formato ISO que precisamos montar.
    const aaaaMmDd = dia.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

    const hh = String(inteiro(HORA_MIN, HORA_MAX)).padStart(2, '0')
    const mm = String(inteiro(0, 59)).padStart(2, '0')
    const ss = String(inteiro(0, 59)).padStart(2, '0')

    const candidato = new Date(`${aaaaMmDd}T${hh}:${mm}:${ss}${OFFSET_BRT}`)
    // O último dia da janela tem só parte do expediente disponível.
    if (candidato.getTime() <= FIM) return candidato
  }

  return new Date(FIM)
}

function formatarBRT(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

async function gravar(linhas) {
  let ok = 0
  for (const linha of linhas) {
    const { error } = await supabase
      .from('posts')
      .update({ published_at: linha.nova })
      .eq('id', linha.id)

    if (error) {
      console.error(`  ✗ ${linha.slug}: ${error.message}`)
      continue
    }
    ok++
  }
  return ok
}

async function restaurar(arquivo) {
  const backup = JSON.parse(readFileSync(arquivo, 'utf8'))
  console.log(`Restaurando ${backup.length} posts a partir de ${arquivo}\n`)

  const ok = await gravar(
    backup.map((b) => ({ id: b.id, slug: b.slug, nova: b.published_at_anterior }))
  )

  console.log(`\n${ok}/${backup.length} posts restaurados.`)
}

async function principal() {
  if (restaurarDe) return restaurar(restaurarDe)

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, title, status, published_at')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  if (error) {
    console.error(error)
    process.exit(1)
  }

  if (posts.length === 0) {
    console.log('Nenhum post com data de publicação. Nada a fazer.')
    return
  }

  // Datas repetidas deixariam a paginação instável: `queries.ts` ordena por
  // `published_at desc` e o desempate entre iguais fica por conta do Postgres,
  // que pode devolver ordem diferente entre a página 1 e a 2.
  const usadas = new Set()
  const linhas = posts.map((p) => {
    let nova
    do {
      nova = dataAleatoria().toISOString()
    } while (usadas.has(nova))
    usadas.add(nova)

    return { id: p.id, slug: p.slug, status: p.status, anterior: p.published_at, nova }
  })

  linhas.sort((a, b) => b.nova.localeCompare(a.nova))

  console.log(
    `Janela: ${formatarBRT(INICIO)} → ${formatarBRT(FIM)} (horário de Brasília)\n` +
      `Posts: ${linhas.length}\n`
  )
  console.log('ANTES                →  DEPOIS               | STATUS    | SLUG')
  console.log('─'.repeat(100))
  for (const l of linhas) {
    console.log(
      `${formatarBRT(l.anterior).padEnd(20)} →  ${formatarBRT(l.nova).padEnd(20)} | ` +
        `${l.status.padEnd(9)} | ${l.slug}`
    )
  }

  if (!aplicar) {
    console.log('\n[simulação] Nada foi gravado. Rode de novo com --aplicar para valer.')
    return
  }

  const arquivoBackup = `backup-datas-posts-${new Date().toISOString().replace(/[:.]/g, '-')}.local.json`
  writeFileSync(
    arquivoBackup,
    JSON.stringify(
      linhas.map((l) => ({ id: l.id, slug: l.slug, published_at_anterior: l.anterior })),
      null,
      2
    )
  )
  console.log(`\nBackup das datas atuais: ${arquivoBackup}`)

  const ok = await gravar(linhas)
  console.log(`\n${ok}/${linhas.length} posts atualizados.`)

  if (ok < linhas.length) {
    console.log('Alguns falharam — o backup acima cobre TODOS, inclusive os que passaram.')
  }
}

principal()
