import {
  mockApplicationCategories,
  mockModuleCategories,
} from "@/data/mock-track-categories";
import { mockCourses, getCourseLessons } from "@/data/mock-courses";
import { mockCertificates } from "@/data/mock-certificates";
import type {
  AccessRole,
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
 * Estado inicial do backoffice. O conteúdo é derivado dos mesmos mocks que o
 * app do aluno já consome, então a gestão começa refletindo exatamente o que
 * está publicado hoje. Empresas/usuários trazem um exemplo realista.
 */

export type AdminState = {
  categories: AdminCategory[];
  courses: AdminCourse[];
  lessons: AdminLesson[];
  trails: LearningTrail[];
  companies: Company[];
  roles: AccessRole[];
  members: CompanyMember[];
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

function seedCategories(): AdminCategory[] {
  return [...mockApplicationCategories, ...mockModuleCategories].map((category) => ({
    ...category,
    description: category.tagline,
    published: true,
  }));
}

function seedCourses(): AdminCourse[] {
  return mockCourses.map((course) => ({
    ...course,
    published: true,
  }));
}

function seedLessons(): AdminLesson[] {
  return mockCourses.flatMap((course) =>
    getCourseLessons(course).map((lesson, index) => ({
      id: lesson.id,
      courseId: course.id,
      order: index + 1,
      title: lesson.title,
      description: lesson.description,
      durationMinutes: lesson.durationMinutes,
      videoUrl: undefined,
      contentTitle: lesson.contentTitle,
      contentBlocks: lesson.contentBlocks,
      resources: lesson.resources.map((resource) => ({ ...resource })),
      published: true,
    })),
  );
}

function seedTrails(): LearningTrail[] {
  const courses = mockCourses;
  const byType = (type: "aplicacao" | "modulo") =>
    courses.filter((c) => c.categoryType === type).map((c) => c.id);

  const appCourses = byType("aplicacao").slice(0, 3);
  const moduleCourses = byType("modulo").slice(0, 3);

  const trails: LearningTrail[] = [];
  if (appCourses.length > 0) {
    trails.push({
      id: "trail_atendimento",
      title: "Trilha de Atendimento e Vendas",
      slug: "atendimento-e-vendas",
      description:
        "Formação completa para a equipe de balcão dominar o atendimento, o CRM e o fechamento de vendas.",
      targetAudience: "Equipe de atendimento e vendas",
      level: "Iniciante",
      accent: "teal",
      courseIds: appCourses,
      points: 300,
      hasCertificate: true,
      published: true,
      createdAt: "2026-02-01T12:00:00.000Z",
      updatedAt: "2026-02-01T12:00:00.000Z",
    });
  }
  if (moduleCourses.length > 0) {
    trails.push({
      id: "trail_gestao",
      title: "Trilha de Gestão da Loja",
      slug: "gestao-da-loja",
      description:
        "Capacita gestores a acompanhar indicadores, finanças e a operação administrativa completa.",
      targetAudience: "Gestores e administradores",
      level: "Intermediário",
      accent: "orange",
      courseIds: moduleCourses,
      points: 450,
      hasCertificate: true,
      published: false,
      createdAt: "2026-02-10T12:00:00.000Z",
      updatedAt: "2026-02-10T12:00:00.000Z",
    });
  }
  return trails;
}

const SEED_COMPANY: Company = {
  id: "co_oticaboavista",
  name: "Óptica Boa Vista",
  segment: "Varejo óptico",
  cnpj: "12.345.678/0001-90",
  contactName: "Helena Prado",
  contactEmail: "helena.prado@boavista.com.br",
  seats: 20,
  createdAt: "2026-01-15T12:00:00.000Z",
};

const SEED_ROLES: AccessRole[] = [
  {
    id: "role_gestao",
    companyId: SEED_COMPANY.id,
    name: "Gestão da loja",
    description: "Gerentes que acompanham indicadores e a operação completa.",
    level: "manager",
    categoryIds: ["app_analytics", "app_crm", "mod_financeiro", "mod_administrativo"],
    courseIds: [],
  },
  {
    id: "role_atendimento",
    companyId: SEED_COMPANY.id,
    name: "Atendimento e vendas",
    description: "Equipe de balcão focada em OptFacil e CRM.",
    level: "student",
    categoryIds: ["app_optfacil", "app_crm"],
    courseIds: [],
  },
  {
    id: "role_laboratorio",
    companyId: SEED_COMPANY.id,
    name: "Laboratório",
    description: "Time de produção e pedidos laboratoriais.",
    level: "student",
    categoryIds: ["app_dilab"],
    courseIds: [],
  },
];

const SEED_MEMBERS: CompanyMember[] = [
  {
    id: "mb_001",
    companyId: SEED_COMPANY.id,
    name: "Helena Prado",
    email: "helena.prado@boavista.com.br",
    jobTitle: "Gerente geral",
    roleId: "role_gestao",
    status: "active",
    createdAt: "2026-01-15T12:00:00.000Z",
  },
  {
    id: "mb_002",
    companyId: SEED_COMPANY.id,
    name: "Rafael Lima",
    email: "rafael.lima@boavista.com.br",
    jobTitle: "Consultor de vendas",
    roleId: "role_atendimento",
    status: "active",
    createdAt: "2026-01-16T12:00:00.000Z",
  },
  {
    id: "mb_003",
    companyId: SEED_COMPANY.id,
    name: "Bianca Souza",
    email: "bianca.souza@boavista.com.br",
    jobTitle: "Técnica de laboratório",
    roleId: "role_laboratorio",
    status: "invited",
    createdAt: "2026-01-16T12:00:00.000Z",
  },
];

const SEED_RELEASE_NOTES: ReleaseNote[] = [
  {
    id: "rn_2026_03_v01",
    version: "01",
    title: "Demais melhorias e correções de bugs",
    year: 2026,
    month: 3,
    date: "2026-03-18",
    authorName: "Victor Zumbano",
    summary:
      "Resumo das principais melhorias e correções entregues nesta versão.",
    published: true,
    entries: [
      {
        id: "re_001",
        order: 1,
        type: "melhoria",
        caso: "WEB-841",
        produto: "CRM (Novo)",
        description:
          "Implementados os macros `{valor_pontos}` e `{valor_credito}` no CRM. Agora é possível personalizar mensagens sobre pontuação e crédito de clientes.",
        viewUrl: "#",
      },
      {
        id: "re_002",
        order: 2,
        type: "melhoria",
        caso: "WEB-2220",
        produto: "Dilab Online (Novo)",
        description:
          "Aprimorada a aplicação de regras de desconto para vouchers de serviço. Lentes e outros itens não abrangidos pelo voucher agora recebem o desconto da regra do cliente.",
      },
      {
        id: "re_003",
        order: 3,
        type: "melhoria",
        caso: "WEB-2176",
        produto: "Dilab Online (Novo)",
        description:
          "O módulo Vendedor Externo foi aprimorado com um totalizador de famílias e um filtro de pesquisa por dias específicos. Isso oferece mais flexibilidade e informações.",
        viewUrl: "#",
      },
      {
        id: "re_004",
        order: 4,
        type: "melhoria",
        caso: "DLP-1314",
        produto: "Optfácil (Delphi)",
        description:
          'O campo "Defeitos Relatados" agora é exibido na primeira via da impressão da Ordem de Serviço de Garantia. Isso garante o registro completo das ocorrências.',
        viewUrl: "#",
      },
      {
        id: "re_005",
        order: 5,
        type: "melhoria",
        caso: "DEVDW-884",
        produto: "Optfácil (Delphi)",
        description:
          "Adicionada ferramenta no módulo Financeiro para travar/destravar transações, permitindo que o crédito do cliente seja direcionado a Ordens de Serviço específicas, evitando liberações indevidas.",
        viewUrl: "#",
      },
    ],
  },
];

/**
 * Certificados emitidos de exemplo. Derivados dos mocks de certificado, mas
 * associados aos membros do seed para que a área de certificados e o perfil do
 * aluno já mostrem dados realistas.
 */
function seedCertificates(): IssuedCertificate[] {
  return mockCertificates.map((cert, index) => {
    const member = SEED_MEMBERS[index % SEED_MEMBERS.length]!;
    const status: IssuedCertificate["status"] =
      cert.status === "issued"
        ? "issued"
        : cert.status === "in_progress"
          ? "in_progress"
          : "available";
    return {
      id: `cert_${member.id}_${index}`,
      studentName: member.name,
      studentEmail: member.email,
      companyName: SEED_COMPANY.name,
      courseTitle: cert.courseTitle,
      status,
      progress: cert.progress,
      workloadMinutes: cert.estimatedMinutes,
      credentialId: cert.credentialId,
      issuedAt: cert.issuedAt,
    };
  });
}

export function createSeedState(): AdminState {
  return {
    categories: seedCategories(),
    courses: seedCourses(),
    lessons: seedLessons(),
    trails: seedTrails(),
    companies: [SEED_COMPANY],
    roles: SEED_ROLES,
    members: SEED_MEMBERS,
    maturityLevels: DEFAULT_MATURITY_LEVELS,
    certificates: seedCertificates(),
    releaseNotes: SEED_RELEASE_NOTES,
    settings: DEFAULT_SETTINGS,
  };
}
