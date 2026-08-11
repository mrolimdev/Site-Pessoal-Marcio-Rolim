/**
 * Estado de carregamento da rota de analytics.
 *
 * O esqueleto repete a GEOMETRIA da tela real — mesma altura de cabeçalho,
 * mesma fileira de cinco indicadores, mesma altura de gráfico. É o que evita o
 * salto de layout no momento em que o conteúdo entra: se o placeholder tivesse
 * outra altura, tudo abaixo dele pularia de posição com a tela já sob o olhar
 * do usuário.
 *
 * Na troca de período este arquivo quase não aparece: a página resolve o
 * cabeçalho e o seletor rapidamente e é o <Suspense> interno que segura a
 * espera. Aqui é a primeira entrada na rota, quando ainda não há nada na tela.
 */
export default function CarregandoAnalytics() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy role="status">
      <span className="sr-only">Carregando os dados de analytics</span>

      <div className="flex flex-col gap-2">
        <div className="h-8 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-72 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="h-9 w-64 rounded-full bg-slate-200 dark:bg-slate-800" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, indice) => (
          <div
            key={indice}
            className="h-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>

      <div className="h-80 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-96 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-96 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    </div>
  )
}
