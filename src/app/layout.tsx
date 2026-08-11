import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { Tracker } from '@/analytics/tracker'
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
  authors: [{ name: 'Marcio Rolim' }],
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        {/* O Tracker usa useSearchParams; sem <Suspense> a rota inteira cai
            para renderização no cliente e perde o pré-render. */}
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
      </body>
    </html>
  )
}
