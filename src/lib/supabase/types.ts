/**
 * Tipos do banco para o Supabase.
 *
 * Modela as tabelas planejadas para a Universidade. No futuro, este arquivo
 * pode ser gerado automaticamente pela Supabase CLI:
 *
 *   supabase gen types typescript --project-id <id> --schema public > \
 *     src/lib/supabase/types.ts
 *
 * Por enquanto é mantido à mão, espelhando a modelagem dos services
 * (`src/services/admin/*`) e dos mocks do backoffice, para que a troca do
 * data layer por consultas reais seja apenas uma mudança de implementação.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Linha base com timestamps padrão do Supabase. */
type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type CourseRow = Timestamps & {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  level: string;
  status: "draft" | "published" | "archived";
  estimated_duration: number;
  instructor_name: string | null;
  points: number;
  has_certificate: boolean;
  sort_order: number;
};

export type CourseModuleRow = Timestamps & {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
};

export type LessonRow = Timestamps & {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  lesson_type: "video" | "text" | "material" | "quiz" | "activity";
  video_url: string | null;
  video_provider: "youtube" | "vimeo" | "file" | "embed" | null;
  duration: number;
  content: string | null;
  materials: Json;
  points: number;
  is_required: boolean;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

export type LearningTrailRow = Timestamps & {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  target_audience: string | null;
  level: string;
  status: "draft" | "published" | "archived";
  points: number;
  has_certificate: boolean;
};

export type LearningTrailCourseRow = {
  id: string;
  trail_id: string;
  course_id: string;
  sort_order: number;
  created_at: string;
};

export type StudentRow = Timestamps & {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  role: string | null;
  avatar_url: string | null;
  total_points: number;
  maturity_level_id: string | null;
  last_access_at: string | null;
};

export type StudentCourseProgressRow = {
  id: string;
  student_id: string;
  course_id: string;
  status: "not_started" | "in_progress" | "completed";
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

export type StudentLessonProgressRow = {
  id: string;
  student_id: string;
  lesson_id: string;
  status: "not_started" | "in_progress" | "completed";
  watched_percentage: number;
  completed_at: string | null;
  updated_at: string;
};

export type CertificateRow = {
  id: string;
  student_id: string | null;
  course_id: string | null;
  trail_id: string | null;
  certificate_url: string | null;
  status: "issued" | "in_progress" | "available";
  issued_at: string | null;
  created_at: string;
};

export type PointsEventRow = {
  id: string;
  student_id: string;
  source_type: "lesson" | "course" | "trail" | "manual";
  source_id: string | null;
  points: number;
  description: string | null;
  created_at: string;
};

export type MaturityLevelRow = Timestamps & {
  id: string;
  name: string;
  description: string | null;
  min_points: number;
  max_points: number | null;
  sort_order: number;
};

export type AdminUserRow = Timestamps & {
  id: string;
  email: string;
  name: string | null;
  /** RBAC: papel do operador no backoffice. */
  role: "super_admin" | "admin" | "content_manager" | "viewer";
};

/** Helper para declarar uma tabela com Row/Insert/Update. */
type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

/* -------------------------------------------------------------------------- */
/* Tabela ativa: documento único de conteúdo                                   */
/* -------------------------------------------------------------------------- */

/**
 * Todo o estado do backoffice (`AdminState`) é persistido como um único
 * documento JSONB nesta tabela (linha `id = 1`). É a mesma fonte que o app do
 * aluno lê. Mantém a arquitetura atual de "publicar o documento inteiro" e
 * torna a persistência pronta para multi-instância/serverless.
 *
 * `data` guarda o `AdminState` serializado. Tipado como `Json` aqui; o
 * `store.server.ts` aplica `normalize()` ao ler, garantindo o formato.
 */
export type AppContentRow = {
  id: number;
  data: Json;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      app_content: TableShape<AppContentRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

/*
 * As tabelas normalizadas acima (courses, lessons, students, certificates, …)
 * ficam aqui como REFERÊNCIA do modelo relacional futuro. Quando/se a base for
 * normalizada, mova-as para `Database["public"]["Tables"]` e migre os services
 * de `@/services/admin/*` para consultá-las diretamente.
 */
