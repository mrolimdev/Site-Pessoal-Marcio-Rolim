# Design Spec: Reestruturação do Blog em Seções (Tecnologia & Vida Cristã)

**Data:** 11/08/2026  
**Status:** Aprovado pelo Usuário  

---

## 1. Objetivo

Reformular a página principal do Blog (`/blog`) para dividi-la claramente em duas áreas temáticas principais:
1. **Tecnologia & Inovação** (agrupando as categorias `tecnologia`, `ia`, `automacao` e `negocios`).
2. **Vida Cristã & Fé** (categoria `fe`).

Além disso, incluir um post inicial de estreia para a categoria **Vida Cristã** via migração SQL no Supabase, garantindo que ambas as áreas tenham conteúdo publicado de imediato.

---

## 2. Experiência do Usuário (UX) & Design Layout

### 2.1 Hero do Blog
- **Título & Descrição:** Apresentação clara dos dois pilares do blog (Inovação Tecnológica e Fé/Vida Cristã).
- **Navegação por Âncoras Rápidas:** Badges com atalhos de rolagem suave para as seções `💻 Tecnologia & Inovação` e `✝️ Vida Cristã`.

### 2.2 Seção 1: 💻 Tecnologia & Inovação
- **Identidade Visual:** Estilo moderno, clean, focado em engenharia de software, IA e automação.
- **Conteúdo:** Lista os posts com as categorias `tecnologia`, `ia`, `automacao`, `negocios`.
- **Layout:** Card em destaque (para o post mais recente) seguido por um grid responsivo dos demais posts.

### 2.3 Seção 2: ✝️ Vida Cristã & Fé
- **Identidade Visual:** Layout acolhedor com detalhes visuais quentes (acentos em tom âmbar/dourado suave) e tipografia elegante.
- **Conteúdo:** Lista os posts com a categoria `fe`.
- **Layout:** Seção temática dedicada com cartão e detalhes diferenciados para mensagens devocionais e reflexões.

---

## 3. Dados & Banco de Dados (Supabase)

### 3.1 Post Inicial de Vida Cristã
- **Migration SQL:** `supabase/migrations/20260811150000_post_vida_crista.sql`
- **Conteúdo do Post:**
  - **Título:** *Fé, Tecnologia e Propósito: Navegando no Mundo Digital com Sabedoria*
  - **Slug:** `fe-tecnologia-e-proposito`
  - **Categoria:** `fe`
  - **Tags:** `['fé', 'vida cristã', 'tecnologia', 'propósito']`
  - **Status:** `published`
  - **Minutos de leitura:** 4
  - **Resumo:** Uma reflexão sobre como os princípios cristãos de integridade, mordomia e amor ao próximo guiam nosso uso da tecnologia e automação no dia a dia.
  - **Content JSON:** ProseMirror JSON formatado com parágrafos, subtítulos e citação bíblica inspiradora (ex: Colossenses 3:23 / Provérbios 3:5-6).

### 3.2 Consultas (`lib/blog/queries.ts`)
- Adicionar/ajustar a função `listarPostsPorSecoes()` ou estender `listarPosts()` para retornar posts organizados por grupos temáticos (`tecnologia` vs `fe`).

---

## 4. Componentes Afetados

- `src/app/(site)/blog/page.tsx`: Reformulação completa da página principal.
- `src/components/blog/casca-blog.tsx`: Ajustes no cabeçalho e badges.
- `src/components/blog/post-card.tsx`: Suporte a variante visual temática (para posts de fé/vida cristã).
- `src/lib/blog/queries.ts`: Novas helpers de consulta filtrada.
- `supabase/migrations/20260811150000_post_vida_crista.sql`: Migration com post inicial.

---

## 5. Critérios de Aceitação

- [x] Rota `/blog` renderiza seções separadas para Tecnologia e Vida Cristã.
- [x] O post inicial de Vida Cristã é exibido corretamente na seção de Vida Cristã.
- [x] O post existente de tecnologia continua na seção de Tecnologia.
- [x] `npm run build` compila 100% sem erros de TypeScript ou Next.js.
