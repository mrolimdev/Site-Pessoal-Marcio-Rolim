import type { Metadata } from 'next'

import { CabecalhoBlog, CascaBlog } from '@/components/blog/casca-blog'
import { EstadoVazio } from '@/components/blog/estado-vazio'
import { Paginacao } from '@/components/blog/paginacao'
import { PostCard, PostCardDestaque } from '@/components/blog/post-card'
import { SITE, urlAbsoluta } from '@/content/site'
import { listarPosts } from '@/lib/blog/queries'

/**
 * Listagem do blog.
 *
 * A rota é renderizada a cada requisição — ler `searchParams` (o `?pagina=`) é
 * Request-time API e não existe pré-render possível com paginação por query
 * string sem Cache Components. O que evita ida ao banco é a outra ponta: as
 * consultas de `lib/blog/queries` passam pelo Data Cache com a MESMA janela de
 * 1 hora declarada aqui. Na prática a página monta HTML novo e reaproveita os
 * dados; o painel derruba tudo com `revalidateTag('posts')`.
 */
export const revalidate = 3600

const TITULO = 'Blog'
const DESCRICAO =
  'Textos sobre inteligência artificial, automação de processos, tecnologia aplicada a negócios e fé.'

/** `?pagina=1&pagina=2` chega como array. Vale o primeiro e pronto. */
function primeiroValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor
}

function lerPagina(valor: string | string[] | undefined): number {
  const numero = Number.parseInt(primeiroValor(valor) ?? '1', 10)
  return Number.isFinite(numero) && numero > 1 ? numero : 1
}

type PropsBusca = {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: PropsBusca): Promise<Metadata> {
  const pagina = lerPagina((await searchParams).pagina)
  const caminho = pagina > 1 ? `/blog?pagina=${pagina}` : '/blog'

  return {
    title: pagina > 1 ? `${TITULO} — página ${pagina}` : TITULO,
    description: DESCRICAO,
    // Canônica APONTANDO PARA SI MESMA em cada página. Mandar a página 3
    // canonizar para /blog faria o buscador descartar os posts que só existem
    // lá — a página 3 não é uma cópia da 1, é outra fatia da mesma lista.
    alternates: {
      canonical: caminho,
      types: { 'application/rss+xml': '/blog/rss.xml' },
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'website',
      url: urlAbsoluta(caminho),
      title: `${TITULO} | ${SITE.name}`,
      description: DESCRICAO,
      siteName: SITE.siteName,
      locale: SITE.locale,
    },
  }
}

export default async function BlogPage({ searchParams }: PropsBusca) {
  const paginaPedida = lerPagina((await searchParams).pagina)
  const { posts, pagina, totalPaginas, total } = await listarPosts({ pagina: paginaPedida })

  const primeiraPagina = pagina === 1
  const destaque = primeiraPagina ? posts[0] : undefined
  const demais = primeiraPagina ? posts.slice(1) : posts

  return (
    <CascaBlog voltar={{ href: '/', rotulo: 'Início' }}>
      <CabecalhoBlog>
        <span className="w-fit rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-700 dark:text-amber-400">
          {total === 0
            ? 'em construção'
            : `${total} ${total === 1 ? 'publicação' : 'publicações'}`}
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {TITULO}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          {DESCRICAO}
        </p>
      </CabecalhoBlog>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        {posts.length === 0 ? (
          pagina > 1 ? (
            <EstadoVazio
              titulo="Página fora do intervalo"
              descricao="Não há posts nesta página. Provavelmente o endereço veio de um link antigo, de quando a lista era maior."
              acao={{ href: '/blog', rotulo: 'Voltar para o começo do blog' }}
            />
          ) : (
            <EstadoVazio
              titulo="Ainda não há posts publicados"
              descricao="Os primeiros textos sobre IA, automação e tecnologia aplicada a negócios saem em breve. Enquanto isso, o canal direto continua aberto."
            />
          )
        ) : (
          <>
            {destaque && <PostCardDestaque post={destaque} />}

            {demais.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {demais.map((post, i) => (
                  <PostCard
                    key={post.slug}
                    post={post}
                    prioridade={!primeiraPagina && i === 0}
                  />
                ))}
              </div>
            )}

            <Paginacao pagina={pagina} totalPaginas={totalPaginas} />
          </>
        )}
      </main>
    </CascaBlog>
  )
}
