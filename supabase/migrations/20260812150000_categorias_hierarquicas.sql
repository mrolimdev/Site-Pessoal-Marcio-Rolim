-- =============================================================================
-- Migration: Suporte a Categorias e Subcategorias Hierárquicas Dinâmicas
-- =============================================================================

-- 1. Remove restrição estática de CHECK em public.posts.category para permitir novas subcategorias
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- 2. Cria tabela public.categories para armazenar Categorias Pai e Subcategorias
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  parent_id text REFERENCES public.categories(id) ON DELETE CASCADE,
  color text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Habilita RLS na tabela public.categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para o blog
CREATE POLICY "Permitir leitura pública de categorias"
  ON public.categories FOR SELECT
  USING (true);

-- Política de gestão total para admins
CREATE POLICY "Permitir gestão total de categorias para admins"
  ON public.categories FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 4. Inserção das Categorias Pai padrão
INSERT INTO public.categories (id, name, description, parent_id, color) VALUES
  ('tecnologia_ia', 'Tecnologia & IA', 'Grande área dedicada a Engenharia de Software, Agentes de IA, Automações e Estratégia Digital.', NULL, 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-600'),
  ('fe_vida_crista', 'Vida Cristã & Fé', 'Grande área dedicada a Estudos Bíblicos, Teologia Prática e Reflexões sobre Fé no Cotidiano.', NULL, 'from-amber-600/20 to-yellow-600/20 border-amber-600/30 text-amber-700')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 5. Inserção das Subcategorias padrão ligadas às Categorias Pai
INSERT INTO public.categories (id, name, description, parent_id, color) VALUES
  ('tecnologia', 'Engenharia & Web', 'Artigos sobre engenharia de software, desenvolvimento web, arquitetura e infraestrutura.', 'tecnologia_ia', 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-600'),
  ('ia', 'Inteligência Artificial', 'Inteligência Artificial, modelos LLM, engenharia de prompt e agentes autônomos.', 'tecnologia_ia', 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-600'),
  ('automacao', 'Automação & n8n', 'Workflows automatizados, n8n, integração de APIs e otimização de processos digitais.', 'tecnologia_ia', 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-600'),
  ('negocios', 'Estratégia & Negócios', 'Empreendedorismo, estratégias de negócios, gestão de produtos e liderança técnica.', 'tecnologia_ia', 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-600'),
  ('fe', 'Fé, Devocional & Família', 'Estudos bíblicos, vida cristã, teologia prática e reflexões de fé no cotidiano.', 'fe_vida_crista', 'from-amber-600/20 to-yellow-600/20 border-amber-600/30 text-amber-700')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id;
