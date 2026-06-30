-- =============================================================================
-- Universidade Dataweb — migração 0004
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- Cria `lesson_completions`: registra quais vídeos (aulas) cada aluno concluiu.
-- É a base do progresso REAL — alimenta o "Concluído" no player, o filtro
-- "Em andamento", o "Continuar de onde parou" e a emissão de certificados.
-- =============================================================================

create table if not exists public.lesson_completions (
  student_id   text not null,   -- id do aluno no Supabase Auth (auth.users.id)
  lesson_id    text not null,
  course_id    text,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);
create index if not exists lesson_completions_student_idx
  on public.lesson_completions (student_id);
create index if not exists lesson_completions_student_course_idx
  on public.lesson_completions (student_id, course_id);

-- RLS habilitado SEM policy de leitura pública: acessado só pelo servidor
-- (SERVICE ROLE, que ignora o RLS).
alter table public.lesson_completions enable row level security;
