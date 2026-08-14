'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { DatabaseIcon, BriefcaseIcon, TargetIcon, BotIcon } from '@/components/icons'

/**
 * Navegação do painel.
 *
 * É a única parte da casca que precisa de cliente: o estado ativo depende do
 * caminho atual, e um layout de servidor não recebe o pathname (ele não
 * re-renderiza a cada navegação). Fica isolada aqui para que o layout continue
 * sendo Server Component e não arraste `requireAdmin` nem nada de servidor para
 * o bundle do browser.
 */

// Sem item de "Analytics": os gráficos e as tabelas de tráfego passaram a ser
// a visão geral. Duas entradas de menu para a mesma tela é convite a achar que
// uma delas mostra outra coisa.
const ITENS = [
  { href: '/admin', rotulo: 'Visão geral', Icone: TargetIcon, exato: true },
  { href: '/admin/posts', rotulo: 'Posts', Icone: BriefcaseIcon, exato: false },
  { href: '/admin/categorias', rotulo: 'Categorias', Icone: DatabaseIcon, exato: false },
  { href: '/admin/tags', rotulo: 'Tags', Icone: DatabaseIcon, exato: false },
  { href: '/admin/ia', rotulo: 'Atendimentos IA', Icone: BotIcon, exato: false },
  { href: '/admin/configuracoes', rotulo: 'Configurações IA', Icone: DatabaseIcon, exato: false },
] as const

export function AdminNav() {
  const caminho = usePathname()

  return (
    <nav aria-label="Seções do painel">
      {/* Deitada no celular, em pé no desktop. scrollbar-hide evita a barra
          horizontal aparecendo por cima dos itens em telas estreitas. */}
      <ul className="scrollbar-hide flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {ITENS.map(({ href, rotulo, Icone, exato }) => {
          // '/admin' casaria com '/admin/posts' num startsWith solto, e a
          // visão geral ficaria acesa em toda página do painel.
          const ativo = exato ? caminho === href : caminho === href || caminho.startsWith(`${href}/`)

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  ativo
                    ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }`}
              >
                <Icone className="h-4 w-4 shrink-0" />
                {rotulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
