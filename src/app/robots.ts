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
//
// A lista foi ampliada porque a original cobria só os agentes de 2023-2024. Os
// motores de resposta que hoje mandam tráfego — Perplexity, o modo de busca do
// ChatGPT, o Copilot — usam agentes que não estavam aqui, e um bot sem grupo
// próprio herda `*`, que já libera tudo. Ou seja: nomeá-los não muda a permissão,
// muda a INTENÇÃO ficar explícita e auditável. O dia em que se quiser barrar um
// deles, o grupo já existe e basta trocar uma linha.
//
// Distinção que importa e costuma ser confundida:
//   · treino          GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended
//   · busca/resposta  OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User
// Bloquear os de treino é uma escolha de licenciamento. Bloquear os de busca é
// desaparecer das respostas de IA — que é exatamente o oposto do objetivo aqui.
const CRAWLERS_DE_IA = [
  // Treino / coleta de corpus
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'Meta-ExternalAgent',
  'meta-externalagent',
  'cohere-ai',
  'Diffbot',
  'omgili',
  'Timpibot',
  // Busca e resposta em tempo real — estes são os que trazem citação e tráfego
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'YouBot',
  'Applebot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: CAMINHOS_BLOQUEADOS },
      ...CRAWLERS_DE_IA.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: CAMINHOS_BLOQUEADOS,
      })),
    ],
    sitemap: urlAbsoluta('/sitemap.xml'),
    host: urlAbsoluta('/'),
  }
}
