-- =============================================================================
-- Migration: Chat IA — Sessões, Mensagens, Qualificação de Leads e Sumarização
-- =============================================================================

create table if not exists public.chat_sessoes (
  id uuid primary key default gen_random_uuid(),
  modo_inicial text not null default 'tech' check (modo_inicial in ('tech', 'pastoral')),
  modo_atual text not null default 'tech' check (modo_atual in ('tech', 'pastoral')),
  total_mensagens integer not null default 0,
  clicou_whatsapp boolean not null default false,
  houve_transferencia boolean not null default false,
  nome_lead text,
  contato_lead text,
  resumo_conversa text,
  qualificado boolean not null default false,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Adiciona as colunas caso a tabela já tenha sido criada em versão anterior
alter table public.chat_sessoes add column if not exists nome_lead text;
alter table public.chat_sessoes add column if not exists contato_lead text;
alter table public.chat_sessoes add column if not exists resumo_conversa text;
alter table public.chat_sessoes add column if not exists qualificado boolean not null default false;

create table if not exists public.chat_mensagens (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null references public.chat_sessoes(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  modo text not null default 'tech' check (modo in ('tech', 'pastoral')),
  content text not null,
  modelo_usado text,
  created_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_chat_sessoes_created_at on public.chat_sessoes(created_at desc);
create index if not exists idx_chat_sessoes_modo on public.chat_sessoes(modo_atual);
create index if not exists idx_chat_sessoes_qualificado on public.chat_sessoes(qualificado);
create index if not exists idx_chat_mensagens_sessao on public.chat_mensagens(sessao_id, created_at asc);

-- RLS
alter table public.chat_sessoes enable row level security;
alter table public.chat_mensagens enable row level security;

-- Admin tem acesso total de leitura e escrita (com drop prévio para ser idempotente)
drop policy if exists "Admins podem visualizar sessoes de chat" on public.chat_sessoes;
create policy "Admins podem visualizar sessoes de chat"
  on public.chat_sessoes for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins podem visualizar mensagens de chat" on public.chat_mensagens;
create policy "Admins podem visualizar mensagens de chat"
  on public.chat_mensagens for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins podem gerenciar sessoes de chat" on public.chat_sessoes;
create policy "Admins podem gerenciar sessoes de chat"
  on public.chat_sessoes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins podem gerenciar mensagens de chat" on public.chat_mensagens;
create policy "Admins podem gerenciar mensagens de chat"
  on public.chat_mensagens for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Grants explícitos para authenticated
grant select on public.chat_sessoes to authenticated;
grant select on public.chat_mensagens to authenticated;
