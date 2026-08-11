import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import type { IconeComponente } from '@/components/icon-registry'
import {
  ChevronDownIcon,
  CodeIcon,
  HeartIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  SparklesIcon,
  WhatsAppIcon,
  YoutubeIcon,
} from '@/components/icons'
import { LegacyPrivacyHashRedirect } from '@/components/site/legacy-privacy-hash'
import { ServicesTabs } from '@/components/site/services-tabs'
import { SiteNav } from '@/components/site/site-nav'
import { VideoTestimony } from '@/components/site/video-testimony'
import { CountUp } from '@/components/ui/count-up'
import {
  ABOUT,
  CONTACT_SECTION,
  CTA,
  FOOTER,
  HERO,
  SERVICES,
  getHomeStats,
  type IdentityCard,
} from '@/content/home'
import {
  ADDRESS,
  KNOWS_ABOUT,
  MEDIA,
  MEDIA_ALT,
  PERSON_SCHEMA_DESCRIPTION,
  PROFESSIONAL_SERVICE,
  SEO,
  SITE,
  SOCIAL_LINKS,
  SOCIAL_SAME_AS,
  type SocialKey,
} from '@/content/site'

export const metadata: Metadata = {
  // `absolute` porque o título da home já é completo — o template do layout
  // ('%s | Marcio Rolim') acrescentaria a marca uma segunda vez.
  title: { absolute: SITE.pageTitle },
  description: SITE.description,
  keywords: [...SEO.keywords],
  authors: [{ name: SEO.author }],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: {
    type: 'website',
    url: SITE.canonicalUrl,
    title: SITE.headline,
    description: SITE.ogDescription,
    siteName: SITE.siteName,
    locale: SITE.locale,
    images: [{ url: MEDIA.ogImageUrl }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.headline,
    description: SITE.ogDescription,
    images: [MEDIA.twitterImageUrl],
  },
  // As <meta name="ai-*"> de index.html:20-24 não têm campo próprio no objeto
  // Metadata; `other` as emite como estão.
  other: {
    'ai-content-type': SEO.aiContentType,
    'ai-optimized': SEO.aiOptimized,
    'ai-description': SEO.aiDescription,
  },
}

// A idade e os anos de ministério saem de `new Date()`. Numa página estática
// isso congelaria no build: com revalidação diária, o número se corrige sozinho
// no dia do aniversário sem precisar de deploy.
export const revalidate = 86400

// ─── Classes compartilhadas ─────────────────────────────────────────
// O site legado escolhia classes por `getTheme(isDark)` (App.tsx:87-145) e
// espalhava o objeto por toda a árvore. Aqui cada constante é a união literal
// dos dois temas — escritas por extenso porque o Tailwind 4 encontra as classes
// lendo o texto do código-fonte, não avaliando expressões.

const TITULO = 'text-stone-900 dark:text-white'
const TEXTO_SECUNDARIO = 'text-stone-500 dark:text-slate-400'
const TEXTO_APAGADO = 'text-stone-400 dark:text-slate-500'
const ACENTO = 'text-amber-600 dark:text-amber-400'
const DIVISOR = 'border-stone-200 dark:border-slate-800'

const ESTILO_IDENTIDADE = {
  pastoral: {
    Icone: HeartIcon,
    cartao:
      'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 hover:border-amber-300 dark:from-amber-500/5 dark:to-orange-500/5 dark:border-amber-500/10 dark:hover:border-amber-500/30',
    fundoIcone: 'bg-amber-100 dark:bg-amber-500/10',
    corIcone: 'text-amber-600 dark:text-amber-400',
    etiqueta:
      'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  },
  tech: {
    Icone: CodeIcon,
    cartao:
      'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 hover:border-emerald-300 dark:from-emerald-500/5 dark:to-teal-500/5 dark:border-emerald-500/10 dark:hover:border-emerald-500/30',
    fundoIcone: 'bg-emerald-100 dark:bg-emerald-500/10',
    corIcone: 'text-emerald-600 dark:text-emerald-400',
    etiqueta:
      'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  },
} as const satisfies Record<IdentityCard['id'], unknown>

const ICONE_SOCIAL: Partial<Record<SocialKey, { Icone: IconeComponente; classe: string }>> =
  {
    instagram: { Icone: InstagramIcon, classe: 'h-6 w-6' },
    youtube: { Icone: YoutubeIcon, classe: 'h-6 w-6' },
    linkedin: { Icone: LinkedInIcon, classe: 'h-5 w-5' },
    email: { Icone: MailIcon, classe: 'h-6 w-6' },
  }

// `gradientDark` no módulo de conteúdo guarda o valor de origem, sem prefixo.
// A variante precisa aparecer escrita para o Tailwind gerar a regra.
const GRADIENTE_SOCIAL_ESCURO: Partial<Record<SocialKey, string>> = {
  email: 'dark:from-slate-600 dark:to-slate-700',
}

// ─── JSON-LD ────────────────────────────────────────────────────────
// Origem: index.html:62-124, os dois <script type="application/ld+json">.

const SCHEMA_PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE.name,
  jobTitle: SITE.jobTitles,
  description: PERSON_SCHEMA_DESCRIPTION,
  url: SITE.canonicalUrl,
  image: MEDIA.schemaImageUrl,
  sameAs: SOCIAL_SAME_AS,
  knowsAbout: KNOWS_ABOUT.map((item) => ({ '@type': 'Text', ...item })),
  mainEntityOfPage: { '@type': 'WebPage', '@id': SITE.canonicalUrl },
  address: { '@type': 'PostalAddress', ...ADDRESS },
}

const SCHEMA_SERVICO = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  ...PROFESSIONAL_SERVICE,
}

export default function HomePage() {
  const estatisticas = getHomeStats()
  const anoAtual = new Date().getFullYear()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_PERSON) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_SERVICO) }}
      />

      <LegacyPrivacyHashRedirect />

      <div className="min-h-screen bg-stone-50 text-stone-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <SiteNav />

        {/* ─── Hero ─── */}
        <header className="relative overflow-hidden pt-20 md:pt-24">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-200/30 dark:bg-amber-500/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-500/8 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              {/* Foto */}
              <div className="relative flex-shrink-0">
                <div className="relative">
                  <div className="w-44 h-44 md:w-56 md:h-56 rounded-3xl overflow-hidden ring-4 ring-amber-200/60 dark:ring-amber-500/20 shadow-2xl shadow-amber-200/40 dark:shadow-amber-500/10 hover:rotate-3 transition-transform duration-700">
                    <Image
                      src={MEDIA.heroImageUrl}
                      alt={MEDIA_ALT.hero}
                      width={224}
                      height={224}
                      priority
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Texto */}
              <div className="flex-1 text-center md:text-left">
                <div
                  className={`inline-flex items-center gap-2 bg-amber-50 border-amber-200/50 dark:bg-amber-500/10 dark:border-amber-500/20 border px-4 py-2 rounded-full text-sm font-medium ${ACENTO} mb-5`}
                >
                  <SparklesIcon className="w-4 h-4" />
                  {HERO.badge}
                </div>

                <h1
                  className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold ${TITULO} leading-[1.1] mb-5 tracking-tight`}
                >
                  {HERO.title.lineOne}
                  <br />
                  <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                    {HERO.title.lineTwoGradient}
                  </span>
                </h1>

                <p
                  className={`text-lg sm:text-xl ${TEXTO_SECUNDARIO} mb-4 max-w-xl leading-relaxed`}
                >
                  <strong className={TITULO}>{HERO.rolesLine.strongOne}</strong>
                  {HERO.rolesLine.connector}
                  <strong className={TITULO}>{HERO.rolesLine.strongTwo}</strong>
                  {HERO.rolesLine.punctuation}
                </p>
                <p className={`text-base ${TEXTO_APAGADO} mb-8 max-w-lg leading-relaxed`}>
                  {HERO.description}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
                  <a
                    href={HERO.primaryCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] flex items-center justify-center gap-3"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    {HERO.primaryCta.label}
                  </a>
                  <a
                    href={HERO.secondaryCta.href}
                    className="w-full sm:w-auto border-2 border-stone-200 hover:border-stone-300 text-stone-600 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-300 px-8 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {HERO.secondaryCta.label}
                    <ChevronDownIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Faixa de números ─── */}
        <section className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-y dark:border-slate-800/50 py-10 md:py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {estatisticas.map((stat) => (
                <div key={stat.label} className="group">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1.5">
                    <CountUp end={stat.end} suffix={stat.suffix} />
                  </div>
                  <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Sobre / dupla identidade ─── */}
        <section id="sobre" className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p
                className={`text-sm font-semibold uppercase tracking-widest ${ACENTO} mb-3`}
              >
                {ABOUT.eyebrow}
              </p>
              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${TITULO} mb-5`}
              >
                {ABOUT.title.prefix}
                <span className="text-amber-500">{ABOUT.title.highlightAmber}</span>
                {ABOUT.title.connector}
                <span className="text-emerald-500">{ABOUT.title.highlightEmerald}</span>
              </h2>
              <p
                className={`text-lg ${TEXTO_SECUNDARIO} max-w-2xl mx-auto leading-relaxed`}
              >
                {ABOUT.lead}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {ABOUT.cards.map((card) => {
                const estilo = ESTILO_IDENTIDADE[card.id]
                const Icone = estilo.Icone
                return (
                  <div
                    key={card.id}
                    className={`group relative ${estilo.cartao} border rounded-3xl p-8 md:p-10 transition-all duration-500 hover:shadow-xl`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`w-14 h-14 ${estilo.fundoIcone} rounded-2xl flex items-center justify-center`}
                      >
                        <Icone className={`h-7 w-7 ${estilo.corIcone}`} />
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${estilo.etiqueta}`}
                      >
                        {card.badge}
                      </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${TITULO} mb-3`}>{card.title}</h3>
                    <p className={`${TEXTO_SECUNDARIO} leading-relaxed mb-6`}>
                      {card.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${estilo.etiqueta}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Serviços ─── */}
        <section
          id={SERVICES.id}
          className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-stone-100/50 dark:bg-slate-900/50"
        >
          <div className="max-w-6xl mx-auto">
            <ServicesTabs>
              <p
                className={`text-sm font-semibold uppercase tracking-widest ${ACENTO} mb-3`}
              >
                {SERVICES.eyebrow}
              </p>
              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${TITULO} mb-5`}
              >
                {SERVICES.title}
              </h2>
              <p className={`text-lg ${TEXTO_SECUNDARIO} max-w-2xl mx-auto mb-10`}>
                {SERVICES.subtitle}
              </p>
            </ServicesTabs>
          </div>
        </section>

        {/* ─── Chamada final ─── */}
        <section
          className={`bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-amber-500/10 dark:via-slate-900 dark:to-emerald-500/10 py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-y ${DIVISOR}`}
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <span className="text-5xl">{CTA.emoji}</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${TITULO} mb-6`}>
              {CTA.title.lineOne}
              <br />
              {CTA.title.lineTwo}
            </h2>
            <p
              className={`text-lg ${TEXTO_SECUNDARIO} mb-10 max-w-2xl mx-auto leading-relaxed`}
            >
              {CTA.description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={CTA.buttonHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02]"
              >
                <WhatsAppIcon className="h-6 w-6" />
                {CTA.buttonLabel}
              </a>
            </div>
          </div>
        </section>

        {/* ─── Contato e redes ─── */}
        <section
          id={CONTACT_SECTION.id}
          className="py-20 md:py-28 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-6xl mx-auto text-center">
            <p className={`text-sm font-semibold uppercase tracking-widest ${ACENTO} mb-3`}>
              {CONTACT_SECTION.eyebrow}
            </p>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${TITULO} mb-5`}>
              {CONTACT_SECTION.title}
            </h2>
            <p className={`text-lg ${TEXTO_SECUNDARIO} mb-12 max-w-2xl mx-auto`}>
              {CONTACT_SECTION.subtitle}
            </p>

            <div className="flex justify-center items-center gap-4 mb-16">
              {CONTACT_SECTION.socials.map((social) => {
                const icone = ICONE_SOCIAL[social.key]
                if (!icone) return null
                const { Icone, classe } = icone
                const externo = social.key !== 'email'
                const gradiente = `${social.gradient} ${GRADIENTE_SOCIAL_ESCURO[social.key] ?? ''}`
                return (
                  <a
                    key={social.key}
                    href={SOCIAL_LINKS[social.key]}
                    aria-label={social.label}
                    {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={`w-14 h-14 bg-gradient-to-br ${gradiente} rounded-2xl flex items-center justify-center text-white hover:scale-110 hover:rotate-3 transition-all duration-300 shadow-lg`}
                  >
                    <Icone className={classe} />
                  </a>
                )
              })}
            </div>

            <VideoTestimony />
          </div>
        </section>

        {/* ─── Rodapé ─── */}
        <footer className="bg-stone-900 dark:bg-slate-950 dark:border-t dark:border-slate-800/50 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start font-bold text-lg mb-2">
                  <div className="w-8 h-8 flex-shrink-0">
                    <Image
                      src={MEDIA.profileImageUrl}
                      alt={MEDIA_ALT.footerLogo}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700"
                    />
                  </div>
                  <span className="tracking-tight">
                    {FOOTER.logo.prefix}
                    <span className="text-amber-400">{FOOTER.logo.accent}</span>
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{FOOTER.tagline}</p>
              </div>
              <div className="text-slate-400 text-sm text-center md:text-right">
                <p>
                  {FOOTER.copyrightPrefix}
                  {anoAtual}
                  {FOOTER.copyrightSuffix}
                  <Link
                    href="/privacidade"
                    className="hover:text-amber-400 underline underline-offset-4"
                  >
                    {FOOTER.privacyLabel}
                  </Link>
                </p>
                <p className="mt-1 text-amber-400/60 italic">{FOOTER.creed}</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
