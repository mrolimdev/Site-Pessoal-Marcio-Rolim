import Link from 'next/link'

/**
 * Tags são texto livre no banco (`text[]`), então podem ter espaço e acento.
 * `encodeURIComponent` na hora de montar o link é o que impede um "IA & dados"
 * de virar uma URL quebrada. A página de tag desfaz a codificação.
 */
export function caminhoDaTag(tag: string): string {
  return `/blog/tag/${encodeURIComponent(tag)}`
}

export function TagsDoPost({
  tags,
  className = '',
}: {
  tags: readonly string[]
  className?: string
}) {
  if (tags.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={caminhoDaTag(tag)}
            className="block rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-amber-500/40 hover:text-amber-700 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:text-amber-400"
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  )
}
