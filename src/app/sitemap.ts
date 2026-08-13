import type { MetadataRoute } from 'next'

import { urlAbsoluta } from '@/content/site'
import { listarPostsParaSitemap, listarTagsPublicadas } from '@/lib/blog/queries'

/**
 * Sitemap do site inteiro.
 *
 * ─── O que estava faltando ──────────────────────────────────────────────────
 * Este arquivo listava DUAS URLs: a home e a política de privacidade. Os 24
 * posts, as páginas de tag e a própria listagem do blog não estavam em lugar
 * nenhum — havia um comentário dizendo "quando existirem, esta função vira
 * async e concatena a lista". Eles passaram a existir e ninguém voltou aqui.
 *
 * Na prática: o Google só encontrava um post do blog se topasse com um link
 * para ele. Para um site novo, sem autoridade acumulada, isso é a diferença
 * entre ser rastreado em dias e ser rastreado em meses — ou nunca.
 *
 * ─── Decisões ───────────────────────────────────────────────────────────────
 * `lastModified` vem de `updated_at` do post, e não de `new Date()`. Com
 * `new Date()` todo deploy reivindicaria alteração em tudo, e o buscador
 * aprende a ignorar o campo do site inteiro — o dano é permanente e silencioso.
 *
 * `priority` é relativo DENTRO do site, não uma nota absoluta. Home 1.0, posts
 * 0.8 (é o conteúdo que se quer ranqueando), listagens 0.6, tags 0.4.
 */

// Datas fixas: só mudam quando o conteúdo destas páginas de fato muda.
const ATUALIZACAO_HOME = '2026-08-13'
const ATUALIZACAO_PRIVACIDADE = '2026-08-11'

/**
 * O sitemap é gerado no build e serviria uma foto congelada — um post publicado
 * depois não apareceria até o próximo deploy. Uma hora é o mesmo ritmo das
 * páginas do blog, e `revalidarBlog()` derruba este cache junto no momento em
 * que um post é publicado.
 */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags] = await Promise.all([listarPostsParaSitemap(), listarTagsPublicadas()])

  const postMaisRecente = posts[0]?.atualizadoEm ?? ATUALIZACAO_HOME

  return [
    {
      url: urlAbsoluta('/'),
      lastModified: ATUALIZACAO_HOME,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      // A listagem muda toda vez que um post entra, então acompanha o mais recente.
      url: urlAbsoluta('/blog'),
      lastModified: postMaisRecente,
      changeFrequency: 'daily',
      priority: 0.9,
    },

    // ── Posts ────────────────────────────────────────────────────────────────
    // `images` é extensão do sitemap que o Google lê: ajuda a capa a aparecer
    // no resultado e no Google Imagens, que é tráfego que o texto não traz.
    ...posts.map((post) => ({
      url: urlAbsoluta(`/blog/${post.slug}`),
      lastModified: post.atualizadoEm,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      ...(post.capaUrl && !post.capaUrl.startsWith('data:') ? { images: [post.capaUrl] } : {}),
    })),

    // ── Tags ─────────────────────────────────────────────────────────────────
    // Prioridade baixa de propósito: são páginas de agregação, úteis para
    // rastreamento e navegação, mas não são o conteúdo que se quer ranqueando.
    ...tags.map((tag) => ({
      url: urlAbsoluta(`/blog/tag/${encodeURIComponent(tag)}`),
      lastModified: postMaisRecente,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),

    {
      url: urlAbsoluta('/privacidade'),
      lastModified: ATUALIZACAO_PRIVACIDADE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },

    // /curriculum NÃO entra: é noindex por decisão do dono
    // (app/(site)/curriculum/page.tsx) e está em Disallow no robots.ts.
  ]
}
