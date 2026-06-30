import type {
  AccessRequest,
  AdminCategory,
  AdminCourse,
  AdminLesson,
  AdminSettings,
  Company,
  CompanyMember,
  IssuedCertificate,
  LearningTrail,
  MaturityLevel,
  ReleaseNote,
} from "@/types/admin";

/**
 * Tipos e defaults de CONFIGURAÇÃO da plataforma, sem qualquer dado de
 * demonstração. Este módulo NÃO importa os mocks (`@/data/*`), então pode ser
 * usado com segurança em componentes client sem arrastar conteúdo de exemplo
 * para o bundle de produção. O seed de demonstração vive em `seed.ts`.
 */

export type AdminState = {
  categories: AdminCategory[];
  courses: AdminCourse[];
  lessons: AdminLesson[];
  trails: LearningTrail[];
  companies: Company[];
  members: CompanyMember[];
  accessRequests: AccessRequest[];
  maturityLevels: MaturityLevel[];
  certificates: IssuedCertificate[];
  releaseNotes: ReleaseNote[];
  settings: AdminSettings;
};

/** Configurações padrão de certificado e pontuação. */
export const DEFAULT_SETTINGS: AdminSettings = {
  certificate: {
    institutionName: "Universidade Dataweb",
    signatoryName: "Coordenação Acadêmica",
    signatoryRole: "Educação Dataweb",
    baseText:
      "Certificamos que o aluno concluiu com aproveitamento o curso {curso}, cumprindo a carga horária e as atividades propostas.",
  },
  points: {
    pointsPerLessonCompletion: 10,
    pointsPerCourseCompletion: 100,
  },
};

/** Níveis de maturidade padrão da Universidade. */
export const DEFAULT_MATURITY_LEVELS: MaturityLevel[] = [
  {
    id: "ml_1",
    name: "Introdução",
    description: "Primeiros passos na plataforma e nos produtos Dataweb.",
    minPoints: 0,
    maxPoints: 199,
    order: 1,
    accent: "neutral",
  },
  {
    id: "ml_2",
    name: "Operação básica",
    description: "Domina as rotinas essenciais do dia a dia.",
    minPoints: 200,
    maxPoints: 499,
    order: 2,
    accent: "info",
  },
  {
    id: "ml_3",
    name: "Operação intermediária",
    description: "Usa recursos avançados e apoia a equipe.",
    minPoints: 500,
    maxPoints: 899,
    order: 3,
    accent: "teal",
  },
  {
    id: "ml_4",
    name: "Usuário avançado",
    description: "Explora todo o potencial dos produtos e integrações.",
    minPoints: 900,
    maxPoints: 1399,
    order: 4,
    accent: "orange",
  },
  {
    id: "ml_5",
    name: "Cliente maduro",
    description: "Referência interna, multiplicador de boas práticas.",
    minPoints: 1400,
    maxPoints: null,
    order: 5,
    accent: "green",
  },
];

/**
 * Estado inicial de PRODUÇÃO: ZERO conteúdo de demonstração. Não traz nenhuma
 * categoria, curso, aula, trilha, empresa, membro, certificado ou novidade —
 * tudo isso passa a vir exclusivamente do que o operador cadastra no backoffice
 * (persistido no Supabase real).
 *
 * Mantém apenas a CONFIGURAÇÃO funcional da plataforma — `settings` (textos do
 * certificado, pontuação) e `maturityLevels` (taxonomia de níveis) — porque são
 * defaults necessários para os recursos funcionarem, não dados fake, e ficam
 * editáveis no backoffice.
 */
export function createEmptyState(): AdminState {
  return {
    categories: [],
    courses: [],
    lessons: [],
    trails: [],
    companies: [],
    members: [],
    accessRequests: [],
    maturityLevels: DEFAULT_MATURITY_LEVELS,
    certificates: [],
    releaseNotes: [],
    settings: DEFAULT_SETTINGS,
  };
}
