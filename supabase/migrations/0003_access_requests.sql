-- =============================================================================
-- Universidade Dataweb — migração 0003
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- 1) Cria a tabela `access_requests` (solicitações de acesso da tela de login).
-- 2) Remove os perfis de acesso (`access_roles` e `members.role_id`), que não
--    são mais usados — agora todo funcionário de uma empresa tem acesso a todo
--    o conteúdo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Solicitações de acesso (fluxo público do login)
-- -----------------------------------------------------------------------------
create table if not exists public.access_requests (
  id           text primary key,
  name         text not null,
  email        text not null,
  company_name text,          -- empresa digitada pelo solicitante (texto livre)
  company_id   text,          -- empresa vinculada na aprovação
  status       text not null default 'pending',  -- pending | approved | rejected
  reviewed_at  timestamptz,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists access_requests_status_idx on public.access_requests (status);
create index if not exists access_requests_email_idx on public.access_requests (lower(email));

-- RLS habilitado SEM policy de leitura pública: estes dados de contato só são
-- acessados pelo servidor (SERVICE ROLE, que ignora o RLS).
alter table public.access_requests enable row level security;

-- -----------------------------------------------------------------------------
-- Remoção dos perfis de acesso (não usados mais)
-- -----------------------------------------------------------------------------
drop table if exists public.access_roles cascade;
alter table public.members drop column if exists role_id;
