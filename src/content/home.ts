// Conteúdo da home. Origem: App.tsx (projeto legado Vite, na raiz do repositório).
// Textos copiados literalmente, incluindo acentuação, pontuação e emojis.
//
// ─── O QUE **NÃO** FOI EXTRAÍDO (não separável do markup / não é conteúdo) ─────────
// 1. getTheme (App.tsx:87-145): mapa de classes Tailwind por tema (claro/escuro).
//    É estilo, não conteúdo — 40+ chaves de className, ficou fora de propósito.
// 2. Ícones SVG inline (App.tsx:8-84): ChevronDown, WhatsApp, Instagram, Youtube,
//    LinkedIn, Mail, Heart, Code, Sparkles, Sun, Moon, Menu, Close. São componentes JSX.
// 3. Estado e lógica da página: tema persistido em localStorage (chave 'site-theme',
//    App.tsx:185/238), isScrolled > 60px (App.tsx:222), lock de scroll do menu mobile
//    (App.tsx:227-233), roteamento por hash '#privacidade' (App.tsx:198-213),
//    animationDelay de 80ms por card (App.tsx:549).
// 4. Conteúdo da página de privacidade: vive em components/PrivacyPolicy.tsx,
//    não na home.
// 5. App.tsx:4 importa ChatBubbleIcon e App.tsx:698-699 tem a seção "Chat Widget"
//    VAZIA — não há widget de chat renderizado hoje, portanto não há conteúdo a extrair.
// 6. App.tsx:216 declara `const techYears = 30`, mas o array de estatísticas
//    (App.tsx:428) usa o literal 30 — a variável não é usada ali. Mantive os dois.
//
// ─── DECISÕES DE ESTRUTURA MINHAS (o texto é literal, a quebra em campos não existe
//     como array/objeto no código atual — lá é markup inline) ─────────────────────
// a. HERO.title (h1, App.tsx:384-389): duas linhas separadas por <br /> e a segunda
//    dentro de um <span> com gradiente. Virou { lineOne, lineTwoGradient }.
// b. HERO.rolesLine (p, App.tsx:391-394): dois <strong> com ' e ' e '.' entre eles.
//    Virou { strongOne, connector, strongTwo, punctuation }.
// c. ABOUT.title (h2, App.tsx:448-452): texto com dois <span> coloridos.
//    Virou { prefix, highlightAmber, connector, highlightEmerald }.
// d. CTA.title (h2, App.tsx:566-568): duas linhas separadas por <br />.
//    Virou { lineOne, lineTwo }.
// e. LOGO/FOOTER_LOGO (App.tsx:275, 659): 'Marcio ' + <span>'Rolim'</span>.
//    Virou { prefix, accent }.
// f. Parágrafos escritos em várias linhas no JSX foram unidos em uma única string,
//    com espaço simples, exatamente como o navegador os renderiza hoje.

import type { SocialKey } from './site'

// ─── Navegação ──────────────────────────────────────────────────────

export type NavLink = {
  readonly href: string
  readonly label: string
}

// origem: App.tsx:247-251 (navLinks)
export const NAV_LINKS = [
  { href: '#sobre', label: 'Sobre' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#contato', label: 'Contato' },
] as const satisfies readonly NavLink[]

export type LogoText = {
  readonly prefix: string
  readonly accent: string
}

// origem: App.tsx:275 — <span>Marcio <span className={t.accent}>Rolim</span></span>
export const LOGO = {
  prefix: 'Marcio ',
  accent: 'Rolim',
} as const satisfies LogoText

export type NavbarCopy = {
  readonly ctaDesktop: string
  readonly ctaMobile: string
  readonly themeToggleToLight: string
  readonly themeToggleToDark: string
}

// origem: App.tsx:302, 313, 352
export const NAVBAR = {
  ctaDesktop: 'Conversar', // App.tsx:313
  ctaMobile: 'Conversar pelo WhatsApp', // App.tsx:352
  themeToggleToLight: 'Modo Claro', // App.tsx:302 (title quando isDark === true)
  themeToggleToDark: 'Modo Escuro', // App.tsx:302 (title quando isDark === false)
} as const satisfies NavbarCopy

// ─── Hero ───────────────────────────────────────────────────────────

export type HeroTitle = {
  readonly lineOne: string
  readonly lineTwoGradient: string
}

export type HeroRolesLine = {
  readonly strongOne: string
  readonly connector: string
  readonly strongTwo: string
  readonly punctuation: string
}

export type HeroCta = {
  readonly label: string
  readonly href: string
}

export type HeroContent = {
  readonly badge: string
  readonly title: HeroTitle
  readonly rolesLine: HeroRolesLine
  readonly description: string
  readonly primaryCta: HeroCta
  readonly secondaryCta: HeroCta
}

// origem: App.tsx:379-416
export const HERO = {
  badge: 'Tecnologia & Propósito', // App.tsx:381
  title: {
    lineOne: 'Olá, eu sou', // App.tsx:385
    lineTwoGradient: 'Marcio Rolim', // App.tsx:387
  },
  rolesLine: {
    strongOne: 'Consultor de Tecnologia', // App.tsx:392
    connector: ' e ', // App.tsx:392 (' e ' entre os dois <strong>)
    strongTwo: 'Pastor', // App.tsx:393
    punctuation: '.', // App.tsx:393
  },
  description:
    'Unindo mais de 30 anos de experiência em tecnologia com chamado espiritual para transformar vidas e negócios. Especialista em IA, desenvolvimento web e gestão de tráfego.', // App.tsx:396
  primaryCta: {
    label: 'Vamos Conversar', // App.tsx:407
    href: 'https://wa.me/5511980888880', // App.tsx:401 (SOCIAL_LINKS.whatsapp)
  },
  secondaryCta: {
    label: 'Conhecer mais', // App.tsx:413
    href: '#sobre', // App.tsx:410
  },
} as const satisfies HeroContent

// ─── Estatísticas (contagem animada via components/CountUp.tsx) ─────

export type HomeStat = {
  readonly end: number
  readonly label: string
  readonly suffix: string
}

// origem: App.tsx:170-177 (calculateAge), copiada sem alteração
export const calculateAge = (birthDate: string): number => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// origem: App.tsx:179 (calculateYearsSince), copiada sem alteração
export const calculateYearsSince = (year: number): number =>
  new Date().getFullYear() - year

// origem: App.tsx:215-217
export const BIRTH_DATE = '1973-04-18' as const // App.tsx:215
export const TECH_YEARS = 30 as const // App.tsx:216 (declarado, não usado no array de stats)
export const MINISTRY_START_YEAR = 2012 as const // App.tsx:217

// origem: App.tsx:426-431 — dois valores são calculados em tempo de execução
// (idade e anos de ministério), por isso as estatísticas são geradas por função.
export const getHomeStats = (): readonly HomeStat[] => [
  { end: calculateAge(BIRTH_DATE), label: 'Anos de vida', suffix: '' }, // App.tsx:427
  { end: 30, label: 'Anos em tecnologia', suffix: '+' }, // App.tsx:428
  {
    end: calculateYearsSince(MINISTRY_START_YEAR),
    label: 'Anos de ministério',
    suffix: '+',
  }, // App.tsx:429
  { end: 4, label: 'Filhas abençoadas', suffix: '' }, // App.tsx:430
]

// ─── Seção "Sobre" / dupla identidade ───────────────────────────────

export type AboutTitle = {
  readonly prefix: string
  readonly highlightAmber: string
  readonly connector: string
  readonly highlightEmerald: string
}

export type IdentityCard = {
  readonly id: 'pastoral' | 'tech'
  readonly badge: string
  readonly title: string
  readonly description: string
  readonly tags: readonly string[]
}

export type AboutContent = {
  readonly eyebrow: string
  readonly title: AboutTitle
  readonly lead: string
  readonly cards: readonly IdentityCard[]
}

// origem: App.tsx:444-503
export const ABOUT = {
  eyebrow: 'Quem sou eu', // App.tsx:447
  title: {
    prefix: 'Uma jornada de ', // App.tsx:449
    highlightAmber: 'fé', // App.tsx:450
    connector: ' e ', // App.tsx:450
    highlightEmerald: 'tecnologia', // App.tsx:451
  },
  lead:
    'Minha vida é definida pela combinação de duas vocações: servir a Deus com excelência e inovar através da tecnologia. Casado, pai de quatro filhas e avô de dois netos — cada experiência fortalece meu propósito.', // App.tsx:454-455
  cards: [
    {
      id: 'pastoral', // App.tsx:461 (comentário {/* Pastoral */})
      badge: 'Pessoal', // App.tsx:467
      title: 'Pastor Evangélico', // App.tsx:469
      description:
        'Desde 2012, dedico meu ministério ao cuidado espiritual de famílias, jovens e casais. Acredito que cada ser humano tem um chamado especial. Minha missão é ajudar pessoas a encontrar propósito, superar adversidades e construir relacionamentos sólidos à luz da Palavra de Deus.', // App.tsx:471-473
      tags: ['Aconselhamento', 'Liderança', 'Mentoria', 'Família', 'Jovens'], // App.tsx:476
    },
    {
      id: 'tech', // App.tsx:482 (comentário {/* Tech */})
      badge: 'Profissional', // App.tsx:488
      title: 'Especialista em Tecnologia', // App.tsx:490
      description:
        'Com mais de 30 anos no mercado de tecnologia, atuo com desenvolvimento de aplicativos, websites, automação com Inteligência Artificial e gestão de tráfego. Transformo ideias em soluções digitais que geram impacto real, unindo estratégia, criatividade e resultados mensuráveis.', // App.tsx:492-494
      tags: ['IA', 'Desenvolvimento', 'Tráfego', 'Automação', 'E-commerce'], // App.tsx:497
    },
  ],
} as const satisfies AboutContent

// ─── Skills / serviços (abas Tecnologia e Pastoral) ─────────────────

export type Skill = {
  readonly icon: string
  readonly title: string
  readonly description: string
  readonly color: string
}

// origem: App.tsx:148-153 (SKILLS_PASTORAL), cópia literal
export const SKILLS_PASTORAL = [
  {
    icon: '🙏',
    title: 'Liderança Pastoral',
    description:
      'Orientação espiritual para famílias e comunidades, fortalecendo valores e construindo alicerces sólidos.',
    color: 'amber',
  },
  {
    icon: '💬',
    title: 'Mentoria & Aconselhamento',
    description:
      'Direcionamento personalizado em momentos de decisão, com sabedoria e escuta ativa.',
    color: 'orange',
  },
  {
    icon: '❤️',
    title: 'Empatia & Comunicação',
    description:
      'Cada pessoa carrega uma história. Escuto com o coração e me conecto de verdade.',
    color: 'rose',
  },
  {
    icon: '✨',
    title: 'Visão & Propósito',
    description:
      'Todo ser humano tem um propósito único. Ajudo você a encontrar o seu e vivê-lo com plenitude.',
    color: 'yellow',
  },
] as const satisfies readonly Skill[]

// origem: App.tsx:155-160 (SKILLS_TECH), cópia literal
export const SKILLS_TECH = [
  {
    icon: '🤖',
    title: 'Inteligência Artificial',
    description:
      'Agentes de IA, automação inteligente e soluções que transformam a forma de trabalhar.',
    color: 'violet',
  },
  {
    icon: '💻',
    title: 'Desenvolvimento Web',
    description:
      'Websites e aplicativos modernos, rápidos e com design que encanta usuários.',
    color: 'emerald',
  },
  {
    icon: '📈',
    title: 'Gestão de Tráfego',
    description:
      'Campanhas META e Google ADS com estratégia focada em resultados e ROI.',
    color: 'sky',
  },
  {
    icon: '🛒',
    title: 'E-commerce & Digital',
    description: 'Lojas virtuais de alta performance e ecossistemas digitais completos.',
    color: 'teal',
  },
] as const satisfies readonly Skill[]

export type ServicesTabId = 'tech' | 'pastoral'

export type ServicesTab = {
  readonly id: ServicesTabId
  readonly label: string
}

export type ServicesContent = {
  readonly id: string
  readonly eyebrow: string
  readonly title: string
  readonly subtitle: string
  readonly defaultTab: ServicesTabId
  readonly tabs: readonly ServicesTab[]
}

// origem: App.tsx:507-540 (+ App.tsx:190 para o estado inicial da aba)
export const SERVICES = {
  id: 'servicos', // App.tsx:507 (id da <section>)
  eyebrow: 'O que eu faço', // App.tsx:510
  title: 'Como posso ajudar você', // App.tsx:512
  subtitle: 'Duas áreas de atuação, um mesmo propósito: gerar transformação real.', // App.tsx:515
  defaultTab: 'tech', // App.tsx:190 (useState<'pastoral' | 'tech'>('tech'))
  tabs: [
    { id: 'tech', label: 'Tecnologia' }, // App.tsx:528
    { id: 'pastoral', label: 'Pastoral' }, // App.tsx:538
  ],
} as const satisfies ServicesContent

// origem: App.tsx:545 — a aba ativa escolhe qual array de skills é renderizado
export const SKILLS_BY_TAB = {
  tech: SKILLS_TECH,
  pastoral: SKILLS_PASTORAL,
} as const satisfies Record<ServicesTabId, readonly Skill[]>

// ─── CTA ────────────────────────────────────────────────────────────

export type CtaTitle = {
  readonly lineOne: string
  readonly lineTwo: string
}

export type CtaContent = {
  readonly emoji: string
  readonly title: CtaTitle
  readonly description: string
  readonly buttonLabel: string
  readonly buttonHref: string
}

// origem: App.tsx:561-583
export const CTA = {
  emoji: '🚀', // App.tsx:564
  title: {
    lineOne: 'Pronto para dar o', // App.tsx:567
    lineTwo: 'próximo passo?', // App.tsx:567 (após o <br />)
  },
  description:
    'Seja para impulsionar seu negócio com tecnologia de ponta ou encontrar orientação espiritual, estou aqui para caminhar com você.', // App.tsx:570-571
  buttonLabel: 'Fale Comigo', // App.tsx:581
  buttonHref: 'https://wa.me/5511980888880', // App.tsx:575 (SOCIAL_LINKS.whatsapp)
} as const satisfies CtaContent

// ─── Contato / redes sociais ────────────────────────────────────────

export type HomeSocialButton = {
  readonly key: SocialKey
  readonly label: string
  readonly gradient: string
  readonly gradientDark?: string
}

export type VideoCardContent = {
  readonly title: string
  readonly subtitle: string
  readonly closeLabel: string
  readonly fallbackText: string
}

export type ContactContent = {
  readonly id: string
  readonly eyebrow: string
  readonly title: string
  readonly subtitle: string
  readonly socials: readonly HomeSocialButton[]
  readonly video: VideoCardContent
}

// origem: App.tsx:588-646 (+ App.tsx:684-693 para o modal de vídeo)
export const CONTACT_SECTION = {
  id: 'contato', // App.tsx:588 (id da <section>)
  eyebrow: 'Redes Sociais', // App.tsx:590
  title: 'Conecte-se comigo', // App.tsx:592
  subtitle: 'Acompanhe conteúdos sobre tecnologia, fé e vida nas minhas redes.', // App.tsx:595
  socials: [
    { key: 'instagram', label: 'Instagram', gradient: 'from-purple-500 to-pink-500' }, // App.tsx:601
    { key: 'youtube', label: 'YouTube', gradient: 'from-red-500 to-red-600' }, // App.tsx:602
    { key: 'linkedin', label: 'LinkedIn', gradient: 'from-blue-600 to-blue-700' }, // App.tsx:603
    {
      key: 'email',
      label: 'Email',
      gradient: 'from-stone-600 to-stone-700',
      gradientDark: 'from-slate-600 to-slate-700',
    }, // App.tsx:604 (gradiente depende de isDark)
  ],
  video: {
    title: 'Olha o que Deus fez comigo', // App.tsx:633
    subtitle: 'Minha história de transformação e fé', // App.tsx:636
    closeLabel: 'Fechar vídeo', // App.tsx:688 (aria-label)
    fallbackText: 'Seu navegador não suporta a tag de vídeo.', // App.tsx:692
  },
} as const satisfies ContactContent

// ─── Rodapé ─────────────────────────────────────────────────────────

export type FooterContent = {
  readonly logo: LogoText
  readonly tagline: string
  readonly copyrightPrefix: string
  readonly copyrightSuffix: string
  readonly privacyLabel: string
  readonly creed: string
}

// origem: App.tsx:651-671
export const FOOTER = {
  logo: {
    prefix: 'Marcio ', // App.tsx:659
    accent: 'Rolim', // App.tsx:659
  },
  tagline: 'Transformando vidas através da fé e tecnologia.', // App.tsx:662
  copyrightPrefix: '© ', // App.tsx:666 (antes de {new Date().getFullYear()})
  copyrightSuffix: ' Marcio Rolim. ', // App.tsx:666 (depois do ano, antes do link)
  privacyLabel: 'Privacidade', // App.tsx:666
  creed: '❤️ Eu creio em Deus.', // App.tsx:667
} as const satisfies FooterContent

// ─── Âncoras das seções, na ordem em que aparecem na home ───────────

export const SECTION_ORDER = [
  'nav', // App.tsx:267
  'hero', // App.tsx:359
  'stats', // App.tsx:423
  'sobre', // App.tsx:444
  'servicos', // App.tsx:507
  'cta', // App.tsx:561
  'contato', // App.tsx:588
  'footer', // App.tsx:651
] as const
