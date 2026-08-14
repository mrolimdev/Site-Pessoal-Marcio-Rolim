import { redirect } from 'next/navigation'

/**
 * A tela de analytics foi absorvida pela visão geral — lá existe um recorte de
 * período só, e tráfego, atendimentos de IA e conteúdo respondem todos a ele.
 *
 * A rota sobrevive como redirecionamento porque links antigos existem: o menu
 * do painel apontava para cá, e um favorito com `?periodo=90` não deve virar
 * 404. O período viaja junto para o destino.
 *
 * Redirect temporário (307), não permanente: um 308 fica gravado no navegador
 * de quem visitou e nos deixaria sem volta se a decisão mudasse.
 */
export default async function AnalyticsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>
}) {
  const parametros = await searchParams
  const periodo = typeof parametros.periodo === 'string' ? parametros.periodo : null

  redirect(periodo ? `/admin?periodo=${encodeURIComponent(periodo)}` : '/admin')
}
