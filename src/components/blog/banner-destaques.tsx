'use client'

import { useEffect, useRef, useState } from 'react'

import { PostCardDestaque } from '@/components/blog/post-card'
import { ChevronRightIcon } from '@/components/icons'
import type { PostResumo } from '@/lib/blog/queries'

/**
 * Banner de destaques em slide, uma coluna de largura total.
 *
 * Todos os slides ficam lado a lado numa trilha que anda por `translateX`, e
 * não um por vez com `display: none`. A troca precisa ser um deslize, e só dá
 * para deslizar de um quadro para o outro se os dois estiverem na tela ao mesmo
 * tempo. Como os slides dividem a mesma linha de flex, a altura da trilha é a
 * do slide mais alto e a troca não sacode o resto da página.
 *
 * Slide fora de foco sai da árvore de acessibilidade com `aria-hidden` +
 * `inert`: sem isso o Tab entraria em cartões invisíveis, fora da tela.
 */

/** Quanto cada destaque fica na tela, em ms. */
const INTERVALO = 6500

export type Destaque = { post: PostResumo; rotulo: string }

export function BannerDestaques({
  destaques,
  descricao,
}: {
  /** Estável entre renders (`useMemo` no pai): o slide volta ao início quando muda. */
  destaques: Destaque[]
  descricao: string
}) {
  const [indice, setIndice] = useState(0)
  const [listaVista, setListaVista] = useState(destaques)
  /** Mouse em cima ou foco dentro: alguém está lendo, o slide espera. */
  const pausado = useRef(false)
  /** Onde o dedo encostou, para medir o deslize no solte. */
  const toque = useRef({ x: 0, y: 0 })

  // Trocar de aba ou filtrar troca a lista, e o slide tem de voltar ao começo —
  // senão a pessoa cai no terceiro destaque de um conjunto que acabou de mudar.
  // Ajuste durante a renderização, e não num efeito: assim o React já
  // re-renderiza com o índice certo, sem passar um quadro pela tela errada.
  if (listaVista !== destaques) {
    setListaVista(destaques)
    setIndice(0)
  }

  const total = destaques.length
  // Módulo em vez de `clamp`: as setas somam e subtraem sem limite, para o
  // slide dar a volta nas duas direções.
  const atual = total > 0 ? ((indice % total) + total) % total : 0

  useEffect(() => {
    if (total < 2) return
    // Só o avanço automático é cortado aqui. O deslize em si já vira instantâneo
    // pela regra global de `prefers-reduced-motion` no globals.css.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const relogio = setInterval(() => {
      if (pausado.current) return
      setIndice((i) => i + 1)
    }, INTERVALO)

    return () => clearInterval(relogio)
  }, [total])

  if (total === 0) return null

  const irPara = (destino: number) => setIndice(destino)
  const andar = (passo: number) => setIndice((i) => i + passo)

  // Deslizar com o dedo. A trilha anda por `translateX`, não por rolagem, então
  // o gesto que qualquer pessoa tenta primeiro num banner assim não existiria
  // de graça — sem isto, no celular o banner parece travado.
  //
  // A origem do gesto vive num ref, e não numa variável do corpo: o giro
  // automático pode disparar entre o toque e o solte, e uma variável comum
  // nasceria zerada no render seguinte, dando um deslize gigante e falso.
  const aoTocar = (e: React.TouchEvent) => {
    toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    pausado.current = true
  }

  const aoSoltarToque = (e: React.TouchEvent) => {
    pausado.current = false
    const dx = e.changedTouches[0].clientX - toque.current.x
    const dy = e.changedTouches[0].clientY - toque.current.y

    // Só conta como deslize horizontal se andou o bastante e mais na horizontal
    // que na vertical — senão rolar a página trocaria o slide sem querer.
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return
    andar(dx < 0 ? 1 : -1)
  }

  return (
    <section className="animate-fade-in flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Em destaque
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{descricao}</p>
        </div>

        {total > 1 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {destaques.map((d, i) => (
                <button
                  key={d.post.slug}
                  type="button"
                  onClick={() => irPara(i)}
                  aria-label={`Ir para o destaque ${i + 1} de ${total}`}
                  aria-current={i === atual}
                  className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none ${
                    i === atual
                      ? 'w-6 bg-amber-500 dark:bg-amber-400'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => andar(-1)}
                aria-label="Destaque anterior"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 sm:h-9 sm:w-9 transition-colors hover:border-amber-500/50 hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-400/50 dark:hover:text-amber-400"
              >
                <ChevronRightIcon className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => andar(1)}
                aria-label="Próximo destaque"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 sm:h-9 sm:w-9 transition-colors hover:border-amber-500/50 hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-400/50 dark:hover:text-amber-400"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <div
        onPointerEnter={() => {
          pausado.current = true
        }}
        onPointerLeave={() => {
          pausado.current = false
        }}
        onFocusCapture={() => {
          pausado.current = true
        }}
        onBlurCapture={() => {
          pausado.current = false
        }}
        onTouchStart={aoTocar}
        onTouchEnd={aoSoltarToque}
        // A trilha tem 400% da largura e *precisa* de contenção de verdade:
        // `clip-path` só corta a pintura, o layout continua largo e a página
        // inteira ganha barra de rolagem horizontal.
        //
        // `overflow-hidden` contém, mas corta nos dois eixos, e comeria o
        // cartão quando ele sobe no hover. O `py-6` afasta a borda de corte do
        // conteúdo — a subida e a sombra cabem nesses 24px — e o `-my-6`
        // devolve o espaço, para o respiro da seção ficar como desenhado.
        className="-my-6 overflow-hidden py-6"
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${atual * 100}%)` }}
        >
          {destaques.map((d, i) => (
            <div
              key={d.post.slug}
              className="w-full shrink-0"
              aria-hidden={i !== atual || undefined}
              inert={i !== atual}
            >
              <PostCardDestaque post={d.post} rotulo={d.rotulo} className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
