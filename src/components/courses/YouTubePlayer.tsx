"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Player de YouTube controlado: sem a barra/botões nativos do YouTube e sem
 * acesso aos links do YouTube. O aluno pode dar play/pause e **voltar** (botão
 * −10s e clique na barra de progresso só para trás) — mas **não pode avançar**
 * além do ponto já assistido. Usa a API IFrame (controls=0) + uma camada que
 * captura o clique, com uma barra de controles própria embaixo.
 */

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type YTPlayerOptions = {
  videoId: string;
  width?: string;
  height?: string;
  playerVars?: Record<string, number>;
  events?: {
    onReady?: () => void;
    onStateChange?: (event: { data: number }) => void;
  };
};

type YTNamespace = {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** Carrega a API IFrame do YouTube uma única vez e resolve quando pronta. */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });

  return apiPromise;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Elemento atualmente em tela cheia (com fallback para Safari/WebKit). */
function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ??
    (document as unknown as { webkitFullscreenElement?: Element })
      .webkitFullscreenElement ??
    null
  );
}

export function YouTubePlayer({ id, title }: { id: string; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current; // container estável durante esta montagem

    loadYouTubeApi().then((YT) => {
      if (cancelled || !host) return;
      const mount = document.createElement("div");
      mount.className = "h-full w-full";
      host.appendChild(mount);

      playerRef.current = new YT.Player(mount, {
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onStateChange: (event) => {
            if (!cancelled) setPlaying(event.data === YT.PlayerState.PLAYING);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // o iframe pode já ter sido removido
      }
      playerRef.current = null;
      if (host) host.innerHTML = "";
    };
  }, [id]);

  // Atualiza tempo/duração para a barra de progresso.
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const d = player.getDuration();
        const c = player.getCurrentTime();
        if (Number.isFinite(d) && d > 0) setDuration(d);
        if (Number.isFinite(c)) setCurrent(c);
      } catch {
        // métodos ainda indisponíveis
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Mantém o estado de tela cheia sincronizado (inclui ESC e botões nativos).
  useEffect(() => {
    function onChange() {
      setFullscreen(Boolean(getFullscreenElement()));
    }
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  function toggle() {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }

  /** Alterna a tela cheia do container do player (com fallback WebKit). */
  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (getFullscreenElement()) {
        const exit =
          document.exitFullscreen ??
          (document as unknown as { webkitExitFullscreen?: () => void })
            .webkitExitFullscreen;
        await exit?.call(document);
      } else {
        const request =
          el.requestFullscreen ??
          (el as unknown as { webkitRequestFullscreen?: () => void })
            .webkitRequestFullscreen;
        await request?.call(el);
      }
    } catch {
      // alguns navegadores bloqueiam fora de um gesto do usuário
    }
  }

  /** Retrocede `seconds` (nunca avança). */
  function rewind(seconds: number) {
    const player = playerRef.current;
    if (!player) return;
    const target = Math.max(0, player.getCurrentTime() - seconds);
    player.seekTo(target, true);
    setCurrent(target);
  }

  /** Clique na barra: só retrocede. Cliques à frente do ponto atual são ignorados. */
  function onSeekBar(event: React.MouseEvent<HTMLDivElement>) {
    const player = playerRef.current;
    if (!player || duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const target = ratio * duration;
    if (target < player.getCurrentTime()) {
      player.seekTo(target, true);
      setCurrent(target);
    }
  }

  const progressPct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div ref={containerRef} className="absolute inset-0 bg-black">
      {/* iframe do YouTube — sem eventos de ponteiro (interação só pela camada) */}
      <div ref={hostRef} className="pointer-events-none h-full w-full" />

      {/* Camada que captura o clique no vídeo: alterna play/pause e bloqueia o YouTube */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar vídeo" : title ? `Reproduzir: ${title}` : "Reproduzir vídeo"}
        className="group absolute inset-0 z-10 flex items-center justify-center outline-none"
      >
        <span
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white shadow-elevation-lg backdrop-blur-sm transition-opacity duration-200",
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100",
          )}
        >
          {playing ? (
            <Pause className="h-7 w-7 fill-current" aria-hidden />
          ) : (
            <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
          )}
        </span>
      </button>

      {/* Barra de controles própria (play/pause, voltar 10s, progresso só-retrocede) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-8">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pausar" : "Reproduzir"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            {playing ? (
              <Pause className="h-4 w-4 fill-current" aria-hidden />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={() => rewind(10)}
            aria-label="Voltar 10 segundos"
            title="Voltar 10 segundos"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-white/90 transition-colors hover:bg-white/15"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            10s
          </button>

          {/* Barra de progresso — clicar só retrocede (não avança) */}
          <div
            role="slider"
            aria-label="Progresso do vídeo (apenas retroceder)"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(current)}
            onClick={onSeekBar}
            className="group/bar relative h-4 flex-1 cursor-pointer"
            title="Clique para voltar"
          >
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-brand-primary"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <span className="shrink-0 text-[11.5px] tabular-nums text-white/85">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            {fullscreen ? (
              <Minimize className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
