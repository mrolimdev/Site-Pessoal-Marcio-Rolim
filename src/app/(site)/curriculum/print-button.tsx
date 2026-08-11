'use client'

import { PrinterIcon } from '@/components/icons'

/**
 * Única razão para esta ilha existir: window.print().
 * O resto da página de currículo é Server Component.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2.5 font-medium text-slate-900 shadow-xl backdrop-blur-xl transition-all hover:bg-amber-400"
      data-track="cv_print"
    >
      <PrinterIcon className="h-4 w-4" />
      <span className="text-sm">Imprimir CV</span>
    </button>
  )
}
