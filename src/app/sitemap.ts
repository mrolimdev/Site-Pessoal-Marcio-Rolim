import type { MetadataRoute } from 'next'

import { urlAbsoluta } from '@/content/site'

// Portado do sitemap.xml que estava na RAIZ do repositório — e que, como o
// robots.txt, era engolido pelo catch-all do vercel.json e respondia HTML.

// `lastmod` só serve ao buscador enquanto for verdade. Por isso são datas
// fixas, e não `new Date()`: com `new Date()` todo deploy reivindicaria uma
// alteração que não houve, e o Google aprende a ignorar o campo do site
// inteiro. Atualize a data da rota quando o CONTEÚDO dela mudar de fato.
const ATUALIZACAO_HOME = '2026-08-11'
const ATUALIZACAO_PRIVACIDADE = '2026-08-11'

// /curriculum NÃO entra aqui, de propósito: é noindex por decisão do dono
// (app/(site)/curriculum/page.tsx) e está em Disallow no robots.ts. Listar no
// sitemap uma URL que se pede para não indexar é um sinal contraditório, e o
// Search Console reporta como erro.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: urlAbsoluta('/'),
      lastModified: ATUALIZACAO_HOME,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: urlAbsoluta('/privacidade'),
      lastModified: ATUALIZACAO_PRIVACIDADE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },

    // ── Posts do blog entram aqui ────────────────────────────────────
    // Quando existirem, esta função vira `async` e concatena a lista:
    //
    //   const posts = await listarPostsPublicados()
    //   ...posts.map((post) => ({
    //     url: urlAbsoluta(`/blog/${post.slug}`),
    //     lastModified: post.atualizadoEm,
    //     changeFrequency: 'weekly' as const,
    //     priority: 0.7,
    //   })),
    //
    // Dois cuidados no dia que isso acontecer:
    //  1. sitemap.ts é um Route Handler cacheado por padrão. Buscando os posts
    //     no Supabase, ele é gerado UMA vez no build e congela — declare
    //     `export const revalidate = <segundos>` para que posts novos apareçam.
    //  2. `changeFrequency` precisa do `as const` dentro do map, senão o TS
    //     infere `string` e não casa com a união do tipo Sitemap.
  ]
}
