-- =============================================================================
-- Universidade Dataweb — schema relacional normalizado
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- Cria uma tabela por entidade (cursos, aulas, trilhas, empresas, perfis de
-- acesso, membros/contas, certificados, níveis de maturidade, novidades e
-- configurações). Listas-folha (blocos de conteúdo da aula, materiais, ids de
-- permissão de um perfil, entradas de uma nota de versão) ficam como colunas
-- JSONB dentro da própria tabela-pai — padrão relacional pragmático.
--
-- Os dados que hoje estão em `app_content` (JSONB) são migrados
-- automaticamente para estas tabelas no primeiro acesso do app após o Run.
-- A tabela `app_content` é mantida como backup pré-migração.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Aplicações & Módulos (categorias)
-- -----------------------------------------------------------------------------
create table if not exists public.course_categories (
  id              text primary key,
  type            text not null,
  name            text not null,
  tagline         text,
  icon_key        text,
  accent          text,
  track_count     integer not null default 0,
  lesson_count    integer not null default 0,
  in_progress     integer not null default 0,
  completed       integer not null default 0,
  progress_pct    numeric not null default 0,
  href            text,
  description     text,
  cover_image_url text,
  published       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Cursos
-- -----------------------------------------------------------------------------
create table if not exists public.courses (
  id                text primary key,
  title             text not null,
  description       text,
  category_id       text,
  category_name     text,
  category_type     text,
  accent            text,
  level             text,
  format            text,
  estimated_minutes integer not null default 0,
  lessons_count     integer not null default 0,
  progress          integer not null default 0,
  status            text,
  featured          boolean not null default false,
  certificate       boolean not null default false,
  href              text,
  cover_image_url   text,
  promo_video_url   text,
  points            integer not null default 0,
  published         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists courses_category_id_idx on public.courses (category_id);

-- -----------------------------------------------------------------------------
-- Aulas
-- -----------------------------------------------------------------------------
create table if not exists public.lessons (
  id               text primary key,
  course_id        text,
  lesson_order     integer not null default 0,
  title            text not null,
  description      text,
  duration_minutes integer not null default 0,
  video_url        text,
  content_title    text,
  content_blocks   jsonb not null default '[]'::jsonb,
  resources        jsonb not null default '[]'::jsonb,
  published        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists lessons_course_id_idx on public.lessons (course_id);

-- -----------------------------------------------------------------------------
-- Trilhas + cursos da trilha (ordenado)
-- -----------------------------------------------------------------------------
create table if not exists public.learning_trails (
  id              text primary key,
  title           text not null,
  slug            text,
  description     text,
  target_audience text,
  level           text,
  accent          text,
  points          integer not null default 0,
  has_certificate boolean not null default false,
  published       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.trail_courses (
  id         bigint generated always as identity primary key,
  trail_id   text not null,
  course_id  text not null,
  sort_order integer not null default 0
);
create index if not exists trail_courses_trail_id_idx on public.trail_courses (trail_id);
create index if not exists trail_courses_course_id_idx on public.trail_courses (course_id);

-- -----------------------------------------------------------------------------
-- Empresas, perfis de acesso e membros (contas)
-- -----------------------------------------------------------------------------
create table if not exists public.companies (
  id            text primary key,
  name          text not null,
  segment       text,
  cnpj          text,
  contact_name  text,
  contact_email text,
  seats         integer not null default 0,
  logo_url      text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.access_roles (
  id           text primary key,
  company_id   text,
  name         text not null,
  description  text,
  level        text,
  category_ids jsonb not null default '[]'::jsonb,
  course_ids   jsonb not null default '[]'::jsonb,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists access_roles_company_id_idx on public.access_roles (company_id);

create table if not exists public.members (
  id           text primary key,
  company_id   text,
  name         text not null,
  email        text not null,
  job_title    text,
  role_id      text,
  status       text not null default 'invited',
  -- Vínculo com a conta no Supabase Auth (auth.users.id), quando criada.
  auth_user_id uuid,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists members_company_id_idx on public.members (company_id);
create index if not exists members_email_idx on public.members (lower(email));

-- -----------------------------------------------------------------------------
-- Certificados emitidos
-- -----------------------------------------------------------------------------
create table if not exists public.certificates (
  id               text primary key,
  student_name     text not null,
  student_email    text not null,
  company_name     text,
  course_id        text,
  course_title     text,
  trail_id         text,
  status           text not null default 'available',
  progress         integer,
  workload_minutes integer not null default 0,
  credential_id    text,
  issued_at        text,
  certificate_url  text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists certificates_student_email_idx on public.certificates (lower(student_email));
create index if not exists certificates_course_id_idx on public.certificates (course_id);

-- -----------------------------------------------------------------------------
-- Níveis de maturidade
-- -----------------------------------------------------------------------------
create table if not exists public.maturity_levels (
  id          text primary key,
  name        text not null,
  description text,
  min_points  integer not null default 0,
  max_points  integer,
  level_order integer not null default 0,
  accent      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Novidades & Updates (notas de versão)
-- -----------------------------------------------------------------------------
create table if not exists public.release_notes (
  id                text primary key,
  version           text,
  title             text not null,
  year              integer,
  month             integer,
  date              text,
  author_name       text,
  author_avatar_url text,
  hero_image_url    text,
  summary           text,
  entries           jsonb not null default '[]'::jsonb,
  published         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Configurações (certificado + pontuação) — linha única
-- -----------------------------------------------------------------------------
create table if not exists public.app_settings (
  id                integer primary key default 1,
  institution_name  text,
  signatory_name    text,
  signatory_role    text,
  base_text         text,
  points_per_lesson integer not null default 0,
  points_per_course integer not null default 0,
  updated_at        timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

-- -----------------------------------------------------------------------------
-- Row Level Security: leitura pública, escrita só pela SERVICE ROLE
-- (usada apenas no servidor). Mesma política da app_content.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'course_categories','courses','lessons','learning_trails','trail_courses',
    'companies','access_roles','members','certificates','maturity_levels',
    'release_notes','app_settings'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;
