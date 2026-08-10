-- =============================================================================
-- Universidade Dataweb — migração 0009
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- CONTAS INDIVIDUAIS DE ADMINISTRADOR DO BACKOFFICE + TRILHA DE AUDITORIA.
--
-- 1) `admin_users` — cada operador tem conta própria (e-mail + senha). A senha
--    é definida pela própria pessoa através de um LINK DE ATIVAÇÃO pessoal
--    (/admin/primeiro-acesso?token=...), enviado pelo Victor.
--
-- 2) `admin_audit_log` — histórico nominal de ações no backoffice: cadastro e
--    edição de empresas e usuários, aprovações/recusas de solicitações,
--    exclusões etc. Visível na seção "Histórico" do backoffice.
--
-- >>> AO RODAR, o resultado exibido no final são OS 5 LINKS DE ATIVAÇÃO <<<
-- >>> (um por administrador) — copie e envie para cada pessoa.          <<<
--
-- A senha master (ADMIN_PASSWORD) continua funcionando como acesso de
-- emergência e aparece no histórico como "Master".
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Contas de administrador
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  id               text primary key,
  name             text not null,
  email            text not null,
  password_hash    text,            -- null até a pessoa definir a senha
  activation_token text,            -- link pessoal de primeira senha
  status           text not null default 'invited',  -- invited | active
  created_at       timestamptz not null default now()
);
create unique index if not exists admin_users_email_idx
  on public.admin_users (lower(email));
create index if not exists admin_users_token_idx
  on public.admin_users (activation_token);

alter table public.admin_users enable row level security;

-- -----------------------------------------------------------------------------
-- Trilha de auditoria (histórico nominal de ações)
-- -----------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id          bigint generated always as identity primary key,
  admin_name  text not null,
  admin_email text,
  action      text not null,
  created_at  timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

-- -----------------------------------------------------------------------------
-- As 5 contas iniciais, cada uma com token de ativação aleatório.
-- Rodar de novo não duplica nem regenera tokens já criados.
-- -----------------------------------------------------------------------------
insert into public.admin_users (id, name, email, activation_token)
values
  ('adm_evellyn',   'Evellyn',   'eiglesias@dataweb.com.br', encode(gen_random_bytes(24), 'hex')),
  ('adm_lucas',     'Lucas',     'ldomingues@dataweb.com.br', encode(gen_random_bytes(24), 'hex')),
  ('adm_fabio',     'Fabio',     'fdcastel@dataweb.com.br',   encode(gen_random_bytes(24), 'hex')),
  ('adm_christian', 'Christian', 'cluzzi@dataweb.com.br',     encode(gen_random_bytes(24), 'hex')),
  ('adm_mariana',   'Mariana',   'mcoser@dataweb.com.br',     encode(gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- RESULTADO: os links de ativação para enviar a cada administrador.
-- -----------------------------------------------------------------------------
select
  name,
  email,
  'https://uni.dataweb.com.br/admin/primeiro-acesso?token=' || activation_token
    as link_de_ativacao
from public.admin_users
where status = 'invited' and activation_token is not null
order by name;
