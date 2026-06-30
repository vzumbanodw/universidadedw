import type { Course, CourseLesson } from "@/types/courses";

export const mockApplicationCourses: Course[] = [
  {
    id: "course_analytics_01",
    title: "Dashboards executivos no Analytics",
    description:
      "Monte painéis para acompanhar vendas, metas e indicadores críticos da operação.",
    categoryId: "app_analytics",
    categoryName: "Analytics",
    categoryType: "aplicacao",
    accent: "teal",
    level: "Intermediário",
    format: "Prático",
    estimatedMinutes: 96,
    lessonsCount: 9,
    progress: 42,
    status: "in_progress",
    featured: true,
    certificate: true,
    href: "/dashboard/cursos/dashboards-executivos-analytics",
  },
  {
    id: "course_crm_01",
    title: "Funil comercial e oportunidades no CRM",
    description:
      "Organize etapas, acompanhe negociações e crie rotinas comerciais consistentes.",
    categoryId: "app_crm",
    categoryName: "CRM",
    categoryType: "aplicacao",
    accent: "orange",
    level: "Iniciante",
    format: "Videoaulas",
    estimatedMinutes: 74,
    lessonsCount: 8,
    progress: 100,
    status: "completed",
    certificate: true,
    href: "/dashboard/cursos/funil-comercial-crm",
  },
  {
    id: "course_dilab_01",
    title: "Operação de pedidos no Dilab",
    description:
      "Aprenda o fluxo completo de pedidos laboratoriais, acompanhamento e conferência.",
    categoryId: "app_dilab",
    categoryName: "Dilab",
    categoryType: "aplicacao",
    accent: "green",
    level: "Iniciante",
    format: "Prático",
    estimatedMinutes: 88,
    lessonsCount: 10,
    progress: 18,
    status: "in_progress",
    href: "/dashboard/cursos/operacao-pedidos-dilab",
  },
  {
    id: "course_optfacil_01",
    title: "Atendimento e prescrições no OptFacil",
    description:
      "Conduza o atendimento de ponta a ponta, da prescrição até a finalização da venda.",
    categoryId: "app_optfacil",
    categoryName: "OptFacil",
    categoryType: "aplicacao",
    accent: "violet",
    level: "Intermediário",
    format: "Videoaulas",
    estimatedMinutes: 112,
    lessonsCount: 12,
    progress: 0,
    status: "not_started",
    certificate: true,
    href: "/dashboard/cursos/atendimento-prescricoes-optfacil",
  },
  {
    id: "course_pdf_01",
    title: "Templates e automações de PDF",
    description:
      "Crie modelos de documentos, padronize saídas e reduza ajustes manuais.",
    categoryId: "app_pdf",
    categoryName: "PDF",
    categoryType: "aplicacao",
    accent: "red",
    level: "Avançado",
    format: "Certificação",
    estimatedMinutes: 135,
    lessonsCount: 11,
    progress: 0,
    status: "not_started",
    certificate: true,
    href: "/dashboard/cursos/templates-automacoes-pdf",
  },
];

export const mockModuleCourses: Course[] = [
  {
    id: "course_financeiro_01",
    title: "Rotina financeira essencial",
    description:
      "Configure contas, acompanhe fluxo de caixa e mantenha lançamentos em dia.",
    categoryId: "mod_financeiro",
    categoryName: "Financeiro",
    categoryType: "modulo",
    accent: "tertiary",
    level: "Iniciante",
    format: "Videoaulas",
    estimatedMinutes: 82,
    lessonsCount: 8,
    progress: 64,
    status: "in_progress",
    featured: true,
    href: "/dashboard/cursos/rotina-financeira-essencial",
  },
  {
    id: "course_administrativo_01",
    title: "Cadastros e permissões administrativas",
    description:
      "Padronize cadastros, revise permissões e organize processos internos.",
    categoryId: "mod_administrativo",
    categoryName: "Administrativo",
    categoryType: "modulo",
    accent: "navy",
    level: "Intermediário",
    format: "Prático",
    estimatedMinutes: 104,
    lessonsCount: 9,
    progress: 30,
    status: "in_progress",
    certificate: true,
    href: "/dashboard/cursos/cadastros-permissoes-administrativas",
  },
  {
    id: "course_consultor_01",
    title: "Consultor externo em campo",
    description:
      "Prepare visitas, registre propostas e acompanhe clientes com mais previsibilidade.",
    categoryId: "mod_consultor",
    categoryName: "Consultor Externo",
    categoryType: "modulo",
    accent: "info",
    level: "Intermediário",
    format: "Ao vivo",
    estimatedMinutes: 70,
    lessonsCount: 6,
    progress: 0,
    status: "not_started",
    href: "/dashboard/cursos/consultor-externo-campo",
  },
  {
    id: "course_multicrediario_01",
    title: "Cobrança e análise no MultiCrediário",
    description:
      "Aplique critérios de análise, acompanhe cobranças e reduza risco operacional.",
    categoryId: "mod_multicrediario",
    categoryName: "MultiCrediário",
    categoryType: "modulo",
    accent: "orange",
    level: "Avançado",
    format: "Certificação",
    estimatedMinutes: 126,
    lessonsCount: 13,
    progress: 0,
    status: "not_started",
    certificate: true,
    href: "/dashboard/cursos/cobranca-analise-multicrediario",
  },
  {
    id: "course_industria_01",
    title: "Ordens de produção e estoque",
    description:
      "Controle etapas de produção, movimentações e rastreabilidade de itens.",
    categoryId: "mod_industria",
    categoryName: "Indústria",
    categoryType: "modulo",
    accent: "neutral",
    level: "Avançado",
    format: "Prático",
    estimatedMinutes: 148,
    lessonsCount: 14,
    progress: 0,
    status: "not_started",
    href: "/dashboard/cursos/ordens-producao-estoque",
  },
];

export const mockCourses: Course[] = [
  ...mockApplicationCourses,
  ...mockModuleCourses,
];

export function getCourseSlug(course: Course): string {
  return course.href.split("/").filter(Boolean).at(-1)!;
}

export function getCourseBySlug(slug: string): Course | undefined {
  return mockCourses.find((course) => getCourseSlug(course) === slug);
}

const LESSON_TITLES = [
  "Visão geral e objetivos",
  "Preparando o ambiente de trabalho",
  "Fluxo principal na prática",
  "Configurações e ajustes importantes",
  "Rotina operacional recomendada",
  "Análise de resultados",
  "Erros comuns e como evitar",
  "Exercício guiado",
  "Checklist de implantação",
  "Revisão e próximos passos",
  "Cenários avançados",
  "Padronização para equipes",
  "Métricas de acompanhamento",
  "Avaliação final",
];

export function getCourseLessons(course: Course): CourseLesson[] {
  const slug = getCourseSlug(course);
  const completedCount = Math.floor((course.lessonsCount * course.progress) / 100);
  const baseDuration = Math.max(
    6,
    Math.round(course.estimatedMinutes / course.lessonsCount),
  );

  return Array.from({ length: course.lessonsCount }, (_, index) => {
    const number = index + 1;
    const title =
      LESSON_TITLES[index] ?? `Aplicação prática ${number - LESSON_TITLES.length}`;

    return {
      id: `${slug}-aula-${number}`,
      title,
      description:
        number === 1
          ? `Entenda o contexto do curso e como ${course.categoryName} se conecta à rotina da sua equipe.`
          : `Aplique ${course.title.toLowerCase()} em um cenário próximo da operação real.`,
      durationMinutes: baseDuration + (index % 3) * 2,
      completed: index < completedCount,
      contentTitle: `${title} em ${course.categoryName}`,
      contentBlocks: [
        `Nesta aula, você trabalha um recorte prático de ${course.categoryName} com foco em execução, consistência e leitura clara do processo.`,
        `O conteúdo combina demonstração guiada, pontos de atenção e um exercício curto para transformar o aprendizado em ação dentro da plataforma.`,
        `Ao final, revise os materiais de apoio e registre quais ajustes fazem sentido para o seu fluxo atual.`,
      ],
      resources: [
        { label: `Resumo da aula ${number}`, type: "PDF" },
        { label: "Checklist de aplicação", type: "Checklist" },
        { label: "Exercício prático", type: "Exercicio" },
      ],
    };
  });
}
