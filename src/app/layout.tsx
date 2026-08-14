import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { Tracker } from '@/analytics/tracker'
import { ChatWidget } from '@/components/chat/chat-widget'
import { SITE, urlAbsoluta } from '@/content/site'
import { jsonLd, schemaSite } from '@/lib/seo/schema'
import './globals.css'

// next/font baixa e auto-hospeda a fonte em build time.
// Isso elimina a requisição a fonts.googleapis.com — que hoje vaza o IP
// de cada visitante para o Google e teria de ser declarada na política.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://marciorolim.com.br'),
  title: {
    default: 'Marcio Rolim | Especialista em IA & Automação de Processos',
    template: '%s | Marcio Rolim',
  },
  description:
    'Mais de 30 anos de experiência estratégica em tecnologia. Especialista em IA Generativa e Automação de Processos.',
  authors: [{ name: SITE.name, url: urlAbsoluta('/') }],
  creator: SITE.name,
  publisher: SITE.name,
  applicationName: SITE.siteName,
  // Canonical padrão: cada página sobrescreve com o seu. Sem isto, uma página
  // sem `alternates` não declara canonical nenhum e o buscador escolhe sozinho
  // — normalmente a versão com parâmetro de campanha na URL.
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': urlAbsoluta('/blog/rss.xml') },
  },
  // Sem isto, uma página sem `robots` própria não diz nada, e a diretiva mais
  // valiosa para AEO — deixar o buscador mostrar trecho longo e imagem grande —
  // fica de fora.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Marcio Rolim',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f4' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
}

// Roda antes do primeiro paint e antes da hidratação: sem FOUC e sem
// mismatch de hidratação por ler localStorage dentro de useState.
const themeScript = `
(function(){try{
  var t = localStorage.getItem('site-theme');
  if (t === 'dark') document.documentElement.classList.add('dark');
}catch(e){}})();
`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* WebSite + Person em todas as páginas: é o nó que os JSON-LD das
            páginas internas referenciam por `@id`. Sem ele no layout, cada
            página declararia a entidade do zero. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schemaSite()) }}
        />
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {children}
        {/* O Tracker usa useSearchParams; sem <Suspense> a rota inteira cai
            para renderização no cliente e perde o pré-render. */}
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      </body>
    </html>
  )
}
