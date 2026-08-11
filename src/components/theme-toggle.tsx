'use client'

import { useSyncExternalStore } from 'react'
import { MoonIcon, SunIcon } from '@/components/icons'

/**
 * Alterna a classe `dark` no <html> e persiste em localStorage['site-theme'],
 * a mesma chave usada pelo site Vite — quem já visitou mantém a preferência.
 *
 * A classe no <html> é a fonte da verdade, e quem a aplica antes do primeiro
 * paint é o script inline de app/layout.tsx. Aqui apenas a observamos com
 * useSyncExternalStore, que é a forma correta de ler estado que vive fora do
 * React: resolve a hidratação (o servidor usa getServerSnapshot) e dispensa
 * setState dentro de useEffect.
 */

function subscribe(aoMudar: () => void) {
  const observer = new MutationObserver(aoMudar)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function lerTemaAtual() {
  return document.documentElement.classList.contains('dark')
}

// O servidor não tem como saber a preferência: renderiza o estado claro e o
// cliente corrige na hidratação, sem piscar, porque o <html> já veio com a
// classe certa do script inline.
function lerTemaNoServidor() {
  return false
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, lerTemaAtual, lerTemaNoServidor)

  function alternar() {
    const proximo = !isDark
    document.documentElement.classList.toggle('dark', proximo)
    try {
      localStorage.setItem('site-theme', proximo ? 'dark' : 'light')
    } catch {
      // Modo privado / storage bloqueado: o tema vale só para esta navegação.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-600 shadow-xl backdrop-blur-xl transition-all hover:border-slate-400 hover:text-slate-900 dark:border-slate-700/50 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
    >
      {isDark ? (
        <SunIcon className="h-4 w-4 text-amber-400" />
      ) : (
        <MoonIcon className="h-4 w-4 text-indigo-500" />
      )}
    </button>
  )
}
