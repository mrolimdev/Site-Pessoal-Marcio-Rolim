// Conteúdo do currículo extraído de components/CurriculumPage.tsx
// Módulo de dados puro: sem JSX, sem React, sem 'use client'.
// Todos os textos foram copiados literalmente da origem indicada em cada bloco.

// ---------------------------------------------------------------------------
// Datas-base e helpers de cálculo
// Origem: components/CurriculumPage.tsx:284-285 (valores)
// Origem: components/CurriculumPage.tsx:205-216 (funções calculateAge / calculateYearsSince)
// ---------------------------------------------------------------------------

export const DATA_NASCIMENTO = '1973-04-18' as const

export const ANO_INICIO_TI = 1988 as const

export function calcularIdade(dataNascimento: string): number {
  const today = new Date()
  const birth = new Date(dataNascimento)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function anosDesde(ano: number): number {
  return new Date().getFullYear() - ano
}

// ---------------------------------------------------------------------------
// Identidade / topo
// Origem: components/CurriculumPage.tsx:286 (foto), 339 (alt), 343 (badge),
//         349-354 (nome e headline)
// ---------------------------------------------------------------------------

export const NOME = 'Marcio Rolim' as const

export const HEADLINE =
  'Especialista em IA & Automação de Processos | Tech Lead em Transformação Digital' as const

export const FOTO_PERFIL_URL =
  'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg' as const

export const BADGE_DISPONIBILIDADE = 'Disponível' as const

// ---------------------------------------------------------------------------
// Tags do topo (4)
// Origem: components/CurriculumPage.tsx:356-369
// A tag de idade é dinâmica ({age} anos), por isso as tags são geradas por função.
// ---------------------------------------------------------------------------

export type TagTopoId = 'localizacao' | 'idade' | 'estadoCivil' | 'anosTi'

export interface TagTopo {
  id: TagTopoId
  icone: string
  corIcone: string
  texto: string
}

export function criarTagsTopo(idade: number): TagTopo[] {
  return [
    // components/CurriculumPage.tsx:357-359
    {
      id: 'localizacao',
      icone: 'MapPin',
      corIcone: 'text-emerald-400',
      texto: 'Zona Leste - São Paulo - SP',
    },
    // components/CurriculumPage.tsx:360-362
    {
      id: 'idade',
      icone: 'Calendar',
      corIcone: 'text-amber-400',
      texto: `${idade} anos`,
    },
    // components/CurriculumPage.tsx:363-365
    {
      id: 'estadoCivil',
      icone: 'Heart',
      corIcone: 'text-rose-400',
      texto: 'Casado · 4 filhas',
    },
    // components/CurriculumPage.tsx:366-368
    {
      id: 'anosTi',
      icone: 'Briefcase',
      corIcone: 'text-blue-400',
      texto: 'Mais de 30 anos em TI',
    },
  ]
}

// ---------------------------------------------------------------------------
// Contatos (5)
// Origem: components/CurriculumPage.tsx:371-387
// ---------------------------------------------------------------------------

export type ContatoId = 'email' | 'whatsapp' | 'instagram' | 'linkedin' | 'site'

export interface Contato {
  id: ContatoId
  icone: string
  rotulo: string
  href: string
  externo: boolean
  corHover: string
}

export const CONTATOS = [
  // components/CurriculumPage.tsx:372-374
  {
    id: 'email',
    icone: 'Mail',
    rotulo: 'contato@marciorolim.com.br',
    href: 'mailto:contato@marciorolim.com.br',
    externo: false,
    corHover: 'hover:text-amber-400',
  },
  // components/CurriculumPage.tsx:375-377
  {
    id: 'whatsapp',
    icone: 'WhatsApp',
    rotulo: '(11) 98088-8880',
    href: 'https://wa.me/5511980888880',
    externo: true,
    corHover: 'hover:text-emerald-400',
  },
  // components/CurriculumPage.tsx:378-380
  {
    id: 'instagram',
    icone: 'Instagram',
    rotulo: '@marciorolim',
    href: 'https://instagram.com/marciorolim',
    externo: true,
    corHover: 'hover:text-pink-400',
  },
  // components/CurriculumPage.tsx:381-383
  {
    id: 'linkedin',
    icone: 'LinkedIn',
    rotulo: '/marciorolim',
    href: 'https://linkedin.com/in/marciorolim',
    externo: true,
    corHover: 'hover:text-blue-400',
  },
  // components/CurriculumPage.tsx:384-386
  {
    id: 'site',
    icone: 'Globe',
    rotulo: 'marciorolim.com.br',
    href: 'https://marciorolim.com.br',
    externo: true,
    corHover: 'hover:text-violet-400',
  },
] as const satisfies readonly Contato[]

// ---------------------------------------------------------------------------
// Propósito & Objetivo (2 parágrafos com ênfase em <strong>)
// Origem: components/CurriculumPage.tsx:402 (título) e 405-415 (parágrafos)
// Ênfases: strongAccent -> 'accent' (:406), strongGreen -> 'green' (:407),
//          strongWhite -> 'white' (:411)
// Os espaços entre segmentos reproduzem a colapsagem de whitespace do JSX.
// ---------------------------------------------------------------------------

export const PROPOSITO_TITULO = 'Propósito & Objetivo' as const

export type EnfaseTexto = 'accent' | 'green' | 'white'

export interface SegmentoTexto {
  texto: string
  enfase?: EnfaseTexto
}

export type ParagrafoProposito = readonly SegmentoTexto[]

export const PROPOSITO_PARAGRAFOS = [
  // components/CurriculumPage.tsx:405-409
  [
    { texto: 'Profissional com ' },
    {
      texto: 'mais de 30 anos de experiência estratégica em tecnologia',
      enfase: 'accent',
    },
    {
      texto:
        ', focado em transformar complexidade técnica em valor de negócio. Especialista em ',
    },
    {
      texto: 'Inteligência Artificial Generativa e Automação de Processos',
      enfase: 'green',
    },
    {
      texto:
        ', com um histórico sólido que vai da gestão de infraestrutura crítica à implementação de ecossistemas digitais modernos.',
    },
  ],
  // components/CurriculumPage.tsx:410-415
  [
    { texto: 'Meu propósito é ' },
    {
      texto: 'transformar vidas e negócios através da tecnologia',
      enfase: 'white',
    },
    {
      texto:
        '. Acredito que cada pessoa e cada organização tem um potencial único que pode ser amplificado com as ferramentas e estratégias certas. Busco oportunidades onde possa aplicar minha experiência em IA, desenvolvimento e gestão de tecnologia para criar impacto real e duradouro.',
    },
  ],
] as const satisfies readonly ParagrafoProposito[]

// ---------------------------------------------------------------------------
// Formação Acadêmica
// Origem: components/CurriculumPage.tsx:425 (título) e 433-434 (curso e ano)
// ---------------------------------------------------------------------------

export interface FormacaoAcademica {
  curso: string
  ano: string
}

export const FORMACAO_ACADEMICA = {
  curso: 'Ciências da Computação',
  ano: '(1996)',
} as const satisfies FormacaoAcademica

// ---------------------------------------------------------------------------
// Cursos Complementares (7)
// Origem: components/CurriculumPage.tsx:449-456
// ---------------------------------------------------------------------------

export interface CursoComplementar {
  nome: string
  emoji: string
}

export const CURSOS_COMPLEMENTARES = [
  { nome: 'Redes e Infraestrutura', emoji: '🌐' },
  { nome: 'Gestão de Negócios', emoji: '📊' },
  { nome: 'Engenharia de Prompt (IA)', emoji: '🤖' },
  { nome: 'Contabilidade Básica', emoji: '📋' },
  { nome: 'Lógica de Programação', emoji: '💻' },
  { nome: 'Automação Industrial com C#', emoji: '⚙️' },
  { nome: 'Banco de Dados SQL', emoji: '🗄️' },
] as const satisfies readonly CursoComplementar[]

// ---------------------------------------------------------------------------
// Idiomas (2)
// Origem: components/CurriculumPage.tsx:479-502
// ---------------------------------------------------------------------------

export interface Idioma {
  nome: string
  nivel: string
  percentual: number
  bandeira: string
  gradiente: string
}

export const IDIOMAS = [
  // components/CurriculumPage.tsx:479-490
  {
    nome: 'Inglês',
    nivel: 'Técnico para Documentação e Leitura',
    percentual: 35,
    bandeira: '🇺🇸',
    gradiente: 'bg-gradient-to-r from-sky-400 to-blue-500',
  },
  // components/CurriculumPage.tsx:491-502
  {
    nome: 'Espanhol',
    nivel: 'Básico',
    percentual: 30,
    bandeira: '🇪🇸',
    gradiente: 'bg-gradient-to-r from-orange-400 to-red-500',
  },
] as const satisfies readonly Idioma[]

// ---------------------------------------------------------------------------
// Habilidades Técnicas — 3 cards com barras
// Origem: components/CurriculumPage.tsx:516-558
// ---------------------------------------------------------------------------

export interface BarraHabilidade {
  nome: string
  nivel: number
  gradiente: string
  delay: number
}

export interface CardHabilidades {
  titulo: string
  icone: string
  corIcone: string
  habilidades: readonly BarraHabilidade[]
}

export const CARDS_HABILIDADES = [
  // components/CurriculumPage.tsx:516-530
  {
    titulo: 'Programação',
    icone: 'Code',
    corIcone: 'text-emerald-400',
    habilidades: [
      // components/CurriculumPage.tsx:524
      {
        nome: 'Python',
        nivel: 85,
        gradiente: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
        delay: 0,
      },
      // components/CurriculumPage.tsx:525
      {
        nome: 'JavaScript',
        nivel: 80,
        gradiente: 'bg-gradient-to-r from-amber-400 to-amber-500',
        delay: 100,
      },
      // components/CurriculumPage.tsx:526
      {
        nome: 'HTML / CSS',
        nivel: 90,
        gradiente: 'bg-gradient-to-r from-orange-400 to-red-500',
        delay: 200,
      },
      // components/CurriculumPage.tsx:527
      {
        nome: 'Node.js',
        nivel: 75,
        gradiente: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
        delay: 300,
      },
      // components/CurriculumPage.tsx:528
      {
        nome: 'PHP',
        nivel: 65,
        gradiente: 'bg-gradient-to-r from-indigo-400 to-violet-500',
        delay: 400,
      },
    ],
  },
  // components/CurriculumPage.tsx:532-544
  {
    titulo: 'Banco de Dados',
    icone: 'Database',
    corIcone: 'text-blue-400',
    habilidades: [
      // components/CurriculumPage.tsx:540
      {
        nome: 'MySQL',
        nivel: 80,
        gradiente: 'bg-gradient-to-r from-sky-400 to-blue-500',
        delay: 0,
      },
      // components/CurriculumPage.tsx:541
      {
        nome: 'SQL',
        nivel: 80,
        gradiente: 'bg-gradient-to-r from-blue-400 to-indigo-500',
        delay: 100,
      },
      // components/CurriculumPage.tsx:542
      {
        nome: 'Supabase',
        nivel: 85,
        gradiente: 'bg-gradient-to-r from-emerald-400 to-green-500',
        delay: 200,
      },
    ],
  },
  // components/CurriculumPage.tsx:546-558
  {
    titulo: 'Automação & IA',
    icone: 'Cpu',
    corIcone: 'text-violet-400',
    habilidades: [
      // components/CurriculumPage.tsx:554
      {
        nome: 'N8N / Make',
        nivel: 85,
        gradiente: 'bg-gradient-to-r from-orange-400 to-red-400',
        delay: 0,
      },
      // components/CurriculumPage.tsx:555
      {
        nome: 'Agentes de IA e LLMs',
        nivel: 80,
        gradiente: 'bg-gradient-to-r from-fuchsia-400 to-pink-500',
        delay: 200,
      },
      // components/CurriculumPage.tsx:556
      {
        nome: 'Performance & Growth (Ads)',
        nivel: 90,
        gradiente: 'bg-gradient-to-r from-sky-400 to-cyan-500',
        delay: 300,
      },
    ],
  },
] as const satisfies readonly CardHabilidades[]

// ---------------------------------------------------------------------------
// Ferramentas & Plataformas (6)
// Origem: components/CurriculumPage.tsx:565 (título) e 568-574 (itens)
// Chaves de cor definidas em components/CurriculumPage.tsx:180-200 (toolColors)
// ---------------------------------------------------------------------------

export const FERRAMENTAS_TITULO = 'Ferramentas & Plataformas' as const

export type ChaveCorFerramenta =
  | 'claude'
  | 'openai'
  | 'gemini'
  | 'cursor'
  | 'antigravity'
  | 'vibe'
  | 'websites'
  | 'apps'
  | 'agents'

export interface Ferramenta {
  nome: string
  chaveCor: ChaveCorFerramenta
}

export const FERRAMENTAS = [
  { nome: 'IA Generativa (GPT, Claude, Gemini)', chaveCor: 'openai' },
  { nome: 'Engenharia de Prompt', chaveCor: 'antigravity' },
  { nome: 'Cursor & Vibe Coding', chaveCor: 'cursor' },
  { nome: 'E-commerce & Apps', chaveCor: 'apps' },
  { nome: 'Performance (Ads)', chaveCor: 'vibe' },
  { nome: 'Automação (n8n, Make)', chaveCor: 'claude' },
] as const satisfies readonly Ferramenta[]

// ---------------------------------------------------------------------------
// Experiência Profissional (4)
// Origem: components/CurriculumPage.tsx:598-652
// ---------------------------------------------------------------------------

export interface ExperienciaProfissional {
  periodo: string
  empresa: string
  cargo: string
  descricao: string
  destaques: readonly string[]
}

export const EXPERIENCIAS = [
  // components/CurriculumPage.tsx:598-610
  {
    periodo: '2020 – Atual',
    empresa: 'Consultoria Independente',
    cargo: 'Especialista em IA & Automação de Processos',
    descricao:
      'Consultoria estratégica focada em implementar soluções de IA Generativa e automação de fluxos de trabalho. Desenvolvimento de agentes inteligentes e ecossistemas digitais que otimizam a produtividade corporativa em mais de 40%.',
    destaques: [
      'Agentes de IA',
      'Automação (n8n/Make)',
      'Transformação Digital',
      'Estratégia de Performance',
    ],
  },
  // components/CurriculumPage.tsx:612-624
  {
    periodo: '2012 – 2020',
    empresa: 'Igreja Plenitude',
    cargo: 'Gerente de Tecnologia',
    descricao:
      'Gestão da infraestrutura crítica para uma organização de grande porte (+50 mil membros). Liderança de equipe multidisciplinar e implementação de sistemas de atendimento que reduziram o tempo médio de resposta em 60% e otimizaram custos operacionais em 30%.',
    destaques: [
      'Infraestrutura de TI',
      'Rádio & TV Digital',
      'Gestão de Equipes',
      'Redução de Custos',
    ],
  },
  // components/CurriculumPage.tsx:626-638
  {
    periodo: '2004 – 2012',
    empresa: 'TOTVS',
    cargo: 'Analista de Negócios (ERP Protheus)',
    descricao:
      'Liderança técnica na implementação do ERP Protheus em grandes contas. Foco em otimização de processos de materiais e produção, resultando em um aumento médio de 25% na acuracidade de estoque e eficiência produtiva dos clientes.',
    destaques: [
      'ERP Protheus',
      'Gestão de Projetos',
      'Otimização de Processos',
      'Acuracidade de Dados',
    ],
  },
  // components/CurriculumPage.tsx:640-652
  {
    periodo: '1988 – 2004',
    empresa: 'Diversas Empresas (Sul América, SBT, Bunge Alimentos)',
    cargo: 'Especialista em Tecnologia e Suporte',
    descricao:
      'Sólida base técnica em suporte e desenvolvimento de soluções departamentais. Foco precoce em automação de planilhas e pequenos sistemas para otimização de fluxos de trabalho.',
    destaques: [
      'Suporte Crítico',
      'Desenvolvimento VBA/Excel',
      'Sistemas Internos',
    ],
  },
] as const satisfies readonly ExperienciaProfissional[]

// ---------------------------------------------------------------------------
// Informações Pessoais (6 blocos)
// Origem: components/CurriculumPage.tsx:662 (título) e 666-717 (blocos)
// ---------------------------------------------------------------------------

export const INFORMACOES_PESSOAIS_TITULO = 'Informações Pessoais' as const

export interface InformacaoPessoal {
  rotulo: string
  valor: string
  icone: string
  corIcone: string
}

export const INFORMACOES_PESSOAIS = [
  // components/CurriculumPage.tsx:668-674
  {
    rotulo: 'Data de Nascimento',
    valor: '18 de Abril de 1973',
    icone: 'Calendar',
    corIcone: 'text-amber-400',
  },
  // components/CurriculumPage.tsx:675-681
  {
    rotulo: 'Estado Civil',
    valor: 'Casado · 4 filhas',
    icone: 'Heart',
    corIcone: 'text-rose-400',
  },
  // components/CurriculumPage.tsx:682-688
  {
    rotulo: 'Localização',
    valor: 'Zona Leste - São Paulo - SP',
    icone: 'MapPin',
    corIcone: 'text-emerald-400',
  },
  // components/CurriculumPage.tsx:694-700
  {
    rotulo: 'Formação',
    valor: 'Ciências da Computação (1996)',
    icone: 'GraduationCap',
    corIcone: 'text-blue-400',
  },
  // components/CurriculumPage.tsx:701-707
  {
    rotulo: 'Atuação em TI desde',
    valor: '1988 — mais de 30 anos de experiência',
    icone: 'Briefcase',
    corIcone: 'text-violet-400',
  },
  // components/CurriculumPage.tsx:708-714
  {
    rotulo: 'Foco atual',
    valor:
      'IA, Desenvolvimento Web e Aplicativos, Automação & Gestão de Tráfego',
    icone: 'Sparkles',
    corIcone: 'text-amber-400',
  },
] as const satisfies readonly InformacaoPessoal[]

// ---------------------------------------------------------------------------
// Diferenciais (6)
// Origem: components/CurriculumPage.tsx:726 (título) e 730-736 (itens)
// ---------------------------------------------------------------------------

export const DIFERENCIAIS_TITULO = 'Diferenciais' as const

export interface Diferencial {
  emoji: string
  titulo: string
  descricao: string
}

export const DIFERENCIAIS = [
  {
    emoji: '🧠',
    titulo: 'Visão Estratégica',
    descricao:
      'Capacidade de unir tecnologia e propósito para gerar impacto real em organizações.',
  },
  {
    emoji: '🤖',
    titulo: 'Early Adopter de IA',
    descricao:
      'Domínio de ferramentas modernas de IA generativa e agentes autônomos para automação.',
  },
  {
    emoji: '🔧',
    titulo: 'Full Stack Prático',
    descricao:
      'Do conceito à produção: websites, aplicativos e sistemas com entrega completa.',
  },
  {
    emoji: '📊',
    titulo: 'Gestão de TI',
    descricao:
      'Experiência comprovada em implantar e gerenciar infraestrutura em grande escala.',
  },
  {
    emoji: '🤝',
    titulo: 'Liderança e Comunicação',
    descricao:
      'Habilidade natural de liderança e gestão de equipes multidisciplinares.',
  },
  {
    emoji: '⚡',
    titulo: 'Resolução de Problemas',
    descricao:
      'Mais de 3 décadas transformando desafios complexos em soluções funcionais.',
  },
] as const satisfies readonly Diferencial[]

// ---------------------------------------------------------------------------
// Títulos das demais seções
// Origem: components/CurriculumPage.tsx:425, 446, 476, 512, 594
// ---------------------------------------------------------------------------

export const FORMACAO_TITULO = 'Formação Acadêmica' as const

export const CURSOS_TITULO = 'Cursos Complementares' as const

export const IDIOMAS_TITULO = 'Idiomas' as const

export const HABILIDADES_TITULO = 'Habilidades Técnicas' as const

export const EXPERIENCIA_TITULO = 'Experiência Profissional' as const
