import type { Course, CourseFormat, CourseLessonResource } from "@/types/courses";
import type { LearningLevel } from "@/types/learning";
import type {
  TrackCategory,
  TrackCategoryAccent,
  TrackCategoryIcon,
  TrackCategoryType,
} from "@/types/tracks";

/* -------------------------------------------------------------------------- */
/* Conteúdo: Aplicações / Módulos (categorias)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Categoria autorável. Superset de `TrackCategory` (consumida pelo app do aluno)
 * com os campos de autoria que o aluno não precisa enxergar: descrição longa,
 * imagem de capa e estado de publicação.
 */
export type AdminCategory = TrackCategory & {
  description: string;
  coverImageUrl?: string;
  published: boolean;
};

/* -------------------------------------------------------------------------- */
/* Conteúdo: Cursos e Aulas                                                    */
/* -------------------------------------------------------------------------- */

export type AdminCourse = Course & {
  coverImageUrl?: string;
  promoVideoUrl?: string;
  /** Pontos concedidos ao concluir o curso (gamificação/maturidade). */
  points?: number;
  published: boolean;
};

export type AdminLessonResource = CourseLessonResource & {
  url?: string;
};

export type AdminLesson = {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl?: string;
  contentTitle: string;
  contentBlocks: string[];
  resources: AdminLessonResource[];
  published: boolean;
};

/* -------------------------------------------------------------------------- */
/* Empresas, perfis de acesso e membros                                        */
/* -------------------------------------------------------------------------- */

/**
 * Nível de acesso de um membro dentro da empresa.
 * - company_admin: gerencia a própria empresa e seus usuários
 * - manager: acompanha o progresso da equipe
 * - student: apenas consome o conteúdo liberado
 */
export type AccessLevel = "company_admin" | "manager" | "student";

export const ACCESS_LEVEL_LABEL: Record<AccessLevel, string> = {
  company_admin: "Administrador da empresa",
  manager: "Gestor de equipe",
  student: "Aluno",
};

/**
 * Perfil de acesso ("tipo de funcionário"). Agrupa quais aplicações/módulos e
 * cursos um conjunto de funcionários pode consumir, evitando configurar a
 * liberação pessoa a pessoa.
 */
export type AccessRole = {
  id: string;
  companyId: string;
  name: string;
  description: string;
  level: AccessLevel;
  /** Aplicações/Módulos liberados (ids de AdminCategory). */
  categoryIds: string[];
  /** Cursos avulsos liberados além das categorias (ids de AdminCourse). */
  courseIds: string[];
};

export type MemberStatus = "active" | "invited" | "suspended";

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Ativo",
  invited: "Convidado",
  suspended: "Suspenso",
};

export type CompanyMember = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  jobTitle: string;
  roleId: string;
  status: MemberStatus;
  createdAt: string;
  /** Id do usuário no Supabase Auth, quando o acesso já foi criado. */
  authUserId?: string;
};

export type Company = {
  id: string;
  name: string;
  segment: string;
  cnpj?: string;
  contactName: string;
  contactEmail: string;
  /** Licenças contratadas: base para o controle de ocupação de assentos. */
  seats: number;
  logoUrl?: string;
  createdAt: string;
};

/* -------------------------------------------------------------------------- */
/* Novidades & Updates (notas de versão → futura landing page)                 */
/* -------------------------------------------------------------------------- */

/** Tipo de cada item do changelog (vira a badge colorida da coluna "Tipo"). */
export type ReleaseEntryType = "novidade" | "melhoria" | "correcao" | "seguranca";

export const RELEASE_ENTRY_TYPE_LABEL: Record<ReleaseEntryType, string> = {
  novidade: "Novidade",
  melhoria: "Melhoria",
  correcao: "Correção",
  seguranca: "Segurança",
};

/** Uma linha do changelog: Tipo, Caso, Produto, Descrição e Visualizar. */
export type ReleaseEntry = {
  id: string;
  order: number;
  type: ReleaseEntryType;
  caso: string;
  produto: string;
  description: string;
  /** Link "Visualizar": abre a atualização dentro do sistema. Opcional. */
  viewUrl?: string;
};

/**
 * Nota de atualização publicada. A `version` aparece numa badge à frente do
 * `title`. As notas são organizadas por `year`/`month` na listagem e na futura
 * landing page.
 */
export type ReleaseNote = {
  id: string;
  version: string;
  title: string;
  year: number;
  month: number; // 1-12
  date: string; // ISO (yyyy-mm-dd), data de publicação
  authorName: string;
  authorAvatarUrl?: string;
  heroImageUrl?: string;
  summary?: string;
  entries: ReleaseEntry[];
  published: boolean;
};

/* -------------------------------------------------------------------------- */
/* Trilhas de aprendizagem                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Trilha de aprendizagem: sequência ordenada de cursos com um objetivo de
 * formação. Reaproveita `LearningLevel` e os accents das categorias para manter
 * a identidade visual do app do aluno.
 */
export type LearningTrail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** Público-alvo (ex.: "Equipe de atendimento", "Gestores de loja"). */
  targetAudience: string;
  level: LearningLevel;
  accent: TrackCategoryAccent;
  /** Cursos da trilha, na ordem em que devem ser percorridos. */
  courseIds: string[];
  /** Pontuação total concedida ao concluir a trilha inteira. */
  points: number;
  hasCertificate: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

/* -------------------------------------------------------------------------- */
/* Maturidade do cliente                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Nível de maturidade do cliente. A faixa [minPoints, maxPoints] determina em
 * qual nível o aluno/cliente se encontra a partir da pontuação acumulada.
 * `maxPoints` nulo representa o último nível (sem teto).
 */
export type MaturityLevel = {
  id: string;
  name: string;
  description: string;
  minPoints: number;
  maxPoints: number | null;
  order: number;
  accent: TrackCategoryAccent;
};

/* -------------------------------------------------------------------------- */
/* Certificados emitidos                                                       */
/* -------------------------------------------------------------------------- */

export type IssuedCertificateStatus = "issued" | "in_progress" | "available";

export const CERTIFICATE_STATUS_LABEL: Record<IssuedCertificateStatus, string> = {
  issued: "Emitido",
  in_progress: "Em andamento",
  available: "Disponível",
};

/**
 * Registro de certificado por aluno/curso (ou trilha). Hoje alimentado por
 * mocks/seed; a arquitetura está pronta para gerar o PDF final no futuro
 * (campo `certificateUrl`).
 */
export type IssuedCertificate = {
  id: string;
  studentName: string;
  studentEmail: string;
  companyName?: string;
  /** Origem do certificado: um curso OU uma trilha. */
  courseId?: string;
  courseTitle: string;
  trailId?: string;
  status: IssuedCertificateStatus;
  progress?: number;
  workloadMinutes: number;
  credentialId?: string;
  issuedAt?: string;
  /** URL do PDF gerado. Preparado para emissão futura. */
  certificateUrl?: string;
};

/* -------------------------------------------------------------------------- */
/* Configurações do backoffice (certificado, pontuação)                        */
/* -------------------------------------------------------------------------- */

export type CertificateSettings = {
  institutionName: string;
  signatoryName: string;
  signatoryRole: string;
  /** Texto base impresso no certificado. Suporta o macro {curso}. */
  baseText: string;
};

export type PointsSettings = {
  pointsPerLessonCompletion: number;
  pointsPerCourseCompletion: number;
};

export type AdminSettings = {
  certificate: CertificateSettings;
  points: PointsSettings;
};

/* -------------------------------------------------------------------------- */
/* Re-exports utilitários para os formulários                                  */
/* -------------------------------------------------------------------------- */

export type {
  CourseFormat,
  LearningLevel,
  TrackCategoryAccent,
  TrackCategoryIcon,
  TrackCategoryType,
};
