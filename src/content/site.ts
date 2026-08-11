// Dados globais do site (usados por várias páginas).
// Origem: App.tsx e index.html do projeto legado (Vite), na raiz do repositório.
// Todos os textos em português foram copiados literalmente da origem, sem reescrita.
//
// Valores DERIVADOS (não existem literalmente no código atual, marcados caso a caso abaixo):
//   - CONTACT.phone.formatted   -> formatação de 'https://wa.me/5511980888880' (App.tsx:167)
//   - SITE.domain               -> extraído de <link rel="canonical"> (index.html:18)
//   - SOCIAL_LINKS_LIST[whatsapp].label -> o link de WhatsApp não aparece no array de
//     ícones sociais (App.tsx:600-604), portanto não tem rótulo literal na origem.

// ─── Identidade ─────────────────────────────────────────────────────

export type SiteIdentity = {
  readonly name: string
  readonly jobTitles: readonly string[]
  readonly headline: string
  readonly pageTitle: string
  readonly siteName: string
  readonly locale: string
  readonly lang: string
  readonly canonicalUrl: string
  readonly domain: string
  readonly description: string
  readonly ogDescription: string
}

// origem: index.html:2, 9, 13, 18, 28-35, 66-67
export const SITE = {
  name: 'Marcio Rolim', // index.html:66 ("name" do schema Person)
  jobTitles: ['Consultor de Tecnologia', 'Pastor Evangélico'], // index.html:67
  headline: 'Marcio Rolim - Consultor de Tecnologia & Pastor', // index.html:29 (og:title)
  pageTitle:
    'Marcio Rolim - Consultor de Tecnologia & Pastor | IA, Desenvolvimento Web, Mentoria', // index.html:9
  siteName: 'Marcio Rolim', // index.html:34 (og:site_name)
  locale: 'pt_BR', // index.html:35 (og:locale)
  lang: 'pt-BR', // index.html:2 (<html lang>)
  canonicalUrl: 'https://marciorolim.com.br/', // index.html:18
  domain: 'marciorolim.com.br', // DERIVADO de index.html:18
  description:
    'Marcio Rolim: Consultor de Tecnologia especialista em IA, Desenvolvimento Web e Marketing Digital. Pastor com experiência em mentoria e aconselhamento. Transformando vidas e negócios.', // index.html:12-13
  ogDescription:
    'Transformando vidas e negócios através da tecnologia e fé. Especialista em IA, Desenvolvimento Web e Mentoria.', // index.html:30-31
} as const satisfies SiteIdentity

// Origem absoluta, SEM barra final. DERIVADO de SITE.canonicalUrl.
// As rotas de metadata (robots.ts, sitemap.ts) exigem URLs absolutas.
export const BASE_URL = 'https://marciorolim.com.br' as const

// Monta a URL absoluta de um caminho do site. A barra final na base é
// necessária: sem ela, `new URL('/x', 'https://a.com')` ainda funciona, mas a
// base perde o significado de diretório e qualquer caminho relativo quebra.
export const urlAbsoluta = (caminho: string): string =>
  new URL(caminho, `${BASE_URL}/`).toString()

// ─── Contato ────────────────────────────────────────────────────────

export type PhoneNumber = {
  readonly raw: string
  readonly e164: string
  readonly formatted: string
}

export type SiteContact = {
  readonly email: string
  readonly emailHref: string
  readonly privacyEmail: string
  readonly privacyEmailHref: string
  readonly phone: PhoneNumber
  readonly whatsappUrl: string
}

// origem: App.tsx:166-167 e index.html:119
export const CONTACT = {
  email: 'contato@marciorolim.com.br', // App.tsx:166 (extraído do mailto:)
  emailHref: 'mailto:contato@marciorolim.com.br', // App.tsx:166
  // NOVO (não vem do legado): canal qualificado e exclusivo de proteção de dados.
  // A ANPD pede um canal identificado como tal; 'contato@' é genérico demais.
  privacyEmail: 'privacidade@marciorolim.com.br',
  privacyEmailHref: 'mailto:privacidade@marciorolim.com.br',
  phone: {
    raw: '5511980888880', // App.tsx:167 (número dentro de https://wa.me/)
    e164: '+5511980888880', // index.html:119 ("telephone" do schema ProfessionalService)
    formatted: '(11) 98088-8880', // DERIVADO de App.tsx:167
  },
  whatsappUrl: 'https://wa.me/5511980888880', // App.tsx:167
} as const satisfies SiteContact

// ─── Redes sociais ──────────────────────────────────────────────────

export type SocialKey = 'instagram' | 'youtube' | 'linkedin' | 'email' | 'whatsapp'

export type SocialLink = {
  readonly key: SocialKey
  readonly url: string
  readonly label: string
}

// origem: App.tsx:162-168 (objeto SOCIAL_LINKS, cópia literal)
export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/marciorolim',
  youtube: 'https://youtube.com/marciorolim',
  linkedin: 'https://linkedin.com/in/marciorolim',
  email: 'mailto:contato@marciorolim.com.br',
  whatsapp: 'https://wa.me/5511980888880',
} as const satisfies Record<SocialKey, string>

// URLs: App.tsx:162-168 | rótulos: App.tsx:601-604 (array de ícones da seção "Redes Sociais")
export const SOCIAL_LINKS_LIST = [
  { key: 'instagram', url: 'https://instagram.com/marciorolim', label: 'Instagram' }, // App.tsx:601
  { key: 'youtube', url: 'https://youtube.com/marciorolim', label: 'YouTube' }, // App.tsx:602
  { key: 'linkedin', url: 'https://linkedin.com/in/marciorolim', label: 'LinkedIn' }, // App.tsx:603
  { key: 'email', url: 'mailto:contato@marciorolim.com.br', label: 'Email' }, // App.tsx:604
  { key: 'whatsapp', url: 'https://wa.me/5511980888880', label: 'WhatsApp' }, // rótulo DERIVADO
] as const satisfies readonly SocialLink[]

// origem: index.html:71-75 ("sameAs" do schema Person)
export const SOCIAL_SAME_AS = [
  'https://instagram.com/marciorolim',
  'https://youtube.com/marciorolim',
  'https://linkedin.com/in/marciorolim',
] as const satisfies readonly string[]

// ─── Mídia ──────────────────────────────────────────────────────────

export type SiteMedia = {
  readonly profileImageUrl: string
  readonly heroImageUrl: string
  readonly videoUrl: string
  readonly faviconUrl: string
  readonly appleTouchIconUrl: string
  readonly ogImageUrl: string
  readonly twitterImageUrl: string
  readonly schemaImageUrl: string
}

// origem: App.tsx:243-245 e index.html:6-7, 32-33, 42-43, 58-59, 70
export const MEDIA = {
  profileImageUrl: 'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg', // App.tsx:243
  heroImageUrl: 'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg', // App.tsx:244
  videoUrl:
    'https://sites.arquivo.download/marciorolim/Olhe%20o%20que%20Deus%20fez%20comigo.mp4', // App.tsx:245
  faviconUrl: 'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg', // index.html:6-7
  appleTouchIconUrl: 'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg', // index.html:58-59
  ogImageUrl: 'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg', // index.html:32-33
  twitterImageUrl: 'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg', // index.html:42-43
  schemaImageUrl: 'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg', // index.html:70
} as const satisfies SiteMedia

// Textos alternativos das imagens, como estão hoje no markup.
export type MediaAltText = {
  readonly navLogo: string
  readonly hero: string
  readonly footerLogo: string
}

// origem: App.tsx:273, 372, 657
export const MEDIA_ALT = {
  navLogo: 'Marcio Rolim', // App.tsx:273
  hero: 'Marcio Rolim - Consultor de Tecnologia e Pastor', // App.tsx:372
  footerLogo: 'Marcio Rolim', // App.tsx:657
} as const satisfies MediaAltText

// ─── Marca (tailwind.config inline do index.html) ───────────────────

export type BrandColorKey = 'dark' | 'light' | 'grey' | 'gold'

export type BrandColors = Record<BrandColorKey, string>

// origem: index.html:135-142 (theme.extend.colors.brand)
export const BRAND_COLORS = {
  dark: '#020617', // slate-950
  light: '#f5f5f4', // stone-50
  grey: '#1e293b', // slate-800
  gold: '#f59e0b', // amber-500
} as const satisfies BrandColors

// origem: index.html:132-134 (theme.extend.fontFamily.sans)
export const BRAND_FONT_FAMILY_SANS = ['Inter', 'system-ui', 'sans-serif'] as const

export type ThemeColorMeta = {
  readonly light: string
  readonly dark: string
  readonly msTileColor: string
}

// origem: index.html:46-48 (<meta name="theme-color"> e msapplication-TileColor)
export const THEME_COLOR_META = {
  light: '#f5f5f4',
  dark: '#020617',
  msTileColor: '#f5f5f4',
} as const satisfies ThemeColorMeta

// ─── SEO complementar ───────────────────────────────────────────────

export type SiteSeo = {
  readonly keywords: readonly string[]
  readonly robots: string
  readonly author: string
  readonly aiContentType: string
  readonly aiOptimized: string
  readonly aiDescription: string
  readonly twitterCard: string
}

// origem: index.html:14-24, 38
export const SEO = {
  keywords: [
    'Marcio Rolim',
    'Consultor de Tecnologia',
    'Inteligência Artificial',
    'Desenvolvimento Web',
    'E-commerce',
    'Marketing Digital',
    'Pastor Evangélico',
    'Mentoria',
    'Aconselhamento',
    'São Paulo',
  ], // index.html:14-15 (string única, separada por vírgulas na origem)
  robots: 'index, follow, max-image-preview:large', // index.html:17
  author: 'Marcio Rolim', // index.html:16
  aiContentType: 'personal-brand-professional-portfolio', // index.html:21
  aiOptimized: 'true', // index.html:22
  aiDescription:
    'Official personal website of Marcio Rolim. Tech consultant specializing in AI, Web Development, and Digital Marketing. Also a Pastor focused on mentoring and spiritual counseling.', // index.html:23-24
  twitterCard: 'summary_large_image', // index.html:38
} as const satisfies SiteSeo

export type PostalAddress = {
  readonly addressLocality: string
  readonly addressRegion: string
  readonly addressCountry: string
}

// origem: index.html:102-107 (schema Person > address)
export const ADDRESS = {
  addressLocality: 'São Paulo',
  addressRegion: 'SP',
  addressCountry: 'BR',
} as const satisfies PostalAddress

// ─── Dados estruturados (JSON-LD) ───────────────────────────────────
// Os dois <script type="application/ld+json"> de index.html:62-124 viviam soltos
// no <head>. Aqui ficam como dados; a home monta o JSON a partir deles.

// origem: index.html:68 — "description" do schema Person.
// É um texto PRÓPRIO: difere de SITE.description (sem o prefixo 'Marcio Rolim: '
// e sem a frase final 'Transformando vidas e negócios.').
export const PERSON_SCHEMA_DESCRIPTION =
  'Consultor de Tecnologia especialista em IA, Desenvolvimento Web e Marketing Digital. Pastor com experiência em mentoria e aconselhamento.' as const

export type KnowsAboutItem = {
  readonly name: string
  readonly description: string
}

// origem: index.html:76-97 — "knowsAbout" do schema Person.
// Na origem cada item é um nó {"@type": "Text", name, description}; o "@type"
// é remontado na página, aqui ficam só os dados.
export const KNOWS_ABOUT = [
  {
    name: 'Inteligência Artificial',
    description: 'Implementação de soluções de IA para negócios e automação.',
  },
  {
    name: 'Desenvolvimento de Software',
    description: 'Criação de aplicações web modernas e escaláveis.',
  },
  {
    name: 'Marketing Digital',
    description: 'Gestão de tráfego e estratégias de conversão online.',
  },
  {
    name: 'Liderança Pastoral',
    description: 'Aconselhamento espiritual e mentoria familiar.',
  },
] as const satisfies readonly KnowsAboutItem[]

export type ProfessionalServiceSchema = {
  readonly name: string
  readonly description: string
  readonly url: string
  readonly telephone: string
  readonly priceRange: string
  readonly areaServed: string
  readonly serviceType: readonly string[]
}

// origem: index.html:112-124 — schema ProfessionalService, cópia literal.
export const PROFESSIONAL_SERVICE = {
  name: 'Marcio Rolim - Consultoria em Tecnologia',
  description:
    'Serviços de consultoria em tecnologia, desenvolvimento web, IA e marketing digital.',
  url: 'https://marciorolim.com.br/',
  telephone: '+5511980888880',
  priceRange: '$$',
  areaServed: 'BR',
  serviceType: [
    'Consultoria em Tecnologia',
    'Desenvolvimento Web',
    'IA',
    'Marketing Digital',
  ],
} as const satisfies ProfessionalServiceSchema

// ─── PWA (textos do manifest) ───────────────────────────────────────

export type PwaContent = {
  readonly name: string
  readonly shortName: string
  readonly description: string
  readonly startUrl: string
  readonly backgroundColor: string
  readonly themeColor: string
}

// origem: manifest.json (raiz do repositório), cópia literal.
// NOTA para o dono: backgroundColor/themeColor são #1a1a1a, um cinza que não
// corresponde a nenhum dos dois temas do site (claro #f5f5f4, escuro #020617,
// ver THEME_COLOR_META). Sobrou de um design anterior e aparece na splash
// screen do app instalado. Mantido literal aqui porque trocá-lo é decisão de
// design, não de migração.
export const PWA = {
  name: 'Marcio Rolim - Página Pessoal', // manifest.json:2
  shortName: 'Marcio Rolim', // manifest.json:3
  description:
    'Página Pessoal de Marcio Rolim, Consultor de Tecnologia, Pastor e Especialista em IA. Conheça meus projetos, habilidades e entre em contato.', // manifest.json:4
  startUrl: '/', // manifest.json:5
  backgroundColor: '#1a1a1a', // manifest.json:7
  themeColor: '#1a1a1a', // manifest.json:8
} as const satisfies PwaContent

// ─── Página 404 ─────────────────────────────────────────────────────

export type NotFoundContent = {
  readonly code: string
  readonly title: string
  readonly description: string
  readonly homeLabel: string
  readonly contactLabel: string
}

// Texto NOVO: não há origem no projeto legado. O site Vite nunca teve uma
// página 404 — o catch-all do vercel.json ("/((?!api/|curriculum).*)" ->
// /index.html) devolvia a home, com status 200, para qualquer caminho
// desconhecido. Ou seja: nenhum endereço quebrado jamais foi sinalizado ao
// visitante nem ao buscador.
export const NOT_FOUND = {
  code: '404',
  title: 'Página não encontrada',
  description:
    'O endereço que você abriu não existe ou foi movido. Se você chegou por um link antigo, ele provavelmente mudou de lugar.',
  homeLabel: 'Voltar para a home',
  contactLabel: 'Falar no WhatsApp',
} as const satisfies NotFoundContent
