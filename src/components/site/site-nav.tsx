'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { CloseIcon, MenuIcon, WhatsAppIcon } from '@/components/icons'
import { ThemeToggle } from '@/components/theme-toggle'
import { LOGO, NAVBAR, NAV_LINKS } from '@/content/home'
import { MEDIA, MEDIA_ALT, SOCIAL_LINKS } from '@/content/site'

/**
 * Barra de navegação da home. Ilha de cliente por três estados de browser:
 * posição do scroll (> 60px deixa a barra opaca), abertura do menu mobile e
 * trava do scroll do body enquanto o menu está aberto.
 *
 * Origem: App.tsx:260-356. O objeto `getTheme(isDark)` foi substituído por
 * variantes `dark:` — as classes abaixo são a união literal dos dois temas.
 */

const FUNDO_NAV =
  'bg-white/80 backdrop-blur-xl border-stone-200/50 dark:bg-slate-950/80 dark:border-slate-800/50'
const FUNDO_VIDRO =
  'bg-white/80 backdrop-blur-xl border-stone-200/60 dark:bg-slate-900/70 dark:border-slate-800/50'
const FUNDO_CARTAO =
  'bg-white/80 border-stone-200/80 dark:bg-slate-900/60 dark:border-slate-800/60'
const DIVISOR = 'border-stone-200 dark:border-slate-800'
const TEXTO_LINK =
  'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'

export function SiteNav() {
  const [rolou, setRolou] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  // A barra fica opaca quando a página rolou OU o menu mobile está aberto.
  const opaca = rolou || menuAberto

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 60)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  useEffect(() => {
    if (!menuAberto) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuAberto])

  return (
    <>
      {/* Fundo escurecido atrás do menu mobile */}
      <div
        aria-hidden="true"
        onClick={() => setMenuAberto(false)}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          menuAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          opaca ? `${FUNDO_NAV} shadow-xl shadow-black/5` : 'bg-transparent'
        } border-b ${opaca ? DIVISOR : 'border-transparent'}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <a
              href="#"
              className="flex items-center gap-3 font-bold text-lg text-stone-900 dark:text-white transition-colors"
            >
              <div
                className={`transition-all duration-500 flex-shrink-0 ${
                  opaca ? 'w-8 h-8 opacity-100' : 'w-0 h-0 opacity-0'
                } overflow-hidden`}
              >
                <Image
                  src={MEDIA.profileImageUrl}
                  alt={MEDIA_ALT.navLogo}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-500/30"
                />
              </div>
              <span className="tracking-tight">
                {LOGO.prefix}
                <span className="text-amber-600 dark:text-amber-400">{LOGO.accent}</span>
              </span>
            </a>

            {/* Navegação desktop */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const classe = `px-4 py-2 rounded-full text-sm font-medium ${TEXTO_LINK} transition-colors`
                // Âncora da própria página continua sendo <a> (o scroll suave do
                // CSS depende disso); rota de verdade usa Link, para navegar sem
                // recarregar e para o Next pré-carregar o destino.
                return link.href.startsWith('#') ? (
                  <a key={link.label} href={link.href} className={classe}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} href={link.href} className={classe}>
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <ThemeToggle
                className={`w-9 h-9 rounded-full flex items-center justify-center ${FUNDO_CARTAO} border transition-all hover:scale-105`}
                tituloParaClaro={NAVBAR.themeToggleToLight}
                tituloParaEscuro={NAVBAR.themeToggleToDark}
              />
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {NAVBAR.ctaDesktop}
              </a>
              <button
                type="button"
                onClick={() => setMenuAberto((aberto) => !aberto)}
                aria-expanded={menuAberto}
                aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center ${FUNDO_CARTAO} border transition-all`}
              >
                {menuAberto ? (
                  <CloseIcon className="w-4 h-4" />
                ) : (
                  <MenuIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {menuAberto && (
          <div
            className={`md:hidden ${FUNDO_VIDRO} border-t ${DIVISOR} px-4 py-4 flex flex-col gap-1`}
          >
            {NAV_LINKS.map((link) => {
              const classe = `block px-4 py-3 rounded-xl text-sm font-medium ${TEXTO_LINK} transition-colors cursor-pointer`
              const fechar = () => setMenuAberto(false)
              return link.href.startsWith('#') ? (
                <a key={link.label} href={link.href} onClick={fechar} className={classe}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} onClick={fechar} className={classe}>
                  {link.label}
                </Link>
              )
            })}
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-semibold mt-2"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {NAVBAR.ctaMobile}
            </a>
          </div>
        )}
      </nav>
    </>
  )
}
