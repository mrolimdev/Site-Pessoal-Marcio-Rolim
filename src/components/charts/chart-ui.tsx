'use client'

/**
 * Peças compartilhadas pelos wrappers de gráfico.
 *
 * Este arquivo — como todo o resto de components/charts — carrega `'use client'`
 * no topo. O Recharts 3.10 NÃO publica a diretiva nos seus próprios módulos, e
 * ele usa hooks e Context. Importado direto num Server Component, o build quebra
 * no primeiro `useState` do pacote. A diretiva precisa estar em CADA arquivo que
 * importa Recharts: ela marca a fronteira do bundle, e não é herdada por import.
 *
 * Nenhum componente daqui recebe objeto do banco. A página monta o DTO no
 * servidor e passa números e strings já formatados.
 */

const formatador = new Intl.NumberFormat('pt-BR')

export function formatarNumero(valor: number): string {
  return formatador.format(valor)
}

/**
 * Superfície do cartão, exposta como custom property para o SVG usar.
 *
 * O anel de 2px que separa marcas sobrepostas (e a folga entre barras) é feito
 * com a COR DO FUNDO, não com uma borda. Como o fundo do cartão muda no tema
 * escuro, o valor precisa acompanhar — daí a variável, e não um branco fixo que
 * viraria um halo claro no escuro.
 *
 * `text-slate-500` alimenta o `currentColor` que eixos, grade e rótulos usam:
 * texto e grade herdam o token de texto, nunca a cor da série.
 */
export const CLASSE_MOLDURA_GRAFICO =
  '[--superficie:#ffffff] text-slate-500 dark:[--superficie:#0f172a] dark:text-slate-400'

/** Grade e eixos: hairline sólida, um passo fora da superfície, recessiva. */
export const GRADE = {
  stroke: 'currentColor',
  strokeOpacity: 0.16,
} as const

export const EIXO_TEXTO = { fill: 'currentColor', fontSize: 12 } as const

export type ItemTooltip = {
  chave: string
  nome: string
  cor: string
  valor: string
}

/**
 * Corpo do tooltip. O valor lidera e o nome da série vem depois: quem já está
 * com o ponteiro sobre a marca sabe qual série é e quer o número. A identidade
 * fica num traço curto da cor da série ao lado — o texto nunca veste a cor do
 * dado, porque amarelo sobre branco não se lê.
 */
export function CorpoTooltip({ titulo, itens }: { titulo: string; itens: ItemTooltip[] }) {
  return (
    <div className="pointer-events-none rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
      <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{titulo}</p>
      <ul className="flex flex-col gap-1">
        {itens.map((item) => (
          <li key={item.chave} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.cor }}
            />
            <span className="text-sm font-semibold text-slate-900 tabular-nums dark:text-white">
              {item.valor}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.nome}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Legenda em HTML, fora do SVG: fica estilizável pelo Tailwind, acompanha o
 * tema e é lida por leitor de tela como texto normal. Só aparece a partir de
 * duas séries — com uma série só, o título do cartão já diz o que está plotado
 * e um quadradinho isolado apenas repetiria o título.
 */
export function LegendaSeries({ series }: { series: { nome: string; cor: string }[] }) {
  if (series.length < 2) return null

  return (
    <ul className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((serie) => (
        <li key={serie.nome} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: serie.cor }}
          />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {serie.nome}
          </span>
        </li>
      ))}
    </ul>
  )
}
