'use client'

import { useEffect, useState } from 'react'

export function BotaoVoltarAoTopo() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const monitorarScroll = () => {
      if (window.scrollY > 300) {
        setVisivel(true)
      } else {
        setVisivel(false)
      }
    }

    window.addEventListener('scroll', monitorarScroll, { passive: true })
    return () => window.removeEventListener('scroll', monitorarScroll)
  }, [])

  const rolarParaOTopo = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <button
      type="button"
      onClick={rolarParaOTopo}
      aria-label="Voltar para o topo"
      className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-700 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-amber-500 hover:text-white hover:shadow-2xl hover:shadow-amber-500/30 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-amber-400 dark:hover:bg-amber-500 dark:hover:text-slate-950 ${
        visivel
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 scale-90 pointer-events-none'
      }`}
      title="Voltar para o topo"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  )
}
