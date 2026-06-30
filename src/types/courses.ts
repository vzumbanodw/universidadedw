import type {
  TrackCategoryAccent,
  TrackCategoryType,
} from "@/types/tracks";
import type { LearningLevel, LearningPathStatus } from "@/types/learning";

export type CourseFormat = "Videoaulas" | "Prático" | "Ao vivo" | "Certificação";

export type Course = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categoryType: TrackCategoryType;
  accent: TrackCategoryAccent;
  level: LearningLevel;
  format: CourseFormat;
  estimatedMinutes: number;
  lessonsCount: number;
  progress: number;
  status: LearningPathStatus;
  featured?: boolean;
  certificate?: boolean;
  href: string;
  /** Capa do curso (URL pública no Supabase Storage). */
  coverImageUrl?: string;
};

export type CourseLessonResource = {
  label: string;
  type: "PDF" | "Checklist" | "Exercicio";
};

export type CourseLesson = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  completed: boolean;
  contentTitle: string;
  contentBlocks: string[];
  resources: CourseLessonResource[];
  /** URL do vídeo da aula (YouTube/Vimeo/arquivo). Tocada no player. */
  videoUrl?: string;
};
