import type { NextConfig } from 'next'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const config: NextConfig = {
  // Fixa a raiz: sem isso o Turbopack sobe a árvore procurando lockfile
  // e escolhe um diretório de fora do projeto.
  // Limite de payload para Server Actions (ex: formulários de posts com imagens)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      // Foto de perfil e mídia hospedadas no servidor próprio ou restaure.online
      { protocol: 'https', hostname: 'files.restaure.online', pathname: '/**' },
      { protocol: 'https', hostname: '*.restaure.online', pathname: '/**' },
      // Bucket público de imagens do blog (Supabase Storage) - todos os projetos
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Fotos do Unsplash usadas nas capas de blog
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Fotos do Pexels
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
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

          // ── Clickjacking ────────────────────────────────────────────────
          // O painel tem ações destrutivas de um clique (publicar, excluir).
          // Sem isto, qualquer site embute /admin num iframe transparente e
          // engana o admin logado para clicar onde ele não vê.
          //
          // Os dois headers de propósito: `frame-ancestors` é o mecanismo atual
          // e o único que o Safari respeita em alguns cenários de iframe
          // aninhado; `X-Frame-Options` cobre navegador antigo que ignora CSP.
          // Se um dia o site precisar ser incorporado em algum lugar, é aqui
          // que se troca 'none' pela origem permitida.
          { key: 'X-Frame-Options', value: 'DENY' },

          // ── HSTS ────────────────────────────────────────────────────────
          // Depois da primeira visita, o navegador se recusa a falar HTTP com
          // este domínio — fecha a janela em que um downgrade rouba o cookie
          // de sessão. `preload` só vale se o domínio for submetido em
          // hstspreload.org; sem isso é inofensivo.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },

          // ── CSP parcial, e o "parcial" é intencional ────────────────────
          // NÃO há `script-src` aqui. Uma CSP de script exigiria nonce por
          // requisição, e o nonce não sobrevive em página estática — o blog é
          // quase todo pré-renderizado (`force-static` + SSG), então a diretiva
          // apagaria os próprios scripts do site. As diretivas abaixo não têm
          // esse problema e fecham vetores reais:
          //   base-uri    impede <base href> injetado reescrever todo link relativo
          //   object-src  mata <object>/<embed>, que escapam do sanitizador
          //   form-action impede um formulário injetado postar para fora
          {
            key: 'Content-Security-Policy',
            value: [
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default config
