-- =============================================================================
-- Universidade Dataweb — migração 0006
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- Evolui `lesson_completions` de "concluído (sim/não)" para PROGRESSO CONTÍNUO:
--   - `percent`      : maior % já assistida da aula (0–100).
--   - `completed_at` : passa a ser NULO enquanto a aula não é concluída
--                      (preenchido quando percent >= 95).
--
-- Uma linha passa a existir assim que o aluno COMEÇA a aula (percent > 0),
-- alimentando o "Continuar de onde parou", as barras de % em aula/curso/aplicação
-- e a emissão de certificado (100%). Idempotente e seguro de rodar mais de uma vez.
-- =============================================================================

-- 1) Coluna de porcentagem (default 0 para novas linhas parciais).
alter table public.lesson_completions
  add column if not exists percent int not null default 0;

-- 2) Linhas antigas eram todas CONCLUSÕES → contam como 100%.
update public.lesson_completions
  set percent = 100
  where percent = 0 and completed_at is not null;

-- 3) `completed_at` passa a poder ser nulo (aula iniciada, ainda não concluída).
alter table public.lesson_completions alter column completed_at drop default;
alter table public.lesson_completions alter column completed_at drop not null;

-- 4) Sanidade: mantém percent no intervalo válido.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lesson_completions_percent_range'
  ) then
    alter table public.lesson_completions
      add constraint lesson_completions_percent_range
      check (percent >= 0 and percent <= 100);
  end if;
end $$;
