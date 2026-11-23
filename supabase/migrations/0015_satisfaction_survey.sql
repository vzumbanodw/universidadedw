-- =============================================================================
-- Universidade Dataweb — migração 0015
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- Cria `satisfaction_responses`: respostas da Pesquisa de Satisfação exibida
-- ao aluno na entrada do Universidade. Uma resposta por pessoa e por pesquisa
-- (`survey_id`) — quem respondeu não vê mais o formulário.
--
-- Nome, e-mail e empresa são gravados no momento da resposta: o registro
-- continua legível mesmo se a pessoa for transferida ou removida depois.
--
-- Migração ADITIVA: só cria a tabela nova; nenhum dado existente é alterado.
-- =============================================================================

create table if not exists public.satisfaction_responses (
  survey_id           text not null,
  student_id          text not null,   -- id do aluno no Supabase Auth (auth.users.id)
  student_name        text not null,
  student_email       text not null,
  company_id          text,
  company_name        text,
  most_helpful_lesson text,            -- 1. aula que mais ajudou
  missing_topic       text,            -- 2. aula/assunto que falta
  ease_rating         smallint not null check (ease_rating between 1 and 10),
  improvement         text,            -- 4. sugestão de melhoria
  created_at          timestamptz not null default now(),
  primary key (survey_id, student_id)
);

create index if not exists satisfaction_responses_company_idx
  on public.satisfaction_responses (survey_id, company_id);

-- RLS habilitado SEM policy pública: acessado só pelo servidor
-- (SERVICE ROLE, que ignora o RLS).
alter table public.satisfaction_responses enable row level security;
