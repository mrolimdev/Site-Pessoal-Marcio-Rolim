'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Compatibilidade com o endereço legado `/#privacidade`.
 *
 * No site Vite a política de privacidade não tinha rota própria: a home trocava
 * de view quando o hash era `#privacidade` (App.tsx:198-213). Esses links já
 * circulam, então continuam válidos — só que agora encaminham para /privacidade.
 *
 * `replace` (e não `push`) para o hash não ficar no histórico: com `push`, o
 * botão Voltar traria o visitante de volta para a home com o hash e ele seria
 * reencaminhado, prendendo a navegação num laço.
 */
export function LegacyPrivacyHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    const encaminhar = () => {
      if (window.location.hash === '#privacidade') router.replace('/privacidade')
    }
    encaminhar()
    window.addEventListener('hashchange', encaminhar)
    return () => window.removeEventListener('hashchange', encaminhar)
  }, [router])

  return null
}
