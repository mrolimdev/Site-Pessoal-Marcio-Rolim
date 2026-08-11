'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Contador que anima de 0 até `end` quando entra na viewport.
 * Porte de components/CountUp.tsx (projeto legado Vite) — mesma curva de
 * easing (easeOutQuart), mesma duração padrão e mesmo threshold do observer.
 *
 * Ilha de cliente por três motivos que não têm equivalente no servidor:
 * IntersectionObserver, requestAnimationFrame e estado.
 *
 * Diferença deliberada em relação ao original: o requestAnimationFrame agora é
 * cancelado no cleanup. Sem isso, desmontar no meio da animação deixava um
 * setState pendente para um componente que já saiu da árvore.
 */

type CountUpProps = {
  end: number
  duration?: number
  suffix?: string
  className?: string
}

export function CountUp({
  end,
  duration = 2000,
  suffix = '',
  className = '',
}: CountUpProps) {
  const [valor, setValor] = useState(0)
  const [visivel, setVisivel] = useState(false)
  const referencia = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const alvo = referencia.current
    if (!alvo) return

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(alvo)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visivel) return

    let quadro = 0
    let inicio: number | null = null

    const passo = (agora: number) => {
      if (inicio === null) inicio = agora
      const progresso = Math.min((agora - inicio) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progresso, 4)

      setValor(Math.floor(easeOutQuart * end))

      if (progresso < 1) quadro = window.requestAnimationFrame(passo)
    }

    quadro = window.requestAnimationFrame(passo)
    return () => window.cancelAnimationFrame(quadro)
  }, [end, duration, visivel])

  return (
    <span ref={referencia} className={className}>
      {valor}
      {suffix}
    </span>
  )
}
