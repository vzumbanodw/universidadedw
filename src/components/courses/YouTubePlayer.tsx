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
  // Qualidade (best-effort — APIs legadas; o YouTube pode ignorar).
  setPlaybackQuality?: (quality: string) => void;
  getAvailableQualityLevels?: () => string[];
};

type YTPlayerOptions = {
  videoId: string;
  width?: string;
  height?: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onPlaybackQualityChange?: (event: { target: YTPlayer }) => void;
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

/**
 * Força a maior qualidade disponível. Best-effort: as APIs de qualidade do
 * YouTube são legadas e o player pode reajustar sozinho por banda/tamanho — o
 * maior ganho real vem de renderizar o player grande (fazemos isso via 1080p +
 * tela cheia).
 */
function forceHighestQuality(player: YTPlayer): void {
  try {
    const levels = player.getAvailableQualityLevels?.() ?? [];
    const best = levels.find((level) => level !== "auto");
    player.setPlaybackQuality?.(best ?? "hd1080");
  } catch {
    // ignora — API indisponível/ignorada
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Tamanho físico do player (o YouTube escolhe a qualidade pelo tamanho real). */
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

export function YouTubePlayer({
  id,
  title,
  onEnded,
  onProgress,
  onPause,
  startSeconds,
}: {
  id: string;
  title?: string;
  onEnded?: () => void;
  /** Posição/duração atuais (segundos), ~4x por segundo. */
  onProgress?: (seconds: number, duration: number) => void;
  /** Disparado ao pausar (bom momento para salvar a posição). */
  onPause?: (seconds: number, duration: number) => void;
  /** Posição inicial (segundos) para retomar de onde parou. */
  startSeconds?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  const onPauseRef = useRef(onPause);
  onEndedRef.current = onEnded;
  onProgressRef.current = onProgress;
  onPauseRef.current = onPause;
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(0);
  const resumedRef = useRef(false);

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
        // O iframe preenche o host (renderizado em 1920x1080 e escalado via CSS).
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
          vq: "hd1080",
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            forceHighestQuality(event.target);
            setReady(true);
          },
          onPlaybackQualityChange: (event) => {
            if (!cancelled) forceHighestQuality(event.target);
          },
          onStateChange: (event) => {
            if (cancelled) return;
            const isPlaying = event.data === YT.PlayerState.PLAYING;
            setPlaying(isPlaying);
            if (isPlaying) forceHighestQuality(event.target);
            if (event.data === YT.PlayerState.PAUSED) {
              try {
                onPauseRef.current?.(
                  event.target.getCurrentTime(),
                  event.target.getDuration(),
                );
              } catch {
                // métodos ainda indisponíveis
              }
            }
            if (event.data === YT.PlayerState.ENDED) onEndedRef.current?.();
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

  // Mantém o estado de tela cheia sincronizado.
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // MÁXIMA QUALIDADE: o player é renderizado fisicamente em 1920x1080 e escalado
  // para caber no espaço. Como o YouTube define a qualidade pelo tamanho REAL do
  // player, ele passa a servir a maior resolução (até 1080p; em tela cheia, mais).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (w > 0 && h > 0) {
        setScale(Math.min(w / BASE_WIDTH, h / BASE_HEIGHT));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    // Alguns navegadores não disparam o ResizeObserver ao (des)entrar em tela cheia.
    document.addEventListener("fullscreenchange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", update);
    };
  }, []);

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
        if (Number.isFinite(c) && Number.isFinite(d) && d > 0) {
          onProgressRef.current?.(c, d);
        }
      } catch {
        // métodos ainda indisponíveis
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Retoma de onde parou. Roda quando o player fica pronto e/ou quando a posição
  // salva chega (pode chegar após a montagem, vinda do localStorage).
  useEffect(() => {
    if (!ready || resumedRef.current) return;
    const seconds = startSeconds ?? 0;
    if (seconds > 1) {
      try {
        playerRef.current?.seekTo(seconds, true);
        setCurrent(seconds);
      } catch {
        // player ainda não aceita seek
      }
      resumedRef.current = true;
    }
  }, [ready, startSeconds]);

  function toggle() {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
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

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      rootRef.current?.requestFullscreen().catch(() => {});
    }
  }

  const progressPct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-black">
      {/* Player renderizado em 1920x1080 e escalado para caber (máxima qualidade).
          Sem eventos de ponteiro — a interação é pela camada de controles. */}
      <div
        ref={hostRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
        className="pointer-events-none [&_iframe]:h-full [&_iframe]:w-full"
      />

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
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            {isFullscreen ? (
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
