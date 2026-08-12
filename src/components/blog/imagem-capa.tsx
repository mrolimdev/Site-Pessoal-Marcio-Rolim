import Image from 'next/image'

import { env } from '@/lib/env'

/**
 * Capa do post.
 *
 * `cover_url` é texto livre no banco: normalmente aponta para o bucket do
 * Supabase, mas nada impede uma URL de fora. `next/image` só aceita host
 * declarado em `images.remotePatterns` — e não avisa em build, LANÇA em tempo
 * de render, o que derrubaria a página inteira por causa de uma capa.
 *
 * Então: host conhecido vai por next/image (otimização, AVIF/WebP, srcset);
 * qualquer outro cai em <img>. A página nunca quebra por causa de uma imagem.
 *
 * Em ambos os casos a imagem preenche o contêiner (`absolute inset-0`), e é o
 * contêiner de quem chama que fixa a proporção — assim não há salto de leiaute
 * mesmo sem conhecer as dimensões do arquivo.
 */
const HOSTS_OTIMIZADOS = new Set([
  new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname,
  'files.restaure.online',
  'images.unsplash.com',
  'images.pexels.com',
])

function podeOtimizar(src: string): boolean {
  if (!src) return false
  if (src.startsWith('/') || src.startsWith('data:')) return true
  try {
    const host = new URL(src).hostname
    return HOSTS_OTIMIZADOS.has(host) || host.endsWith('.supabase.co') || host.endsWith('.restaure.online')
  } catch {
    return false
  }
}

export function ImagemDeCapa({
  src,
  alt,
  sizes,
  prioridade = false,
}: {
  src: string
  alt: string
  /** Obrigatório: com `fill`, sem `sizes` o Next serve sempre a maior versão. */
  sizes: string
  prioridade?: boolean
}) {
  if (podeOtimizar(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={prioridade}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- host fora de images.remotePatterns; ver comentário do módulo
    <img
      src={src}
      alt={alt}
      loading={prioridade ? 'eager' : 'lazy'}
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  )
}
