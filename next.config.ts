import type { NextConfig } from 'next'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const config: NextConfig = {
  // Fixa a raiz: sem isso o Turbopack sobe a árvore procurando lockfile
  // e escolhe um diretório de fora do projeto.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  // cacheComponents fica DESLIGADO na v1. Ligar quebra `export const dynamic|revalidate`,
  // e transforma Date.now()/Math.random() durante prerender em erro de build.
  images: {
    remotePatterns: [
      // Foto de perfil e mídia hospedadas hoje fora do repositório.
      { protocol: 'https', hostname: 'files.restaure.online', pathname: '/**' },
      // Bucket público de imagens do blog (Supabase Storage).
      {
        protocol: 'https',
        hostname: 'aknegwrfbgaavdsylhiw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      // Vinham do vercel.json
      { source: '/sobre', destination: '/', permanent: true },
      { source: '/login', destination: '/', permanent: true },
      // URLs .html do site Vite que já circulam por aí
      { source: '/privacy.html', destination: '/privacidade', permanent: true },
      { source: '/privacy', destination: '/privacidade', permanent: true },
      { source: '/curriculum.html', destination: '/curriculum', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default config
