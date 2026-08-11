import type { MetadataRoute } from 'next'

import { urlAbsoluta } from '@/content/site'

// Portado do robots.txt que estava na RAIZ do repositório.
//
// Aquele arquivo nunca chegou a valer: o Vite só copia public/ para dist/, e o
// catch-all do vercel.json ("/((?!api/|curriculum).*)" -> /index.html) capturava
// /robots.txt. A URL respondia o HTML da home, com Content-Type text/html, e
// nenhum crawler leu uma linha destas regras. Como rota de metadata do App
// Router, o Next serve o mesmo conteúdo em text/plain.

// Decisão explícita do dono: o currículo fica fora dos buscadores. Esta é a
// metade do bloqueio que impede o RASTREAMENTO; a outra metade — o noindex que
// impede a INDEXAÇÃO — está em app/(site)/curriculum/page.tsx. As duas são
// necessárias e fazem coisas diferentes: uma página só em Disallow ainda pode
// ser indexada sem ser lida, se alguém a linkar de fora.
//
// É prefixo, não caminho exato: cobre /curriculum, /curriculum.html (que o
// next.config.ts redireciona para cá) e qualquer subcaminho futuro.
const CAMINHOS_BLOQUEADOS = ['/curriculum']

// Crawlers de IA já listados no robots.txt atual, preservados um a um.
//
// Cada um precisa do próprio grupo porque o robots.txt é resolvido pelo grupo
// MAIS específico e só por ele: um bot que encontra seu nome aqui ignora
// inteiramente o grupo `*`. Herdar as regras do `*` não é uma opção — omitir o
// grupo de um bot que já existe seria afrouxar a regra, não simplificá-la.
const CRAWLERS_DE_IA = [
  'GPTBot',
  'ChatGPT-User',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: CAMINHOS_BLOQUEADOS },
      ...CRAWLERS_DE_IA.map((userAgent) => ({
        userAgent,
        disallow: CAMINHOS_BLOQUEADOS,
      })),
    ],
    sitemap: urlAbsoluta('/sitemap.xml'),
  }
}
