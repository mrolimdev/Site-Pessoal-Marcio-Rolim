'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { entrar, type EstadoLogin } from '@/app/auth/actions'

function BotaoEntrar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-slate-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  )
}

export function LoginForm({ proximo }: { proximo: string }) {
  const [estado, formAction] = useActionState<EstadoLogin, FormData>(entrar, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="proximo" value={proximo} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</span>
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
          {estado.erro}
        </p>
      )}

      <BotaoEntrar />
    </form>
  )
}
