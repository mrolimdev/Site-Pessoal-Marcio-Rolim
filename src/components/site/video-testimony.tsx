'use client'

import { useEffect, useState } from 'react'

import { ChevronRightIcon, CloseIcon, PlayIcon } from '@/components/icons'
import { CONTACT_SECTION } from '@/content/home'
import { MEDIA } from '@/content/site'

/**
 * Card do vídeo-testemunho e o modal que ele abre.
 * Origem: App.tsx:620-646 (card) e App.tsx:675-696 (modal).
 *
 * O card virou <button>: no original era uma <div onClick>, sem foco de teclado
 * e sem papel semântico. As classes de aparência são as mesmas; `w-full` e
 * `text-left` só repõem o que a <div> já fazia por ser bloco.
 *
 * O modal continua sendo irmão do card, sem portal: é `fixed inset-0 z-50` e
 * nenhum ancestral cria contexto de empilhamento (nada com transform, filter ou
 * backdrop-filter no caminho até o <body>).
 */

const CARTAO_AMBAR =
  'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 hover:border-amber-300 dark:from-amber-500/5 dark:to-orange-500/5 dark:border-amber-500/10 dark:hover:border-amber-500/30'

export function VideoTestimony() {
  const [aberto, setAberto] = useState(false)

  // Esc fecha o modal — o original só fechava por clique no fundo ou no X.
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  return (
    <>
      <div className="max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className={`group ${CARTAO_AMBAR} w-full border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <PlayIcon className="h-6 w-6 text-white ml-0.5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="text-base font-bold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {CONTACT_SECTION.video.title}
              </h3>
              <p className="text-stone-400 dark:text-slate-500 text-sm">
                {CONTACT_SECTION.video.subtitle}
              </p>
            </div>
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/60 dark:bg-slate-800 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-500/10 transition-colors">
              <ChevronRightIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      {aberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={CONTACT_SECTION.video.title}
          onClick={() => setAberto(false)}
          /* z-[120]: acima do chat (fundo 95, gatilho 100, painel 110). Enquanto
             o vídeo toca, ele é o modal — antes o botão do chat flutuava por
             cima dele, decidido só pela ordem no DOM. */
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
        >
          <div
            onClick={(evento) => evento.stopPropagation()}
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label={CONTACT_SECTION.video.closeLabel}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
            {/* Sem <track>: não existe faixa de legenda para este arquivo hoje. */}
            <video
              src={MEDIA.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              {CONTACT_SECTION.video.fallbackText}
            </video>
          </div>
        </div>
      )}
    </>
  )
}
