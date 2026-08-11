import { ROTULO_CATEGORIA, type Categoria } from '@/lib/blog/constantes'

/**
 * O rótulo vem de `lib/blog/constantes`, o mesmo que o painel usa nos selects.
 * Só a cor mora aqui, porque é decisão de aparência do site público e não faz
 * sentido no formulário do admin.
 *
 * As classes precisam aparecer escritas por extenso: o Tailwind varre o
 * código-fonte em texto e não resolve `bg-${cor}-100` em tempo de build.
 */
const CORES: Record<Categoria, string> = {
  tecnologia:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
  ia: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
  automacao:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  negocios:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  fe: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
}

export function CategoriaBadge({
  categoria,
  className = '',
}: {
  categoria: Categoria
  className?: string
}) {
  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${CORES[categoria]} ${className}`}
    >
      {ROTULO_CATEGORIA[categoria]}
    </span>
  )
}
