import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AdminState } from "@/lib/admin/seed";
import type {
  AccessLevel,
  AccessRole,
  AdminCategory,
  AdminCourse,
  AdminLesson,
  AdminLessonResource,
  AdminSettings,
  Company,
  CompanyMember,
  CourseFormat,
  IssuedCertificate,
  IssuedCertificateStatus,
  LearningLevel,
  LearningTrail,
  MaturityLevel,
  MemberStatus,
  ReleaseEntry,
  ReleaseNote,
  TrackCategoryAccent,
  TrackCategoryIcon,
  TrackCategoryType,
} from "@/types/admin";
import type { LearningPathStatus } from "@/types/learning";

/**
 * Camada de dados relacional (Supabase). Lê/grava o `AdminState` em tabelas
 * normalizadas — uma por entidade. O resto do app continua falando apenas com
 * `readContent`/`writeContent` (em `store.server.ts`).
 *
 * A escrita é um "replace" do documento inteiro: cada tabela é limpa e
 * reinserida a partir do estado atual. Como há um único operador publicando e o
 * volume é pequeno, isso é simples e robusto (sem diffs). `sort_order` preserva
 * a ordem original dos arrays.
 */

type Row = Record<string, any>;

/** Lançado quando as tabelas normalizadas ainda não existem (pré-migração). */
export class TablesMissing extends Error {
  constructor() {
    super("Tabelas normalizadas ausentes");
    this.name = "TablesMissing";
  }
}

function db(): SupabaseClient {
  return createSupabaseServiceClient() as unknown as SupabaseClient;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|schema cache|could not find the table/i.test(msg)
  );
}

const und = <T>(v: T | null | undefined): T | undefined =>
  v === null || v === undefined ? undefined : v;
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/* -------------------------------------------------------------------------- */
/* Leitura                                                                     */
/* -------------------------------------------------------------------------- */

async function fetchTable(table: string, order: string[]): Promise<Row[]> {
  let query = db().from(table).select("*");
  for (const col of order) query = query.order(col, { ascending: true });
  const { data, error } = await query;
  if (error) {
    if (isMissingTable(error)) throw new TablesMissing();
    throw new Error(`[content] erro lendo ${table}: ${error.message}`);
  }
  return (data as Row[]) ?? [];
}

/**
 * Reconstrói o `AdminState` a partir das tabelas. Retorna `null` quando o banco
 * está vazio (sem a linha de configurações), sinalizando que falta o seed.
 * Lança `TablesMissing` se as tabelas ainda não foram criadas.
 */
export async function readStateFromSupabase(): Promise<AdminState | null> {
  const [
    cats,
    courses,
    lessons,
    trails,
    trailCourses,
    companies,
    roles,
    members,
    certs,
    maturity,
    notes,
    settingsRows,
  ] = await Promise.all([
    fetchTable("course_categories", ["sort_order"]),
    fetchTable("courses", ["sort_order"]),
    fetchTable("lessons", ["course_id", "lesson_order"]),
    fetchTable("learning_trails", ["sort_order"]),
    fetchTable("trail_courses", ["trail_id", "sort_order"]),
    fetchTable("companies", ["sort_order"]),
    fetchTable("access_roles", ["sort_order"]),
    fetchTable("members", ["sort_order"]),
    fetchTable("certificates", ["sort_order"]),
    fetchTable("maturity_levels", ["level_order"]),
    fetchTable("release_notes", ["sort_order"]),
    fetchTable("app_settings", ["id"]),
  ]);

  const settingsRow = settingsRows[0];
  if (!settingsRow) return null; // banco ainda não seedado

  const courseIdsByTrail = new Map<string, string[]>();
  for (const tc of trailCourses) {
    const list = courseIdsByTrail.get(tc.trail_id) ?? [];
    list.push(tc.course_id);
    courseIdsByTrail.set(tc.trail_id, list);
  }

  return {
    categories: cats.map(fromCategoryRow),
    courses: courses.map(fromCourseRow),
    lessons: lessons.map(fromLessonRow),
    trails: trails.map((t) => fromTrailRow(t, courseIdsByTrail.get(t.id) ?? [])),
    companies: companies.map(fromCompanyRow),
    roles: roles.map(fromRoleRow),
    members: members.map(fromMemberRow),
    maturityLevels: maturity.map(fromMaturityRow),
    certificates: certs.map(fromCertificateRow),
    releaseNotes: notes.map(fromReleaseNoteRow),
    settings: fromSettingsRow(settingsRow),
  };
}

/* -------------------------------------------------------------------------- */
/* Escrita (replace do documento inteiro)                                      */
/* -------------------------------------------------------------------------- */

async function replaceTable(table: string, rows: Row[]): Promise<void> {
  const del = await db().from(table).delete().not("id", "is", null);
  if (del.error) {
    if (isMissingTable(del.error)) throw new TablesMissing();
    throw new Error(`[content] erro limpando ${table}: ${del.error.message}`);
  }
  if (rows.length > 0) {
    const ins = await db().from(table).insert(rows);
    if (ins.error) {
      if (isMissingTable(ins.error)) throw new TablesMissing();
      throw new Error(`[content] erro gravando ${table}: ${ins.error.message}`);
    }
  }
}

export async function writeStateToSupabase(state: AdminState): Promise<void> {
  await Promise.all([
    replaceTable("course_categories", state.categories.map(toCategoryRow)),
    replaceTable("courses", state.courses.map(toCourseRow)),
    replaceTable("lessons", state.lessons.map(toLessonRow)),
    replaceTable("learning_trails", state.trails.map(toTrailRow)),
    replaceTable("trail_courses", buildTrailCourses(state.trails)),
    replaceTable("companies", state.companies.map(toCompanyRow)),
    replaceTable("access_roles", state.roles.map(toRoleRow)),
    replaceTable("members", state.members.map(toMemberRow)),
    replaceTable("certificates", state.certificates.map(toCertificateRow)),
    replaceTable("maturity_levels", state.maturityLevels.map(toMaturityRow)),
    replaceTable("release_notes", state.releaseNotes.map(toReleaseNoteRow)),
    replaceTable("app_settings", [toSettingsRow(state.settings)]),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Mappers: categorias                                                         */
/* -------------------------------------------------------------------------- */

function fromCategoryRow(r: Row): AdminCategory {
  return {
    id: r.id,
    type: r.type as TrackCategoryType,
    name: r.name,
    tagline: str(r.tagline),
    iconKey: r.icon_key as TrackCategoryIcon,
    accent: r.accent as TrackCategoryAccent,
    trackCount: r.track_count ?? 0,
    lessonCount: r.lesson_count ?? 0,
    inProgress: r.in_progress ?? 0,
    completed: r.completed ?? 0,
    progressPct: Number(r.progress_pct ?? 0),
    href: str(r.href),
    description: str(r.description),
    coverImageUrl: und(r.cover_image_url),
    published: Boolean(r.published),
  };
}

function toCategoryRow(c: AdminCategory, i: number): Row {
  return {
    id: c.id,
    type: c.type,
    name: c.name,
    tagline: c.tagline,
    icon_key: c.iconKey,
    accent: c.accent,
    track_count: c.trackCount,
    lesson_count: c.lessonCount,
    in_progress: c.inProgress,
    completed: c.completed,
    progress_pct: c.progressPct,
    href: c.href,
    description: c.description,
    cover_image_url: c.coverImageUrl ?? null,
    published: c.published,
    sort_order: i,
  };
}

/* -------------------------------------------------------------------------- */
/* Mappers: cursos                                                             */
/* -------------------------------------------------------------------------- */

function fromCourseRow(r: Row): AdminCourse {
  return {
    id: r.id,
    title: r.title,
    description: str(r.description),
    categoryId: str(r.category_id),
    categoryName: str(r.category_name),
    categoryType: r.category_type as TrackCategoryType,
    accent: r.accent as TrackCategoryAccent,
    level: r.level as LearningLevel,
    format: r.format as CourseFormat,
    estimatedMinutes: r.estimated_minutes ?? 0,
    lessonsCount: r.lessons_count ?? 0,
    progress: r.progress ?? 0,
    status: r.status as LearningPathStatus,
    featured: Boolean(r.featured),
    certificate: Boolean(r.certificate),
    href: str(r.href),
    coverImageUrl: und(r.cover_image_url),
    promoVideoUrl: und(r.promo_video_url),
    points: r.points ?? 0,
    published: Boolean(r.published),
  };
}

function toCourseRow(c: AdminCourse, i: number): Row {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category_id: c.categoryId,
    category_name: c.categoryName,
    category_type: c.categoryType,
    accent: c.accent,
    level: c.level,
    format: c.format,
    estimated_minutes: c.estimatedMinutes,
    lessons_count: c.lessonsCount,
    progress: c.progress,
    status: c.status,
    featured: Boolean(c.featured),
    certificate: Boolean(c.certificate),
    href: c.href,
    cover_image_url: c.coverImageUrl ?? null,
    promo_video_url: c.promoVideoUrl ?? null,
    points: c.points ?? 0,
    published: c.published,
    sort_order: i,
  };
}

/* -------------------------------------------------------------------------- */
/* Mappers: aulas                                                              */
/* -------------------------------------------------------------------------- */

function fromLessonRow(r: Row): AdminLesson {
  return {
    id: r.id,
    courseId: str(r.course_id),
    order: r.lesson_order ?? 0,
    title: r.title,
    description: str(r.description),
    durationMinutes: r.duration_minutes ?? 0,
    videoUrl: und(r.video_url),
    contentTitle: str(r.content_title),
    contentBlocks: arr<string>(r.content_blocks),
    resources: arr<AdminLessonResource>(r.resources),
    published: Boolean(r.published),
  };
}

function toLessonRow(l: AdminLesson): Row {
  return {
    id: l.id,
    course_id: l.courseId,
    lesson_order: l.order,
    title: l.title,
    description: l.description,
    duration_minutes: l.durationMinutes,
    video_url: l.videoUrl ?? null,
    content_title: l.contentTitle,
    content_blocks: l.contentBlocks,
    resources: l.resources,
    published: l.published,
  };
}

/* -------------------------------------------------------------------------- */
/* Mappers: trilhas                                                            */
/* -------------------------------------------------------------------------- */

function fromTrailRow(r: Row, courseIds: string[]): LearningTrail {
  return {
    id: r.id,
    title: r.title,
    slug: str(r.slug),
    description: str(r.description),
    targetAudience: str(r.target_audience),
    level: r.level as LearningLevel,
    accent: r.accent as TrackCategoryAccent,
    courseIds,
    points: r.points ?? 0,
    hasCertificate: Boolean(r.has_certificate),
    published: Boolean(r.published),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  };
}

function toTrailRow(t: LearningTrail, i: number): Row {
  return {
    id: t.id,
    title: t.title,
    slug: t.slug,
    description: t.description,
    target_audience: t.targetAudience,
    level: t.level,
    accent: t.accent,
    points: t.points,
    has_certificate: t.hasCertificate,
    published: t.published,
    sort_order: i,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

function buildTrailCourses(trails: LearningTrail[]): Row[] {
  return trails.flatMap((t) =>
    t.courseIds.map((courseId, index) => ({
      trail_id: t.id,
      course_id: courseId,
      sort_order: index,
    })),
  );
}

/* -------------------------------------------------------------------------- */
/* Mappers: empresas, perfis, membros                                          */
/* -------------------------------------------------------------------------- */

function fromCompanyRow(r: Row): Company {
  return {
    id: r.id,
    name: r.name,
    segment: str(r.segment),
    cnpj: und(r.cnpj),
    contactName: str(r.contact_name),
    contactEmail: str(r.contact_email),
    seats: r.seats ?? 0,
    logoUrl: und(r.logo_url),
    createdAt: str(r.created_at),
  };
}

function toCompanyRow(c: Company, i: number): Row {
  return {
    id: c.id,
    name: c.name,
    segment: c.segment,
    cnpj: c.cnpj ?? null,
    contact_name: c.contactName,
    contact_email: c.contactEmail,
    seats: c.seats,
    logo_url: c.logoUrl ?? null,
    sort_order: i,
    created_at: c.createdAt,
  };
}

function fromRoleRow(r: Row): AccessRole {
  return {
    id: r.id,
    companyId: str(r.company_id),
    name: r.name,
    description: str(r.description),
    level: r.level as AccessLevel,
    categoryIds: arr<string>(r.category_ids),
    courseIds: arr<string>(r.course_ids),
  };
}

function toRoleRow(role: AccessRole, i: number): Row {
  return {
    id: role.id,
    company_id: role.companyId,
    name: role.name,
    description: role.description,
    level: role.level,
    category_ids: role.categoryIds,
    course_ids: role.courseIds,
    sort_order: i,
  };
}

function fromMemberRow(r: Row): CompanyMember {
  return {
    id: r.id,
    companyId: str(r.company_id),
    name: r.name,
    email: r.email,
    jobTitle: str(r.job_title),
    roleId: str(r.role_id),
    status: r.status as MemberStatus,
    createdAt: str(r.created_at),
    authUserId: und(r.auth_user_id),
  };
}

function toMemberRow(m: CompanyMember, i: number): Row {
  return {
    id: m.id,
    company_id: m.companyId,
    name: m.name,
    email: m.email,
    job_title: m.jobTitle,
    role_id: m.roleId,
    status: m.status,
    auth_user_id: m.authUserId ?? null,
    sort_order: i,
    created_at: m.createdAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Mappers: certificados, maturidade, novidades, settings                      */
/* -------------------------------------------------------------------------- */

function fromCertificateRow(r: Row): IssuedCertificate {
  return {
    id: r.id,
    studentName: r.student_name,
    studentEmail: r.student_email,
    companyName: und(r.company_name),
    courseId: und(r.course_id),
    courseTitle: str(r.course_title),
    trailId: und(r.trail_id),
    status: r.status as IssuedCertificateStatus,
    progress: r.progress ?? undefined,
    workloadMinutes: r.workload_minutes ?? 0,
    credentialId: und(r.credential_id),
    issuedAt: und(r.issued_at),
    certificateUrl: und(r.certificate_url),
  };
}

function toCertificateRow(c: IssuedCertificate, i: number): Row {
  return {
    id: c.id,
    student_name: c.studentName,
    student_email: c.studentEmail,
    company_name: c.companyName ?? null,
    course_id: c.courseId ?? null,
    course_title: c.courseTitle,
    trail_id: c.trailId ?? null,
    status: c.status,
    progress: c.progress ?? null,
    workload_minutes: c.workloadMinutes,
    credential_id: c.credentialId ?? null,
    issued_at: c.issuedAt ?? null,
    certificate_url: c.certificateUrl ?? null,
    sort_order: i,
  };
}

function fromMaturityRow(r: Row): MaturityLevel {
  return {
    id: r.id,
    name: r.name,
    description: str(r.description),
    minPoints: r.min_points ?? 0,
    maxPoints: r.max_points === null || r.max_points === undefined ? null : r.max_points,
    order: r.level_order ?? 0,
    accent: r.accent as TrackCategoryAccent,
  };
}

function toMaturityRow(m: MaturityLevel): Row {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    min_points: m.minPoints,
    max_points: m.maxPoints,
    level_order: m.order,
    accent: m.accent,
  };
}

function fromReleaseNoteRow(r: Row): ReleaseNote {
  return {
    id: r.id,
    version: str(r.version),
    title: r.title,
    year: r.year ?? 0,
    month: r.month ?? 0,
    date: str(r.date),
    authorName: str(r.author_name),
    authorAvatarUrl: und(r.author_avatar_url),
    heroImageUrl: und(r.hero_image_url),
    summary: und(r.summary),
    entries: arr<ReleaseEntry>(r.entries),
    published: Boolean(r.published),
  };
}

function toReleaseNoteRow(n: ReleaseNote, i: number): Row {
  return {
    id: n.id,
    version: n.version,
    title: n.title,
    year: n.year,
    month: n.month,
    date: n.date,
    author_name: n.authorName,
    author_avatar_url: n.authorAvatarUrl ?? null,
    hero_image_url: n.heroImageUrl ?? null,
    summary: n.summary ?? null,
    entries: n.entries,
    published: n.published,
    sort_order: i,
  };
}

function fromSettingsRow(r: Row): AdminSettings {
  return {
    certificate: {
      institutionName: str(r.institution_name),
      signatoryName: str(r.signatory_name),
      signatoryRole: str(r.signatory_role),
      baseText: str(r.base_text),
    },
    points: {
      pointsPerLessonCompletion: r.points_per_lesson ?? 0,
      pointsPerCourseCompletion: r.points_per_course ?? 0,
    },
  };
}

function toSettingsRow(s: AdminSettings): Row {
  return {
    id: 1,
    institution_name: s.certificate.institutionName,
    signatory_name: s.certificate.signatoryName,
    signatory_role: s.certificate.signatoryRole,
    base_text: s.certificate.baseText,
    points_per_lesson: s.points.pointsPerLessonCompletion,
    points_per_course: s.points.pointsPerCourseCompletion,
  };
}
