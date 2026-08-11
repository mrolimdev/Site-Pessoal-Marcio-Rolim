import Link from 'next/link'

import { ArrowLeftIcon, SparklesIcon, WhatsAppIcon } from '@/components/icons'
import { CONTACT } from '@/content/site'

/**
 * Estado vazio.
 *
 * Aparece em três situações reais: blog recém-publicado sem nenhum post, tag
 * sem resultado e página fora do intervalo. Em todas elas o pior desfecho é a
 * página em branco — o visitante não sabe se quebrou ou se não há nada. Daí o
 * texto explicar o que houve e oferecer o próximo passo.
 */
export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao: string
  /** Volta para a listagem. Ausente na própria listagem vazia. */
  acao?: { href: string; rotulo: string }
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
        <SparklesIcon className="h-6 w-6 text-white" />
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{titulo}</h2>
        <p className="leading-relaxed text-slate-600 dark:text-slate-400">{descricao}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {acao && (
          <Link
            href={acao.href}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {acao.rotulo}
          </Link>
        )}

        <a
          href={CONTACT.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-track="contato_click"
          className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600 transition-all hover:border-emerald-500/40 hover:text-emerald-600 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Falar no WhatsApp
        </a>
      </div>
    </div>
  )
}
