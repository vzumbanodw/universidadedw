-- =============================================================================
-- Universidade Dataweb — migração 0007
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- Cria a tabela `password_reset_requests`: solicitações de "Esqueci minha
-- senha" enviadas pela tela de login. O operador aprova/recusa no backoffice;
-- após a aprovação, o aluno define a NOVA senha na tela de primeiro acesso.
--
-- A redefinição atualiza a senha do usuário EXISTENTE no Supabase Auth
-- (auth.admin.updateUserById) — o id do usuário não muda, então TODO o
-- progresso (lesson_completions, certificados etc.) é preservado.
--
-- status: pending (aguardando operador) | approved (aluno pode redefinir)
--         | rejected (recusada) | used (senha redefinida com sucesso)
-- =============================================================================

create table if not exists public.password_reset_requests (
  id          text primary key,
  email       text not null,
  status      text not null default 'pending',
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists password_reset_requests_status_idx
  on public.password_reset_requests (status);
create index if not exists password_reset_requests_email_idx
  on public.password_reset_requests (lower(email));

-- RLS habilitado SEM policy pública: a tabela só é acessada pelo servidor
-- (SERVICE ROLE, que ignora o RLS).
alter table public.password_reset_requests enable row level security;
