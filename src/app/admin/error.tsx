'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * Tela de erro do painel.
 *
 * O PROBLEMA QUE ESTE ARQUIVO RESOLVE. `requireAdmin()` lança `NaoAutorizado`
 * (sem sessão) ou `NaoPermitido` (logado, mas fora de private.admins) — dois
 * problemas com soluções opostas: um se resolve entrando de novo, o outro não
 * se resolve entrando de novo nenhuma vez. Só que EM PRODUÇÃO o Next apaga
 * `message` e `name` de qualquer erro vindo de Server Component antes de
 * entregá-lo ao boundary, justamente para não vazar detalhe interno; sobra o
 * `digest`. Ou seja: ler `error.name` aqui funcionaria em desenvolvimento e
 * mentiria em produção, que é o pior dos dois mundos.
 *
 * COMO ELE RESOLVE. Em vez de tentar adivinhar pelo erro, a página pergunta ao
 * Supabase do browser qual é o estado real: sem claims → sessão expirada; com
 * claims mas `is_admin()` falso → conta sem permissão; as duas certas → o erro
 * era outra coisa (uma consulta que falhou), e aí o texto honesto é "algo
 * falhou" com o botão de tentar de novo. A classificação passa a vir de fato
 * observável, não de string de erro.
 *
 * `is_admin()` é a única função do schema com EXECUTE para `authenticated`,
 * então essa checagem é possível do browser sem afrouxar nada — ela responde
 * apenas sobre o próprio usuário.
 */

type Diagnostico = 'verificando' | 'sem-sessao' | 'sem-permissao' | 'outro'

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  // Em 16.3 o prop estável do boundary é `retry` (o antigo `reset` só limpava
  // o estado sem refazer a busca, e a tela voltava a quebrar no mesmo ponto).
  retry: () => void
}) {
  const caminho = usePathname()
  const [diagnostico, setDiagnostico] = useState<Diagnostico>('verificando')

  useEffect(() => {
    console.error('[painel] erro na renderização', error)
  }, [error])

  useEffect(() => {
    let ativo = true

    async function classificar() {
      const supabase = createClient()

      const { data, error: erroClaims } = await supabase.auth.getClaims()
      if (!ativo) return

      if (erroClaims || !data?.claims) {
        setDiagnostico('sem-sessao')
        return
      }

      const { data: ehAdmin, error: erroRpc } = await supabase.rpc('is_admin')
      if (!ativo) return

      setDiagnostico(erroRpc || !ehAdmin ? 'sem-permissao' : 'outro')
    }

    classificar().catch(() => {
      if (ativo) setDiagnostico('outro')
    })

    return () => {
      ativo = false
    }
  }, [])

  const conteudo = TEXTOS[diagnostico]

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{conteudo.titulo}</h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {conteudo.descricao}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {diagnostico === 'sem-sessao' ? (
            <Link
              href={`/auth/login?proximo=${encodeURIComponent(caminho)}`}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5"
            >
              Entrar novamente
            </Link>
          ) : null}

          {diagnostico === 'outro' || diagnostico === 'verificando' ? (
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5"
            >
              Tentar de novo
            </button>
          ) : null}

          {diagnostico === 'sem-permissao' ? (
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
              >
                Sair desta conta
              </button>
            </form>
          ) : null}

          <Link
            href="/"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
          >
            Voltar ao site
          </Link>
        </div>

        {/* O digest é o único elo entre o que o usuário viu e a linha do log do
            servidor. Sem ele, "deu erro no painel" não é investigável. */}
        {error.digest ? (
          <p className="border-t border-slate-200 pt-3 font-mono text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
            Código do erro: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const TEXTOS: Record<Diagnostico, { titulo: string; descricao: string }> = {
  verificando: {
    titulo: 'Verificando seu acesso',
    descricao: 'Um instante — estamos conferindo o estado da sua sessão.',
  },
  'sem-sessao': {
    titulo: 'Sua sessão expirou',
    descricao:
      'O painel exige uma sessão válida e a sua não está mais ativa. Entre de novo para continuar de onde parou.',
  },
  'sem-permissao': {
    titulo: 'Esta conta não tem acesso ao painel',
    descricao:
      'Você está autenticado, mas a conta não consta na lista de administradores do site. Entrar de novo não muda isso: o acesso precisa ser liberado no banco.',
  },
  outro: {
    titulo: 'Não foi possível carregar esta tela',
    descricao:
      'Sua sessão está válida e a permissão está correta, então a falha foi ao buscar os dados. Costuma ser temporário.',
  },
}
