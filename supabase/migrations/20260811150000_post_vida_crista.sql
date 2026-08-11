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
  'Uma reflexão sobre como os princípios cristãos de integridade, mordomia e amor ao próximo guiam nosso uso da tecnologia e automação no dia a dia.',
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
