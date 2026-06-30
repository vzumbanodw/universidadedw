"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AccessRequest,
  AdminCategory,
  AdminCourse,
  AdminLesson,
  AdminSettings,
  Company,
  CompanyMember,
  IssuedCertificate,
  MaturityLevel,
  ReleaseNote,
} from "@/types/admin";
import {
  createSeedState,
  DEFAULT_SETTINGS,
  type AdminState,
} from "./seed";

/**
 * Store do backoffice. Lê e grava no conteúdo compartilhado do servidor
 * (`/api/content`), que é a mesma fonte consumida pelo dashboard dos clientes.
 * Assim, tudo que o operador publica reflete para todos os clientes do mesmo
 * servidor. As mutações atualizam o estado local de forma otimista e persistem
 * o documento inteiro via PUT.
 */

const EMPTY_STATE: AdminState = {
  categories: [],
  courses: [],
  lessons: [],
  companies: [],
  members: [],
  accessRequests: [],
  maturityLevels: [],
  certificates: [],
  releaseNotes: [],
  settings: DEFAULT_SETTINGS,
};

type AdminStore = AdminState & {
  ready: boolean;

  // Categorias (Aplicações)
  upsertCategory: (category: AdminCategory) => void;
  deleteCategory: (id: string) => void;

  // Cursos
  upsertCourse: (course: AdminCourse) => void;
  deleteCourse: (id: string) => void;
  lessonsForCourse: (courseId: string) => AdminLesson[];

  // Aulas
  upsertLesson: (lesson: AdminLesson) => void;
  deleteLesson: (id: string) => void;

  // Empresas
  upsertCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;

  // Membros (funcionários)
  addMembers: (members: CompanyMember[]) => void;
  upsertMember: (member: CompanyMember) => void;
  deleteMember: (id: string) => void;
  membersForCompany: (companyId: string) => CompanyMember[];

  // Solicitações de acesso (atualização local; persistência via endpoints)
  upsertAccessRequest: (request: AccessRequest) => void;
  removeAccessRequest: (id: string) => void;

  // Maturidade
  upsertMaturityLevel: (level: MaturityLevel) => void;
  deleteMaturityLevel: (id: string) => void;

  // Certificados
  upsertCertificate: (certificate: IssuedCertificate) => void;
  deleteCertificate: (id: string) => void;

  // Configurações (certificado, pontuação)
  updateSettings: (settings: AdminSettings) => void;

  // Novidades & Updates
  upsertReleaseNote: (note: ReleaseNote) => void;
  deleteReleaseNote: (id: string) => void;

  resetToSeed: () => void;
};

/** Chaves de `AdminState` cujo valor é uma coleção (array) com itens `{ id }`. */
type ArrayKey = {
  [K in keyof AdminState]: AdminState[K] extends unknown[] ? K : never;
}[keyof AdminState];

const AdminStoreContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const loadedRef = useRef(false);

  // Carrega o conteúdo compartilhado do servidor ao montar.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/content", { cache: "no-store" });
        const data = (await res.json()) as AdminState;
        if (active) setState(data);
      } catch {
        /* offline: mantém estado vazio; mutações ainda funcionam em memória */
      } finally {
        if (active) {
          loadedRef.current = true;
          setReady(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persiste o documento inteiro no servidor a cada mudança (após o load).
  useEffect(() => {
    if (!ready || !loadedRef.current) return;
    const controller = new AbortController();
    fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
      signal: controller.signal,
    }).catch(() => {
      /* falha de rede: estado local segue; próxima mutação tenta de novo */
    });
    return () => controller.abort();
  }, [state, ready]);

  const upsert = useCallback(
    <K extends ArrayKey>(key: K, item: AdminState[K][number]) => {
      setState((prev) => {
        const list = prev[key] as { id: string }[];
        const exists = list.some((entry) => entry.id === (item as { id: string }).id);
        const next = exists
          ? list.map((entry) =>
              entry.id === (item as { id: string }).id ? item : entry,
            )
          : [...list, item];
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const remove = useCallback(
    <K extends ArrayKey>(key: K, id: string) => {
      setState((prev) => ({
        ...prev,
        [key]: (prev[key] as { id: string }[]).filter((entry) => entry.id !== id),
      }));
    },
    [],
  );

  const value = useMemo<AdminStore>(
    () => ({
      ...state,
      ready,

      upsertCategory: (category) => upsert("categories", category),
      deleteCategory: (id) => {
        remove("categories", id);
      },

      upsertCourse: (course) => upsert("courses", course),
      deleteCourse: (id) => {
        setState((prev) => ({
          ...prev,
          courses: prev.courses.filter((course) => course.id !== id),
          lessons: prev.lessons.filter((lesson) => lesson.courseId !== id),
        }));
      },
      lessonsForCourse: (courseId) =>
        state.lessons
          .filter((lesson) => lesson.courseId === courseId)
          .sort((a, b) => a.order - b.order),

      upsertLesson: (lesson) => upsert("lessons", lesson),
      deleteLesson: (id) => remove("lessons", id),

      upsertCompany: (company) => upsert("companies", company),
      deleteCompany: (id) => {
        setState((prev) => ({
          ...prev,
          companies: prev.companies.filter((company) => company.id !== id),
          members: prev.members.filter((member) => member.companyId !== id),
        }));
      },

      addMembers: (members) =>
        setState((prev) => ({ ...prev, members: [...prev.members, ...members] })),
      upsertMember: (member) => upsert("members", member),
      deleteMember: (id) => remove("members", id),
      membersForCompany: (companyId) =>
        state.members.filter((member) => member.companyId === companyId),

      upsertAccessRequest: (request) => upsert("accessRequests", request),
      removeAccessRequest: (id) => remove("accessRequests", id),

      upsertMaturityLevel: (level) => upsert("maturityLevels", level),
      deleteMaturityLevel: (id) => remove("maturityLevels", id),

      upsertCertificate: (certificate) => upsert("certificates", certificate),
      deleteCertificate: (id) => remove("certificates", id),

      updateSettings: (settings) => setState((prev) => ({ ...prev, settings })),

      upsertReleaseNote: (note) => upsert("releaseNotes", note),
      deleteReleaseNote: (id) => remove("releaseNotes", id),

      resetToSeed: () => setState(createSeedState()),
    }),
    [state, ready, upsert, remove],
  );

  return (
    <AdminStoreContext.Provider value={value}>
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore(): AdminStore {
  const ctx = useContext(AdminStoreContext);
  if (!ctx) {
    throw new Error("useAdminStore deve ser usado dentro de <AdminStoreProvider>");
  }
  return ctx;
}
