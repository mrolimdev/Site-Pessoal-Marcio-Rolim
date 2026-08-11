import { z } from 'zod'

/**
 * Contrato entre o browser e /api/e.
 *
 * Este módulo é a fronteira de confiança: tudo que chega aqui foi digitado por
 * quem está do outro lado da rede. O servidor NUNCA usa um campo do cliente sem
 * passar por `eventoClienteSchema`, e os campos que dão poder de decisão —
 * país, browser, os, device, isBot, isInternal — não existem neste schema de
 * propósito: são derivados no servidor, a partir de headers, em `lib/analytics`.
 *
 * ATENÇÃO ao importar daqui em código de browser: use `import type`. Este
 * arquivo carrega o zod, e um import de valor arrastaria a biblioteca inteira
 * para o bundle do cliente. Por isso as constantes de runtime que o tracker
 * precisa moram em `./client`, e não aqui.
 */

/**
 * `KIND` e `LIMITE_CORPO_BYTES` moram em `./client`, não aqui: os dois lados
 * precisam deles, e um import de valor a partir deste arquivo levaria o zod
 * junto para o bundle do browser. As constantes abaixo só têm consumidor no
 * servidor, então podem ficar.
 */

/** Janela do amortecedor por IP. O teto duro é `analytics_ingest` (600/sessão). */
export const LIMITE_POR_IP = 60
export const JANELA_LIMITE_MS = 60_000

/**
 * Os limites de texto abaixo repetem, de propósito, os CHECKs de
 * `analytics_event`. Recusar no zod devolve 422 e diz o que houve; deixar
 * chegar no banco vira erro 500 dentro de `after()`, onde ninguém vê.
 */
export const eventoClienteSchema = z.object({
  kind: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  name: z.string().max(64).optional(),

  path: z.string().min(1).max(500),
  query: z.string().max(500).optional(),
  title: z.string().max(300).optional(),

  /** Referrer bruto. O servidor separa domínio e caminho e descarta auto-referência. */
  ref: z.string().max(1000).optional(),

  screen: z.string().max(24).optional(),
  viewport: z.string().max(24).optional(),
  language: z.string().max(35).optional(),

  /**
   * DELTA de tempo ativo desde o último envio, não o total: `analytics_ingest`
   * faz `active_ms = active_ms + durationMs`. Mandar o acumulado somaria a
   * mesma permanência várias vezes.
   */
  durationMs: z.number().int().min(0).max(86_400_000).optional(),

  /** Absoluto: o banco resolve com `greatest()`, então reenviar é idempotente. */
  scrollDepth: z.number().int().min(0).max(100).optional(),

  href: z.string().max(500).optional(),
  label: z.string().max(120).optional(),

  props: z
    .record(z.string(), z.unknown())
    .refine((v) => JSON.stringify(v).length <= 1024, {
      message: 'props excede o limite',
    })
    .optional(),
})

export type EventoCliente = z.infer<typeof eventoClienteSchema>

/**
 * O que o tracker monta. Igual ao validado, menos `kind`, que cada emissor
 * preenche — assim o componente não consegue esquecer de declarar o tipo.
 */
export type EntradaEvento = Omit<EventoCliente, 'kind'>
