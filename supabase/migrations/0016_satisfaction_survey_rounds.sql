-- =============================================================================
-- Universidade Dataweb — migração 0016
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- Pesquisa de Satisfação recorrente: a mesma pessoa passa a poder responder
-- várias vezes (uma nova rodada a cada 3 meses). Cada envio vira um registro
-- próprio no backoffice — o histórico não é sobrescrito.
--
--   • `id`             identificador de cada resposta (nova chave primária)
--   • `response_round` 1ª, 2ª, 3ª… resposta da pessoa. É única por pessoa:
--                      um envio duplicado (duplo clique, duas abas) não cria
--                      dois registros da mesma rodada.
--
-- Respostas já gravadas viram a rodada 1. Nenhum dado é apagado.
-- Pode ser rodada mais de uma vez sem efeito colateral.
-- =============================================================================

alter table public.satisfaction_responses
  add column if not exists id uuid not null default gen_random_uuid();

alter table public.satisfaction_responses
  add column if not exists response_round integer not null default 1;

-- Troca a chave (survey_id, student_id) — uma resposta por pessoa — por `id`.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.satisfaction_responses'::regclass
      and conname = 'satisfaction_responses_id_pkey'
  ) then
    alter table public.satisfaction_responses
      drop constraint if exists satisfaction_responses_pkey;
    alter table public.satisfaction_responses
      add constraint satisfaction_responses_id_pkey primary key (id);
  end if;
end $$;

create unique index if not exists satisfaction_responses_round_uq
  on public.satisfaction_responses (survey_id, student_id, response_round);

-- Última resposta da pessoa (usada a cada entrada para decidir se a pesquisa aparece).
create index if not exists satisfaction_responses_student_recent_idx
  on public.satisfaction_responses (survey_id, student_id, created_at desc);
