import {
  mockApplicationCategories,
  mockModuleCategories,
} from "@/data/mock-track-categories";
import { mockCourses, getCourseLessons } from "@/data/mock-courses";
import { mockCertificates } from "@/data/mock-certificates";
import type {
  AdminCategory,
  AdminCourse,
  AdminLesson,
  Company,
  CompanyMember,
  IssuedCertificate,
  LearningTrail,
  ReleaseNote,
} from "@/types/admin";
import {
  createEmptyState,
  DEFAULT_MATURITY_LEVELS,
  DEFAULT_SETTINGS,
  type AdminState,
} from "./defaults";

/**
 * Estado de DEMONSTRAÇÃO do backoffice (protótipo local). O conteúdo é derivado
 * dos mocks (`@/data/*`), então a gestão local começa refletindo um exemplo
 * realista. Os tipos e defaults de configuração (sem mocks) vivem em
 * `defaults.ts` e são re-exportados aqui por compatibilidade.
 */

export { createEmptyState, DEFAULT_MATURITY_LEVELS, DEFAULT_SETTINGS };
export type { AdminState };

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

const SEED_MEMBERS: CompanyMember[] = [
  {
    id: "mb_001",
    companyId: SEED_COMPANY.id,
    name: "Helena Prado",
    email: "helena.prado@boavista.com.br",
    jobTitle: "Gerente geral",
    status: "active",
    createdAt: "2026-01-15T12:00:00.000Z",
  },
  {
    id: "mb_002",
    companyId: SEED_COMPANY.id,
    name: "Rafael Lima",
    email: "rafael.lima@boavista.com.br",
    jobTitle: "Consultor de vendas",
    status: "active",
    createdAt: "2026-01-16T12:00:00.000Z",
  },
  {
    id: "mb_003",
    companyId: SEED_COMPANY.id,
    name: "Bianca Souza",
    email: "bianca.souza@boavista.com.br",
    jobTitle: "Técnica de laboratório",
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
    members: SEED_MEMBERS,
    accessRequests: [],
    maturityLevels: DEFAULT_MATURITY_LEVELS,
    certificates: seedCertificates(),
    releaseNotes: SEED_RELEASE_NOTES,
    settings: DEFAULT_SETTINGS,
  };
}
