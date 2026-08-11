'use client'

import { useEffect, useRef } from 'react'

import { PostCard } from '@/components/blog/post-card'
import { ChevronRightIcon } from '@/components/icons'
import type { PostResumo } from '@/lib/blog/queries'

/**
 * Esteira infinita dos últimos posts.
 *
 * ─── Por que scroll nativo e não `animation: translateX` ────────────────────
 *
 * A esteira anda empurrando `scrollLeft` quadro a quadro, num contêiner com
 * `overflow-x: auto`. Uma animação CSS no `transform` seria mais suave, mas
 * roda por cima do scroll do usuário: arrastar, girar a roda do mouse e o
 * embalo do toque no celular deixariam de funcionar, e cada um teria de ser
 * reimplementado em JS. Com scroll nativo tudo isso vem de graça e o laço fica
 * sendo a única coisa a resolver.
 *
 * ─── Como o laço se fecha ───────────────────────────────────────────────────
 *
 * A lista é renderizada duas vezes. Quando o scroll passa da metade, ele volta
 * meia largura — como as duas metades são idênticas, o salto é invisível. A
 * cópia sai da árvore de acessibilidade e da ordem de tabulação com
 * `aria-hidden` + `inert`, senão leitor de tela e teclado veriam cada post
 * duas vezes.
 *
 * Andar para trás (arrasto, roda, seta) esbarraria no zero, onde o navegador
 * trava o scroll e o laço quebraria. Por isso o salto para trás é resolvido
 * dentro de cada gesto, e não no quadro: só quem sabe que o movimento é
 * negativo consegue somar meia largura *antes* de o navegador travar.
 */

/** Pixels por segundo. Devagar o bastante para dar tempo de ler o título. */
const VELOCIDADE = 40

/** Quanto tempo a esteira espera depois de um clique nas setas, em ms. */
const PAUSA_APOS_SETA = 900

/**
 * Abaixo disso as duas cópias não enchem a largura da tela e apareceria um
 * buraco no meio da esteira. Com tão poucos posts, uma grade resolve melhor.
 */
const MINIMO_PARA_ESTEIRA = 4

export function CarrosselPosts({
  posts,
  titulo,
  descricao,
}: {
  /**
   * Precisa ser estável entre renders (`useMemo` no pai): a esteira volta ao
   * começo sempre que esta lista muda de identidade.
   */
  posts: PostResumo[]
  titulo: string
  descricao: string
}) {
  const pista = useRef<HTMLDivElement>(null)
  /** Mouse em cima ou foco dentro: alguém está lendo, a esteira espera. */
  const pausado = useRef(false)
  /** Pausa por tempo, usada depois das setas. Guarda um `performance.now()`. */
  const pausaAte = useRef(0)
  const arrasto = useRef({ ativo: false, xInicial: 0, scrollInicial: 0, moveu: false })

  const temEsteira = posts.length >= MINIMO_PARA_ESTEIRA

  useEffect(() => {
    const el = pista.current
    if (!el || !temEsteira) return

    el.scrollLeft = 0

    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)')

    let quadro = 0
    let instanteAnterior = 0
    // `scrollLeft` inteiro em boa parte dos navegadores: o resto fracionário
    // fica aqui entre um quadro e outro, senão a 40px/s nada andaria.
    let resto = 0

    const passo = (agora: number) => {
      quadro = requestAnimationFrame(passo)

      // Primeiro quadro não tem intervalo; aba em segundo plano volta com um
      // intervalo enorme, que daria um salto feio.
      const intervalo = instanteAnterior === 0 ? 0 : Math.min(agora - instanteAnterior, 100)
      instanteAnterior = agora

      const metade = el.scrollWidth / 2
      if (metade > 0 && el.scrollLeft >= metade) {
        el.scrollLeft -= metade
      }

      if (reduzirMovimento.matches || pausado.current || agora < pausaAte.current) {
        resto = 0
        return
      }

      resto += (VELOCIDADE * intervalo) / 1000
      const avanco = Math.floor(resto)
      if (avanco >= 1) {
        el.scrollLeft += avanco
        resto -= avanco
      }
    }

    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [temEsteira, posts])

  const deslizar = (direcao: 1 | -1) => {
    const el = pista.current
    if (!el) return

    const salto = el.clientWidth * 0.8
    pausaAte.current = performance.now() + PAUSA_APOS_SETA

    // Indo para trás perto do zero, adianta meia largura antes: sem isso o
    // navegador trava em zero e a seta esquerda não faz nada.
    const metade = el.scrollWidth / 2
    if (direcao < 0 && metade > 0 && el.scrollLeft < salto) {
      el.scrollLeft += metade
    }

    el.scrollBy({ left: direcao * salto, behavior: 'smooth' })
  }

  // Roda do mouse / trackpad na horizontal esbarra no zero pelo mesmo motivo.
  const aoGirarRoda = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = pista.current
    if (!el) return

    const deslocamento = e.deltaX !== 0 ? e.deltaX : e.shiftKey ? e.deltaY : 0
    const metade = el.scrollWidth / 2
    if (deslocamento < 0 && metade > 0 && el.scrollLeft < Math.abs(deslocamento) + 1) {
      el.scrollLeft += metade
    }
  }

  const aoPressionar = (e: React.PointerEvent<HTMLDivElement>) => {
    // Toque já rola sozinho, com embalo. Interceptar só pioraria.
    if (e.pointerType === 'touch') return
    const el = pista.current
    if (!el) return

    arrasto.current = {
      ativo: true,
      xInicial: e.clientX,
      scrollInicial: el.scrollLeft,
      moveu: false,
    }
    pausado.current = true
    el.setPointerCapture(e.pointerId)
    el.classList.add('select-none')
  }

  const aoMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrasto.current.ativo) return
    const el = pista.current
    if (!el) return

    const percorrido = e.clientX - arrasto.current.xInicial
    if (Math.abs(percorrido) > 4) arrasto.current.moveu = true

    let alvo = arrasto.current.scrollInicial - percorrido
    const metade = el.scrollWidth / 2
    while (alvo < 0 && metade > 0) {
      // Move a referência junto, senão o resto do arrasto puxaria de volta.
      alvo += metade
      arrasto.current.scrollInicial += metade
    }

    el.scrollLeft = alvo
  }

  const aoSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrasto.current.ativo) return
    const el = pista.current
    arrasto.current.ativo = false
    pausado.current = false
    el?.classList.remove('select-none')
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
  }

  // Arrastar por cima de um cartão terminaria em navegação: o <a> do título
  // cobre o cartão inteiro. Se o ponteiro andou, o clique não vale.
  const aoClicar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!arrasto.current.moveu) return
    arrasto.current.moveu = false
    e.preventDefault()
    e.stopPropagation()
  }

  if (posts.length === 0) return null

  const cartoes = (chave: string, duplicata: boolean) =>
    posts.map((post) => (
      <li
        key={`${chave}-${post.slug}`}
        className="w-[17rem] shrink-0 sm:w-[18.5rem]"
        // A segunda volta é só pixel: fora da árvore de acessibilidade e fora
        // da ordem de tabulação, senão cada post apareceria duas vezes.
        aria-hidden={duplicata || undefined}
        inert={duplicata}
      >
        <PostCard post={post} className="h-full" />
      </li>
    ))

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {titulo}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {posts.length}
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{descricao}</p>
        </div>

        {temEsteira && (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => deslizar(-1)}
              aria-label="Ver posts anteriores"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-amber-500/50 hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-400/50 dark:hover:text-amber-400"
            >
              <ChevronRightIcon className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => deslizar(1)}
              aria-label="Ver próximos posts"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-amber-500/50 hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-400/50 dark:hover:text-amber-400"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      {temEsteira ? (
        <div
          ref={pista}
          role="region"
          aria-label={`${titulo} — role para o lado para ver mais`}
          tabIndex={0}
          onPointerEnter={() => {
            pausado.current = true
          }}
          onPointerLeave={() => {
            pausado.current = arrasto.current.ativo
          }}
          onFocusCapture={() => {
            pausado.current = true
          }}
          onBlurCapture={() => {
            pausado.current = false
          }}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onWheel={aoGirarRoda}
          onClickCapture={aoClicar}
          // `overflow-x` liga o eixo vertical junto; `overflow-y-hidden` mata a
          // barra que apareceria, e o `py-4` dá o espaço que o cartão precisa
          // para subir no hover sem ser cortado.
          //
          // A máscara desbota as pontas em vez de cortá-las na régua. Vai em
          // propriedade arbitrária, e não numa cor de fundo por cima, para não
          // ficar amarrada ao fundo da página em cada tema.
          className="cursor-grab overflow-x-auto overflow-y-hidden py-4 [mask-image:linear-gradient(to_right,transparent,#000_2rem,#000_calc(100%-2rem),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_2rem,#000_calc(100%-2rem),transparent)] scrollbar-hide focus-visible:outline-none active:cursor-grabbing"
        >
          <ul className="flex w-max items-stretch gap-6 px-1">
            {cartoes('a', false)}
            {/* Segunda volta: só pixels. Não existe para leitor de tela nem
                para o Tab, senão cada post apareceria duas vezes. */}
            {cartoes('b', true)}
          </ul>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} prioridade={i === 0} />
          ))}
        </div>
      )}
    </section>
  )
}
