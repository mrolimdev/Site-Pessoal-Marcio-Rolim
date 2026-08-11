/**
 * Data de publicação.
 *
 * O fuso é fixado em America/Sao_Paulo de propósito. Sem ele, o servidor
 * formata em UTC e o browser em fuso local: um post publicado às 22h de
 * Brasília aparece com a data do dia seguinte no HTML e volta para o dia certo
 * na hidratação — isso é um mismatch de hidratação, não um detalhe estético.
 */
const FORMATO_LONGO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

const FORMATO_CURTO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

export function DataPost({
  iso,
  curta = false,
  className = '',
}: {
  iso: string
  curta?: boolean
  className?: string
}) {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return null

  return (
    <time dateTime={iso} className={className}>
      {(curta ? FORMATO_CURTO : FORMATO_LONGO).format(data)}
    </time>
  )
}

export function TempoDeLeitura({
  minutos,
  className = '',
}: {
  minutos: number
  className?: string
}) {
  return <span className={className}>{minutos} min de leitura</span>
}
