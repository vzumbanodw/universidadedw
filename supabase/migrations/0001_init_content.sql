-- =============================================================================
-- Universidade Dataweb — schema inicial
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- (ou rode via Supabase CLI: `supabase db push`)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Documento único de conteúdo
--
-- Todo o estado do backoffice (cursos, aulas, trilhas, empresas, alunos,
-- certificados, níveis de maturidade, novidades e configurações) é guardado
-- como um único documento JSONB na linha `id = 1`. É a mesma fonte que o app
-- do aluno lê. O servidor (rota PUT /api/content, protegida pelo cookie de
-- operador) grava usando a SERVICE ROLE.
-- -----------------------------------------------------------------------------
create table if not exists public.app_content (
  id          integer primary key default 1,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint app_content_singleton check (id = 1)
);

comment on table public.app_content is
  'Documento único (JSONB) com todo o conteúdo da Universidade. Linha id=1.';

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.app_content enable row level security;

-- Leitura pública: o app do aluno e o backoffice leem o documento publicado.
-- (Nada sensível trafega aqui; credenciais ficam fora deste documento.)
drop policy if exists "app_content_public_read" on public.app_content;
create policy "app_content_public_read"
  on public.app_content
  for select
  using (true);

-- Escrita: NENHUMA policy para anon/authenticated. Apenas a SERVICE ROLE
-- (usada somente no servidor) grava, pois ela ignora o RLS. Assim, nenhum
-- cliente consegue alterar o conteúdo diretamente.

-- -----------------------------------------------------------------------------
-- Mantém updated_at sempre atualizado
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_content_set_updated_at on public.app_content;
create trigger app_content_set_updated_at
  before update on public.app_content
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- ROADMAP (opcional, não executado): modelo relacional normalizado
--
-- Quando quiser sair do documento único para tabelas relacionais (courses,
-- lessons, learning_trails, students, certificates, points_events,
-- maturity_levels, admin_users…), os tipos já estão modelados em
-- `src/lib/supabase/types.ts` e os services em `src/services/admin/*`. Basta
-- criar as tabelas + policies e migrar cada service para consultá-las.
-- =============================================================================
