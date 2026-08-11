# Plano de Implementação: Reestruturação do Blog em Seções (Tecnologia & Vida Cristã)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reformular o blog em duas seções principais (Tecnologia e Vida Cristã), incluindo uma migração com o post inicial de estreia para a área de Vida Cristã.

**Architecture:** A página principal do blog (`src/app/(site)/blog/page.tsx`) passará a consultar e renderizar os posts divididos em duas grandes seções (Tecnologia & Inovação vs Vida Cristã & Fé). Um novo arquivo de migração SQL irá popular o Supabase com o post inicial da categoria `fe`.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (PostgreSQL), Tailwind CSS, TypeScript.

## Global Constraints

- Manter padrões existentes do projeto (React 19 Server Components em `app/(site)/blog/page.tsx`).
- Respeitar os nomes de categorias já definidos (`tecnologia`, `ia`, `automacao`, `negocios` e `fe`).
- Executar `npm run build` ao final de cada tarefa para validar tipos e compilação sem regressões.

---

### Task 1: Migração SQL do Post Inicial de Vida Cristã

**Files:**
- Create: `supabase/migrations/20260811150000_post_vida_crista.sql`

**Interfaces:**
- Consumes: Tabela `public.posts` e `category = 'fe'`.
- Produces: Post publicado com slug `fe-tecnologia-e-proposito`.

- [ ] **Step 1: Escrever a migração SQL do post de Vida Cristã**

Criar `supabase/migrations/20260811150000_post_vida_crista.sql`:
```sql
-- Inserção do primeiro post de Vida Cristã / Fé no blog
INSERT INTO public.posts (
  slug,
  title,
  excerpt,
  cover_url,
  cover_alt,
  category,
  tags,
  reading_minutes,
  status,
  published_at,
  seo_title,
  seo_description,
  content_json
) VALUES (
  'fe-tecnologia-e-proposito',
  'Fé, Tecnologia e Propósito: Navegando no Mundo Digital com Sabedoria',
  'Uma reflexão sobre como os princípios cristãos de integridade, mordomia e amor ao próximo guiam nosso uso da tecnologia e automação no dia a day.',
  'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
  'Bíblia aberta e notebook em uma mesa de trabalho iluminada por luz natural',
  'fe',
  ARRAY['fé', 'vida cristã', 'tecnologia', 'propósito'],
  4,
  'published',
  NOW(),
  'Fé, Tecnologia e Propósito | Márcio Rolim',
  'Uma reflexão sobre como os princípios cristãos guiam o uso responsável da tecnologia, IA e automação no dia a dia.',
  '{
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Vivemos em uma era de transformações aceleradas. A inteligência artificial, as automações de processos e os novos ecossistemas digitais remodelam a forma como trabalhamos e interagimos todos os dias. Mas em meio a tantos avanços, surge a pergunta fundamental: como manter nosso coração e mente alinhados aos propósitos de Deus?"
          }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [
          {
            "type": "text",
            "text": "1. Mordomia e Responsabilidade Digital"
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "A tecnologia é uma ferramenta extraordinária, mas continua sendo apenas isso: um instrumento. Em Colossenses 3:23, somos lembrados: \"Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens\". Usar a tecnologia com mordomia significa colocar nossa inteligência e habilidades a serviço do bem, construindo soluções éticas, transparentes e que sirvam genuinamente às pessoas."
          }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [
          {
            "type": "text",
            "text": "2. Integridade e Automação"
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Automatizar tarefas repetitivas nos devolve o recurso mais precioso: o tempo. O tempo para cuidar da família, dedicar-se à comunidade, estudar a Palavra e cultivar relacionamentos profundos. A automação não deve substituir a presença humana nem a empatia, mas libertar nossa mente para criar valor com propósito."
          }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [
          {
            "type": "text",
            "text": "3. Um Convite à Reflexão"
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Neste espaço de Vida Cristã, compartilharemos reflexões práticas, devocionais e ensaios sobre fé, liderança inspirada e vida com Deus em um mundo hiperconectado. Que cada linha sirva de inspiração para sua jornada diária."
          }
        ]
      }
    ]
  }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  cover_url = EXCLUDED.cover_url,
  category = EXCLUDED.category,
  content_json = EXCLUDED.content_json;
```

- [ ] **Step 2: Commit da migração**

```bash
git add supabase/migrations/20260811150000_post_vida_crista.sql
git commit -m "feat(db): adiciona migração com o post inicial de Vida Cristã"
```

---

### Task 2: Atualização nas Consultas de Leitura do Blog (`queries.ts`)

**Files:**
- Modify: `src/lib/blog/queries.ts:230-278`

**Interfaces:**
- Consumes: `supabase.from('posts')`
- Produces: `listarPostsAgrupadosPorSecoes()` que retorna `{ postsTecnologia: PostResumo[], postsVidaCrista: PostResumo[] }`

- [ ] **Step 1: Adicionar a função `listarPostsAgrupadosPorSecoes` em `src/lib/blog/queries.ts`**

Adicionar ao final de `src/lib/blog/queries.ts`:
```typescript
export type PostsPorSecao = {
  postsTecnologia: PostResumo[]
  postsVidaCrista: PostResumo[]
  totalTecnologia: number
  totalVidaCrista: number
}

/**
 * Busca posts agrupados nas duas seções principais:
 * - Tecnologia (categorias: tecnologia, ia, automacao, negocios)
 * - Vida Cristã (categoria: fe)
 */
export async function listarPostsAgrupadosPorSecoes(): Promise<PostsPorSecao> {
  const { data, error } = await supabase
    .from('posts')
    .select(COLUNAS_RESUMO)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .order('slug', { ascending: true })
    .limit(LIMITE_VARREDURA)
    .returns<LinhaResumo[]>()

  if (error) {
    throw new Error(`Falha ao listar posts por seção: ${error.message}`)
  }

  const todos = (data ?? []).map(paraResumo)

  const postsVidaCrista = todos.filter((p) => p.categoria === 'fe')
  const postsTecnologia = todos.filter((p) => p.categoria !== 'fe')

  return {
    postsTecnologia,
    postsVidaCrista,
    totalTecnologia: postsTecnologia.length,
    totalVidaCrista: postsVidaCrista.length,
  }
}
```

- [ ] **Step 2: Testar compilação do TypeScript**

Run: `npm run build`
Expected: PASS sem erros de tipo.

- [ ] **Step 3: Commit da alteração**

```bash
git add src/lib/blog/queries.ts
git commit -m "feat(blog): adiciona helper listarPostsAgrupadosPorSecoes"
```

---

### Task 3: Redesign e Reformulação da Página Principal do Blog (`page.tsx` & Componentes)

**Files:**
- Modify: `src/app/(site)/blog/page.tsx`
- Modify: `src/components/blog/casca-blog.tsx`
- Modify: `src/components/blog/post-card.tsx`

**Interfaces:**
- Consumes: `listarPostsAgrupadosPorSecoes()`
- Produces: Layout moderno do blog com seções dedicadas a **Tecnologia & Inovação** e **Vida Cristã & Fé**.

- [ ] **Step 1: Atualizar `PostCard` para variante visual de Fé/Vida Cristã em `src/components/blog/post-card.tsx`**

Ajustar `src/components/blog/post-card.tsx` para destacar visualmente a badge e a borda quando a categoria for `fe` (detalhes em tom âmbar/dourado):
```tsx
// Garantir que a badge para 'fe' exiba "Vida Cristã" ou "Fé" com destaque âmbar acolhedor
```

- [ ] **Step 2: Reescrever `src/app/(site)/blog/page.tsx` com as Seções Destacadas**

Atualizar `src/app/(site)/blog/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { CabecalhoBlog, CascaBlog } from '@/components/blog/casca-blog'
import { PostCard, PostCardDestaque } from '@/components/blog/post-card'
import { SITE, urlAbsoluta } from '@/content/site'
import { listarPostsAgrupadosPorSecoes } from '@/lib/blog/queries'

export const revalidate = 3600

const TITULO = 'Blog'
const DESCRICAO =
  'Artigos sobre inteligência artificial, automação e negócios, lado a lado com reflexões sobre fé e vida cristã.'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITULO,
    description: DESCRICAO,
    alternates: {
      canonical: '/blog',
      types: { 'application/rss+xml': '/blog/rss.xml' },
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'website',
      url: urlAbsoluta('/blog'),
      title: `${TITULO} | ${SITE.name}`,
      description: DESCRICAO,
      siteName: SITE.siteName,
      locale: SITE.locale,
    },
  }
}

export default async function BlogPage() {
  const { postsTecnologia, postsVidaCrista, totalTecnologia, totalVidaCrista } =
    await listarPostsAgrupadosPorSecoes()

  const destaqueTech = postsTecnologia[0]
  const demaisTech = postsTecnologia.slice(1)

  const destaqueFe = postsVidaCrista[0]
  const demaisFe = postsVidaCrista.slice(1)

  return (
    <CascaBlog voltar={{ href: '/', rotulo: 'Início' }}>
      <CabecalhoBlog>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="#tecnologia"
            className="w-fit rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 font-mono text-xs font-medium text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
          >
            💻 Tecnologia ({totalTecnologia})
          </a>
          <a
            href="#vida-crista"
            className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-medium text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
          >
            ✝️ Vida Cristã ({totalVidaCrista})
          </a>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {TITULO}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          {DESCRICAO}
        </p>
      </CabecalhoBlog>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-12">
        {/* ─── SEÇÃO 1: TECNOLOGIA & INOVAÇÃO ─── */}
        <section id="tecnologia" className="scroll-mt-24 flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-xl text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                💻
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Tecnologia, IA & Automação
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Engenharia, modelos de linguagem, automação de processos e negócios
                </p>
              </div>
            </div>
          </div>

          {postsTecnologia.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum post em tecnologia ainda.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {destaqueTech && <PostCardDestaque post={destaqueTech} />}
              {demaisTech.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {demaisTech.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ─── SEÇÃO 2: VIDA CRISTÃ & FÉ ─── */}
        <section
          id="vida-crista"
          className="scroll-mt-24 flex flex-col gap-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8 dark:bg-amber-950/10"
        >
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-xl text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                ✝️
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Vida Cristã & Reflexões
                </h2>
                <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
                  Fé, propósito, liderança inspirada e vida com Deus no mundo digital
                </p>
              </div>
            </div>
          </div>

          {postsVidaCrista.length === 0 ? (
            <p className="text-sm text-slate-500">Em breve reflexões sobre fé e vida cristã.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {destaqueFe && <PostCardDestaque post={destaqueFe} />}
              {demaisFe.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {demaisFe.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </CascaBlog>
  )
}
```

- [ ] **Step 3: Testar compilação `npm run build`**

Run: `npm run build`
Expected: PASS com compilação de todas as rotas estáticas do blog.

- [ ] **Step 4: Commit das alterações**

```bash
git add src/app/\(site\)/blog/page.tsx src/components/blog/
git commit -m "feat(blog): redesenha a página principal dividindo em Tecnologia e Vida Cristã"
```
