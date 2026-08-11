'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type EstadoLogin = { erro?: string }

/**
 * A escrita do cookie de sessão só funciona em Server Action ou Route Handler.
 * Num Server Component o HTTP já começou a streamar e o Set-Cookie é perdido —
 * por isso o login é uma action, não um componente.
 */
export async function entrar(_anterior: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = String(formData.get('email') ?? '').trim()
  const senha = String(formData.get('senha') ?? '')
  const proximo = String(formData.get('proximo') ?? '/admin')

  if (!email || !senha) {
    return { erro: 'Informe e-mail e senha.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) {
    // Mensagem genérica de propósito: distinguir "e-mail não existe" de "senha
    // errada" entrega ao atacante uma lista de contas válidas.
    return { erro: 'E-mail ou senha inválidos.' }
  }

  // Só aceita destino interno: `proximo` vem da query string e um valor como
  // "https://sitemalicioso" viraria open redirect.
  const destino = proximo.startsWith('/') && !proximo.startsWith('//') ? proximo : '/admin'
  redirect(destino)
}
