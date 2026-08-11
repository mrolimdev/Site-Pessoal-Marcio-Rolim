'use client'

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import {
  CLASSE_MOLDURA_GRAFICO,
  CorpoTooltip,
  EIXO_TEXTO,
  formatarNumero,
  type ItemTooltip,
} from './chart-ui'

/**
 * Barras horizontais para categorias nomeadas: top de páginas e de origens, e
 * também dispositivo, navegador e país.
 *
 * 'use client' obrigatório — o Recharts 3.10 não publica a diretiva.
 *
 * POR QUE HORIZONTAL EM TODOS OS CINCO. O rótulo aqui é texto de tamanho
 * imprevisível ('/blog/como-automatizar-processos', 'Mobile Safari'). Em
 * colunas verticais esse texto vira legenda inclinada ou truncada, e com oito
 * categorias num cartão de 300px os rótulos colidem. Deitado, cada rótulo tem
 * uma linha inteira e a barra continua sendo lida pelo comprimento.
 *
 * UMA SÉRIE, UMA COR. A cor não codifica nada nestes gráficos — o comprimento
 * já diz tudo. Pintar cada barra de um tom diferente duplicaria o valor no
 * canal de cor e daria a impressão de categorias com significados distintos.
 * A variante existe só para separar duas famílias de pergunta: volume de
 * tráfego (âmbar) e composição da audiência (azul).
 */

const CORES = {
  trafego: 'var(--color-chart-1)',
  audiencia: 'var(--color-chart-3)',
} as const

export type PontoBarra = {
  rotulo: string
  rotuloCompleto: string
  valor: number
}

type Props = {
  dados: PontoBarra[]
  /** Nome da métrica no tooltip e no rótulo acessível. Ex.: 'pageviews'. */
  unidade: string
  variante?: keyof typeof CORES
  /** Descrição do gráfico para leitor de tela. */
  descricao: string
  /** Largura reservada aos rótulos do eixo. */
  larguraRotulo?: number
}

const ALTURA_LINHA = 32

export function BarrasHorizontais({
  dados,
  unidade,
  variante = 'trafego',
  descricao,
  larguraRotulo = 150,
}: Props) {
  const cor = CORES[variante]

  // O valor já formatado vai no próprio dado. Passar um `formatter` para o
  // LabelList amarraria o componente à assinatura do Recharts, que muda entre
  // versões; um campo de texto simples não muda.
  const pontos = dados.map((ponto) => ({
    ...ponto,
    rotuloValor: formatarNumero(ponto.valor),
  }))

  // A altura acompanha a quantidade de barras. Um height fixo espremeria dez
  // categorias no mesmo espaço de três e criaria scroll dentro do cartão.
  const altura = Math.max(dados.length * ALTURA_LINHA + 16, 120)

  return (
    <div className={CLASSE_MOLDURA_GRAFICO} role="img" aria-label={descricao}>
      <ResponsiveContainer width="100%" height={altura}>
        <BarChart
          data={pontos}
          layout="vertical"
          // A folga à direita é o espaço do rótulo de valor na ponta da barra.
          // Sem ela o número seria cortado pela borda do SVG.
          margin={{ top: 4, right: 56, bottom: 4, left: 0 }}
          accessibilityLayer
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="rotulo"
            width={larguraRotulo}
            tick={EIXO_TEXTO}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            // Em barras não há crosshair: a marca é o alvo. O realce da faixa
            // dá o retorno visual de que o ponteiro acertou.
            cursor={{ fill: 'currentColor', fillOpacity: 0.06 }}
            content={(props) => {
              if (!props.active || !props.payload?.length) return null

              const entrada = props.payload[0]
              const ponto = entrada.payload as PontoBarra | undefined

              const itens: ItemTooltip[] = [
                {
                  chave: 'valor',
                  nome: unidade,
                  cor,
                  valor: formatarNumero(Number(entrada.value ?? 0)),
                },
              ]

              // O tooltip mostra o rótulo inteiro; o eixo mostra a versão curta.
              return <CorpoTooltip titulo={ponto?.rotuloCompleto ?? ''} itens={itens} />
            }}
          />

          <Bar
            dataKey="valor"
            fill={cor}
            // Ponta arredondada no fim do dado, quina viva na linha de base.
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          >
            {/* O valor fica visível sem hover: o tooltip complementa, nunca é o
                único caminho até o número. */}
            <LabelList
              dataKey="rotuloValor"
              position="right"
              fill="currentColor"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
