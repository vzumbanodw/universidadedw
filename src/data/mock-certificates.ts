import type { Certificate } from "@/types/certificates";

export const mockCertificates: Certificate[] = [
  {
    id: "cert_001",
    title: "Certificado em CRM Comercial",
    description:
      "Comprova domínio do funil comercial, oportunidades e rotinas de relacionamento no CRM.",
    courseTitle: "Funil comercial e oportunidades no CRM",
    status: "issued",
    issuedAt: "2026-04-12",
    credentialId: "DW-CRM-2026-001",
    estimatedMinutes: 74,
    skills: ["Funil comercial", "Oportunidades", "Rotina de vendas"],
  },
  {
    id: "cert_002",
    title: "Certificação de Administrador",
    description:
      "Valida competências em cadastros, permissões e padronização de processos administrativos.",
    courseTitle: "Cadastros e permissões administrativas",
    status: "in_progress",
    progress: 80,
    estimatedMinutes: 104,
    skills: ["Permissões", "Cadastros", "Governança"],
  },
  {
    id: "cert_003",
    title: "Certificado em Relatórios",
    description:
      "Reconhece a capacidade de montar relatórios e dashboards para acompanhamento da operação.",
    courseTitle: "Dashboards executivos no Analytics",
    status: "available",
    progress: 0,
    estimatedMinutes: 96,
    skills: ["Dashboards", "Indicadores", "Análise operacional"],
  },
];
