'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import {
  CLASSE_MOLDURA_GRAFICO,
  CorpoTooltip,
  EIXO_TEXTO,
  GRADE,
  LegendaSeries,
  formatarNumero,
  type ItemTooltip,
} from './chart-ui'

/**
 * Pageviews e visitantes por dia.
 *
 * 'use client' é obrigatório aqui: o Recharts 3.10 não marca os próprios
 * módulos, então importá-lo de um Server Component quebra o build.
 *
 * ESCOLHA DE COR — as duas séries usam --color-chart-1 (âmbar) e
 * --color-chart-3 (azul). Não é preferência: o par foi medido. Âmbar↔azul
 * separam por ΔE 38 na visão normal e 32,8 sob protanopia, com folga sobre o
 * mínimo de 8. O par vizinho na paleta, --color-chart-3 (#3b82f6) e
 * --color-chart-4 (#8b5cf6), fica em ΔE 1,3 sob deuteranopia e 12,0 na visão
 * normal: quem enxerga todas as cores já tem dificuldade, e quem tem
 * deuteranopia vê duas séries idênticas. Por isso nenhum gráfico deste painel
 * usa chart-3 e chart-4 juntos.
 */

const SERIES = [
  { chave: 'pageviews', nome: 'Pageviews', cor: 'var(--color-chart-1)' },
  { chave: 'visitantes', nome: 'Visitantes', cor: 'var(--color-chart-3)' },
] as const

export type PontoAreaVisitas = {
  dia: string
  rotulo: string
  pageviews: number
  visitantes: number
}

export function AreaVisitas({ dados }: { dados: PontoAreaVisitas[] }) {
  return (
    <div className={CLASSE_MOLDURA_GRAFICO}>
      <LegendaSeries series={SERIES.map((s) => ({ nome: s.nome, cor: s.cor }))} />

      {/* O SVG não é lido por leitor de tela; a descrição e a tabela de páginas
          logo abaixo é que carregam o conteúdo em texto. */}
      <div
        role="img"
        aria-label={`Pageviews e visitantes por dia, de ${dados.at(0)?.rotulo ?? ''} a ${dados.at(-1)?.rotulo ?? ''}`}
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
            <CartesianGrid {...GRADE} vertical={false} />

            <XAxis
              dataKey="rotulo"
              tick={EIXO_TEXTO}
              tickLine={false}
              axisLine={false}
              // Com 90 dias não cabe um rótulo por dia. minTickGap deixa o
              // Recharts descartar os do meio em vez de sobrepor texto.
              minTickGap={28}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={EIXO_TEXTO}
              tickLine={false}
              axisLine={false}
              width={48}
              allowDecimals={false}
              tickFormatter={(valor: number) => formatarNumero(valor)}
            />

            <Tooltip
              cursor={{ stroke: 'currentColor', strokeOpacity: 0.3, strokeWidth: 1 }}
              content={(props) => {
                if (!props.active || !props.payload?.length) return null

                const itens: ItemTooltip[] = props.payload.map((entrada, indice) => ({
                  chave: String(entrada.dataKey ?? indice),
                  nome: String(entrada.name ?? ''),
                  cor: String(entrada.color ?? 'currentColor'),
                  valor: formatarNumero(Number(entrada.value ?? 0)),
                }))

                return <CorpoTooltip titulo={String(props.label ?? '')} itens={itens} />
              }}
            />

            {SERIES.map((serie) => (
              <Area
                key={serie.chave}
                type="monotone"
                dataKey={serie.chave}
                name={serie.nome}
                stroke={serie.cor}
                strokeWidth={2}
                // Lavagem de ~10%: a área situa a linha sem virar um bloco
                // saturado que some com a série de trás.
                fill={serie.cor}
                fillOpacity={0.1}
                // Um ponto por dia em 90 dias vira ruído; só o ponto ativo
                // aparece, com anel na cor da superfície para não sumir onde
                // as duas séries se cruzam.
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--superficie)' }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
