"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, GraduationCap, Lock, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormError } from "@/components/ui/FormError";
import { cn } from "@/lib/utils";
import {
  RATING_MAX,
  RATING_MIN,
  SURVEY_ID,
  SURVEY_QUESTIONS,
  TEXT_MAX,
  ratingTone,
} from "@/lib/satisfaction/survey";

const POSTPONE_KEY = `udw:pesquisa-adiada:${SURVEY_ID}`;
const RATINGS = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, i) => RATING_MIN + i,
);

/** Retorno imediato à nota escolhida — e um convite para detalhar na pergunta 4. */
const RATING_FEEDBACK = {
  low: "Poxa! Conte na última pergunta o que atrapalhou — vamos corrigir.",
  mid: "Dá para melhorar. O que faria diferença para você?",
  high: "Que bom que está fácil! Obrigado pela nota.",
} as const;

/**
 * Pesquisa de Satisfação — primeira coisa que o aluno vê ao entrar no
 * Universidade, até responder. Quem já respondeu nunca mais a vê (decidido no
 * servidor, vale para qualquer dispositivo). "Responder depois" adia só até a
 * próxima vez que a pessoa acessar.
 */
export function SatisfactionSurveyModal({
  pending,
  firstName,
  onSettled,
}: {
  /** O servidor confirmou que esta pessoa ainda não respondeu. */
  pending: boolean;
  firstName?: string;
  /** Chamado quando a pesquisa sai da frente (adiada, respondida ou não aplicável). */
  onSettled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostHelpfulLesson, setMostHelpfulLesson] = useState("");
  const [missingTopic, setMissingTopic] = useState("");
  const [easeRating, setEaseRating] = useState<number | null>(null);
  const [improvement, setImprovement] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let postponed = false;
    try {
      postponed = window.sessionStorage.getItem(POSTPONE_KEY) === "1";
    } catch {
      /* sem storage: exibe normalmente */
    }
    if (pending && !postponed) setOpen(true);
    else onSettled();
    // Decide uma única vez, na entrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
    onSettled();
  }

  function postpone() {
    try {
      window.sessionStorage.setItem(POSTPONE_KEY, "1");
    } catch {
      /* sem storage: volta a aparecer no próximo carregamento */
    }
    close();
  }

  async function submit() {
    if (easeRating === null) {
      setError("Escolha uma nota de 1 a 10 para a navegação.");
      panelRef.current
        ?.querySelector<HTMLButtonElement>('[role="radio"][tabindex="0"]')
        ?.focus();
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mostHelpfulLesson, missingTopic, easeRating, improvement }),
      });
      if (res.status === 401) {
        setError("Sua sessão expirou. Entre novamente para enviar a avaliação.");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Falha de rede. Verifique a conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const answered = [
    mostHelpfulLesson.trim(),
    missingTopic.trim(),
    easeRating !== null,
    improvement.trim(),
  ].filter(Boolean).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pesquisa-titulo"
      onKeyDown={(event) => {
        if (event.key === "Escape") (submitted ? close : postpone)();
      }}
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
    >
      {/* Fundo não fecha ao clicar: evita perder respostas já digitadas. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm animate-fade-in"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[94vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-large bg-background-elevated shadow-elevation-xl outline-none animate-fade-in-up motion-reduce:animate-none sm:rounded-large"
      >
        <SurveyHeader
          firstName={firstName}
          submitted={submitted}
          onClose={submitted ? close : postpone}
        />

        {submitted ? (
          <ThankYou firstName={firstName} onClose={close} />
        ) : (
          <>
            {/* Progresso: quantas das 4 perguntas já têm resposta. */}
            <div className="h-[3px] w-full shrink-0 bg-border-subtle" aria-hidden>
              <div
                className="h-full bg-brand-primary transition-[width] duration-500 ease-out"
                style={{ width: `${(answered / 4) * 100}%` }}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <div className="flex flex-col gap-7">
                <Question
                  number={1}
                  id="pesquisa-q1"
                  label={SURVEY_QUESTIONS.mostHelpfulLesson}
                  done={Boolean(mostHelpfulLesson.trim())}
                >
                  <Input
                    id="pesquisa-q1"
                    value={mostHelpfulLesson}
                    maxLength={TEXT_MAX}
                    onChange={(e) => setMostHelpfulLesson(e.target.value)}
                    placeholder="Ex.: Abertura e fechamento de caixa"
                  />
                </Question>

                <Question
                  number={2}
                  id="pesquisa-q2"
                  label={SURVEY_QUESTIONS.missingTopic}
                  done={Boolean(missingTopic.trim())}
                >
                  <Textarea
                    id="pesquisa-q2"
                    rows={2}
                    value={missingTopic}
                    maxLength={TEXT_MAX}
                    onChange={(e) => setMissingTopic(e.target.value)}
                    placeholder="Um tema, uma rotina, um produto que você gostaria de aprender"
                  />
                </Question>

                <Question
                  number={3}
                  id="pesquisa-q3"
                  label={SURVEY_QUESTIONS.easeRating}
                  done={easeRating !== null}
                  required
                >
                  <RatingScale
                    labelledBy="pesquisa-q3-label"
                    value={easeRating}
                    onChange={(value) => {
                      setEaseRating(value);
                      setError(null);
                    }}
                  />
                </Question>

                <Question
                  number={4}
                  id="pesquisa-q4"
                  label={SURVEY_QUESTIONS.improvement}
                  done={Boolean(improvement.trim())}
                >
                  <Textarea
                    id="pesquisa-q4"
                    rows={3}
                    value={improvement}
                    maxLength={TEXT_MAX}
                    onChange={(e) => setImprovement(e.target.value)}
                    placeholder="Conte para a gente as suas sugestões e ideias"
                  />
                </Question>

                {error ? <FormError message={error} /> : null}
              </div>
            </div>

            <footer className="flex shrink-0 flex-col gap-3 border-t border-border-subtle bg-background-subtle/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-foreground-muted sm:flex-1">
                <Lock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                Sua resposta chega ao time Dataweb com seu nome e empresa.
              </p>
              <div className="flex shrink-0 items-center gap-2.5">
                <Button variant="ghost" onClick={postpone} className="flex-1 sm:flex-none">
                  Responder depois
                </Button>
                <Button
                  onClick={submit}
                  loading={submitting}
                  rightIcon={<Send className="h-4 w-4" />}
                  className="flex-1 sm:flex-none"
                >
                  Enviar avaliação
                </Button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SurveyHeader({
  firstName,
  submitted,
  onClose,
}: {
  firstName?: string;
  submitted: boolean;
  onClose: () => void;
}) {
  return (
    <header className="relative shrink-0 overflow-hidden bg-brand-dark px-5 pb-6 pt-5 text-white sm:px-7 sm:pb-7 sm:pt-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(120%_90%_at_100%_0%,black,transparent_70%)]"
      />
      <GraduationCap
        aria-hidden
        strokeWidth={1.25}
        className="pointer-events-none absolute -right-5 -top-3 h-36 w-36 text-brand-primary/[0.14]"
      />

      <div className="relative flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" aria-hidden />
          Pesquisa de satisfação
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={submitted ? "Fechar" : "Responder depois"}
          className="-mr-1.5 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-regular text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      {!submitted ? (
        <div className="relative mt-4 max-w-[480px]">
          <h2
            id="pesquisa-titulo"
            className="text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]"
          >
            {firstName ? `${firstName}, como` : "Como"} está sendo sua experiência na{" "}
            <span className="bg-gradient-to-r from-brand-primary to-[#5FD3DF] bg-clip-text text-transparent">
              Universidade
            </span>
            ?
          </h2>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/70">
            A Universidade Dataweb foi criada para facilitar a rotina de quem faz
            parte do nosso universo. Sua opinião define as próximas aulas —{" "}
            <strong className="font-semibold text-white">leva menos de 1 minuto</strong>.
          </p>
        </div>
      ) : (
        <h2 id="pesquisa-titulo" className="sr-only">
          Avaliação enviada
        </h2>
      )}
    </header>
  );
}

function Question({
  number,
  id,
  label,
  done,
  required,
  children,
}: {
  number: number;
  id: string;
  label: string;
  done: boolean;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3.5">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold tabular-nums transition-colors duration-300",
          done
            ? "bg-brand-primary text-white"
            : "border border-border-default bg-background-elevated text-foreground-subtitle",
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <label
          id={`${id}-label`}
          htmlFor={id}
          className="text-[15px] font-semibold leading-snug tracking-tight text-foreground-heading"
        >
          {label}
          {required ? (
            <span className="ml-1 text-foreground-error" aria-label="obrigatória">
              *
            </span>
          ) : null}
        </label>
        {children}
      </div>
    </div>
  );
}

/** Escala 1–10 acessível (radiogroup com setas do teclado). */
function RatingScale({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tone = value === null ? null : ratingTone(value);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    const next = Math.min(RATINGS.length - 1, Math.max(0, index + step));
    onChange(RATINGS[next]!);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="grid grid-cols-5 gap-1.5 sm:grid-cols-10"
      >
        {RATINGS.map((rating, index) => {
          const selected = value === rating;
          // Só um item entra no Tab: o selecionado (ou o primeiro).
          const tabbable = value === null ? index === 0 : selected;
          return (
            <button
              key={rating}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${rating} de ${RATING_MAX}`}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => onChange(rating)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "h-11 rounded-regular border text-[15px] font-semibold tabular-nums transition-[background-color,border-color,color,box-shadow,transform] duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
                selected
                  ? "scale-[1.04] border-brand-primary bg-brand-primary text-white shadow-elevation-md"
                  : value !== null && rating < value
                    ? "border-brand-primary/30 bg-brand-primary/[0.08] text-foreground-brand"
                    : "border-border-default bg-background-elevated text-foreground-subtitle hover:border-brand-primary/60 hover:bg-brand-primary/[0.05] hover:text-foreground-heading",
              )}
            >
              {rating}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[12px] text-foreground-muted">
        <span>Muito difícil</span>
        <span>Muito fácil</span>
      </div>
      <p
        aria-live="polite"
        className={cn(
          "min-h-[18px] text-[12.5px] font-medium transition-opacity",
          tone ? "opacity-100" : "opacity-0",
          tone === "high"
            ? "text-foreground-success"
            : tone === "low"
              ? "text-foreground-error"
              : "text-foreground-warning",
        )}
      >
        {tone ? RATING_FEEDBACK[tone] : ""}
      </p>
    </div>
  );
}

function ThankYou({ firstName, onClose }: { firstName?: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pb-8 pt-9 text-center animate-fade-in motion-reduce:animate-none sm:px-10">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/12 text-brand-primary ring-8 ring-brand-primary/[0.06]">
        <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
      </span>
      <h3 className="mt-5 text-[21px] font-semibold tracking-tight text-foreground-heading">
        Obrigado{firstName ? `, ${firstName}` : ""}!
      </h3>
      <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-foreground-subtitle">
        Sua avaliação chegou ao time da Universidade Dataweb e vai ajudar a
        decidir as próximas aulas.
      </p>
      <Button onClick={onClose} className="mt-7 min-w-[200px]">
        Continuar estudando
      </Button>
    </div>
  );
}
