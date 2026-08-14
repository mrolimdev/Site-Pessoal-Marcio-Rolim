/**
 * Vocabulário compartilhado do blog: categorias, status, limites de tamanho e
 * as conversões de data do painel.
 *
 * SEM `import 'server-only'` de propósito. O formulário do painel é Client
 * Component e precisa exatamente da mesma lista de categorias, do mesmo regex
 * de slug e da mesma conversão de fuso que a Server Action usa para validar.
 * Duas cópias divergentes viram "categoria inválida" que só aparece em
 * produção, depois do usuário ter escrito o post inteiro.
 *
 * Tudo aqui é dado puro e função pura — nada toca banco, rede ou segredo.
 */

// ─── Categoria ───────────────────────────────────────────────────────────────
// Espelha o CHECK de public.posts.category. Mudar aqui sem mudar a migration
// (ou o contrário) faz o INSERT falhar com 23514.
export const VALORES_CATEGORIA = ['tecnologia', 'ia', 'automacao', 'negocios', 'fe'] as const

export type Categoria = (typeof VALORES_CATEGORIA)[number]

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  tecnologia: 'Tecnologia',
  ia: 'IA',
  automacao: 'Automação',
  negocios: 'Negócios',
  fe: 'Fé',
}

// ─── Status ──────────────────────────────────────────────────────────────────
// Espelha o CHECK de public.posts.status.
export const VALORES_STATUS = ['draft', 'scheduled', 'published', 'archived'] as const

export type StatusPost = (typeof VALORES_STATUS)[number]

export const ROTULO_STATUS: Record<StatusPost, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
  archived: 'Arquivado',
}

/**
 * O banco tem `constraint posts_published_needs_date`: sem data, um post
 * 'published' ou 'scheduled' não satisfaz nenhum filtro de tempo da política de
 * leitura e vazaria (ou sumiria) sem explicação.
 */
export const STATUS_QUE_EXIGEM_DATA: readonly StatusPost[] = ['published', 'scheduled']

// ─── Limites ─────────────────────────────────────────────────────────────────
// Espelham os CHECKs de tamanho da migration. A UI usa para o contador de
// caracteres; a action usa para recusar antes de o banco recusar, porque o erro
// do Postgres não diz qual campo estourou.
export const LIMITES = {
  tituloMin: 3,
  tituloMax: 200,
  slugMin: 3,
  slugMax: 120,
  resumoMax: 320,
  seoDescricaoMax: 200,
} as const

export const REGEX_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Limites de SEO — que NÃO são os limites do banco.
 *
 * A distinção existe porque os dois foram confundidos e o resultado passou
 * despercebido: `seo_title` era cortado em 200 (o CHECK da coluna) quando o
 * Google trunca por volta de 60. Um título gerado com 150 caracteres passava em
 * tudo — zod, banco, build — e chegava ao resultado de busca cortado no meio,
 * sem nenhum aviso em lugar nenhum.
 *
 *   CHECK do banco   impede a linha de entrar
 *   limite de SEO    impede o resultado de ficar feio no Google
 *
 * O segundo é mais apertado e é o que vale na hora de gerar.
 */
export const LIMITES_SEO = {
  /** O Google corta o título do resultado por volta daqui. */
  tituloMax: 60,
  /** Abaixo disso a descrição desperdiça espaço que já foi conquistado. */
  descricaoMin: 110,
  /** Acima disso o Google trunca com reticências. */
  descricaoMax: 160,
  /** Resposta direta no topo do post: o que cabe num trecho destacado. */
  respostaRapidaMax: 340,
} as const

/**
 * Título → slug. Usada no browser para sugerir, e a action revalida do zero:
 * a sugestão é conveniência, não é a validação.
 */
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    // Remove os diacríticos que o NFD separou das letras ("ç" → "c" + cedilha).
    // \p{Mn} = nonspacing marks. Escrito como property escape, e não como
    // intervalo literal, porque combining marks crus são invisíveis no editor.
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITES.slugMax)
    // O slice pode ter deixado um hífen solto no fim, que o regex recusa.
    .replace(/-+$/, '')
}

// ─── Datas ───────────────────────────────────────────────────────────────────
/**
 * Fuso de referência do painel.
 *
 * O `<input type="datetime-local">` não tem fuso: devolve "2026-08-11T14:30" e
 * pronto. Interpretar isso com o relógio de quem executa dá dois resultados
 * diferentes — o servidor da Vercel roda em UTC e o admin está em São Paulo,
 * então "publicar às 14:30" viraria 11:30. Fixar o fuso do site resolve, e de
 * quebra faz o SSR e o browser renderizarem a MESMA string, sem mismatch de
 * hidratação.
 */
export const FUSO_PAINEL = 'America/Sao_Paulo'

/** Deslocamento real do fuso naquele instante, em minutos. */
function deslocamentoMinutos(instante: Date): number {
  // `longOffset` devolve "GMT-03:00". Preferido a fixar -180: se o horário de
  // verão voltar ao Brasil, a conta continua certa sem tocar no código.
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_PAINEL,
    timeZoneName: 'longOffset',
  }).formatToParts(instante)

  const nome = partes.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00'
  const casado = /GMT([+-])(\d{2}):(\d{2})/.exec(nome)
  if (!casado) return 0

  const sinal = casado[1] === '-' ? -1 : 1
  return sinal * (Number(casado[2]) * 60 + Number(casado[3]))
}

/** Instante ISO (UTC) → "YYYY-MM-DDTHH:mm" para o input, no fuso do painel. */
export function isoParaCampoData(iso: string | null | undefined): string {
  if (!iso) return ''

  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''

  // 'en-CA' porque formata como YYYY-MM-DD, que é o que o input exige.
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_PAINEL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(data)

  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? ''

  // hourCycle h23 devolve "24" para meia-noite em alguns runtimes.
  const hora = parte('hour') === '24' ? '00' : parte('hour')

  return `${parte('year')}-${parte('month')}-${parte('day')}T${hora}:${parte('minute')}`
}

/**
 * "YYYY-MM-DDTHH:mm" (hora de parede do painel) → instante ISO em UTC.
 * Devolve null quando o valor está vazio ou não é uma data real.
 */
export function campoDataParaIso(valor: string): string | null {
  if (!valor.trim()) return null

  // Ancora no UTC só para ter um instante de referência, depois desconta o
  // deslocamento real daquele momento.
  const comoUtc = new Date(`${valor}:00.000Z`)
  if (Number.isNaN(comoUtc.getTime())) return null

  const real = new Date(comoUtc.getTime() - deslocamentoMinutos(comoUtc) * 60_000)
  return Number.isNaN(real.getTime()) ? null : real.toISOString()
}

/** Data legível para as tabelas do painel. Fuso fixo pelo mesmo motivo acima. */
export function formatarDataPainel(iso: string | null | undefined): string {
  if (!iso) return '—'

  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_PAINEL,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
}

// ─── Modelos de IA ───────────────────────────────────────────────────────────
/**
 * Vive AQUI, e não em `actions/gerar-post-ia.ts`, por uma regra do Next: um
 * módulo `'use server'` só pode exportar funções async. Um `export const` ali
 * quebra o build. E o modal do editor precisa do padrão para inicializar o
 * estado antes de ler a preferência do localStorage.
 *
 * A lista é PREFERÊNCIA, não verdade absoluta: se tudo aqui responder 404 —
 * como aconteceu quando o Google aposentou a geração 2.0 —, a action consulta o
 * catálogo real da API e escolhe sozinha.
 */
export const MODELOS_TEXTO_PREFERIDOS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
] as const

export const MODELO_TEXTO_PADRAO: string = MODELOS_TEXTO_PREFERIDOS[0]

export type ModeloImagemOption = {
  id: string
  nome: string
  descricao: string
}

/**
 * ATENÇÃO ao editar: esta lista já esteve DESATUALIZADA e ninguém percebeu.
 *
 * Ela oferecia `imagen-3.0-generate-002`, `imagen-3.0-fast-generate-001` e
 * `imagen-3.0-generate-001` — os três aposentados pelo Google e respondendo 404.
 * Como a geração de capa tem cadeia de reserva, o defeito ficava invisível: a
 * capa saía, só que nunca pelo modelo que a tela dizia estar usando.
 *
 * Os `gemini-*-image` respondem em `:generateContent`; os `imagen-*` em
 * `:predict`. `gerarImagemDeCapaRobusta` sabe distinguir pelo prefixo do id.
 */
/**
 * A ORDEM importa: o primeiro é o padrão e o primeiro da fila de reserva.
 * Medido contra a API real (agosto/2026), gerando a mesma capa 16:9:
 *
 *   gemini-3.1-flash-image   54,5s   817 KB   ← melhor relação tempo/tamanho
 *   gemini-2.5-flash-image   86,8s  1611 KB
 *   imagen-4.0-*             404 — aparecem no catálogo mas não respondem em
 *                            :predict com esta chave (exigem faturamento ativo)
 *
 * Por isso os Imagen NÃO estão nesta lista: oferecer na tela um modelo que
 * responde 404 é o defeito que esta lista já teve com a família Imagen 3. Eles
 * continuam na cadeia de reserva interna da action, onde um 404 custa 0,4s.
 */
export const MODELOS_IMAGEM_DISPONIVEIS: ModeloImagemOption[] = [
  {
    id: 'gemini-3.1-flash-image',
    nome: 'Gemini 3.1 Flash Image (Recomendado)',
    descricao: 'Mais rápido e mais leve nos testes: ~55s e ~800 KB por capa.',
  },
  {
    id: 'gemini-2.5-flash-image',
    nome: 'Gemini 2.5 Flash Image',
    descricao: 'Alternativa estável. Mais lento (~87s) e gera arquivo maior.',
  },
  {
    id: 'gemini-3-pro-image',
    nome: 'Gemini 3 Pro Image (Qualidade)',
    descricao: 'Para quando a capa importa mais que o tempo de geração.',
  },
]
