"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Player de YouTube "travado": sem barra de controles, sem botões e sem links
 * clicáveis do YouTube. O vídeo só pode ser pausado/retomado (clique na área) e
 * roda até o fim — não dá para avançar/voltar.
 *
 * Como funciona: usa a API IFrame do YouTube com `controls=0` e cobre o iframe
 * com uma camada que captura o clique. Assim o usuário nunca interage direto com
 * o YouTube (título, "assistir no YouTube", relacionados, teclado), só com o
 * play/pause que controlamos via API.
 */

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
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

export function YouTubePlayer({ id, title }: { id: string; title?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current; // container estável durante esta montagem

    loadYouTubeApi().then((YT) => {
      if (cancelled || !host) return;
      // Cria um elemento interno descartável: a API substitui ESTE nó pelo
      // iframe, mantendo o container (host) estável entre montagens.
      const mount = document.createElement("div");
      mount.className = "h-full w-full";
      host.appendChild(mount);

      playerRef.current = new YT.Player(mount, {
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 0, // sem barra de controles
          modestbranding: 1, // marca mínima
          rel: 0, // não puxa relacionados de outros canais
          fs: 0, // sem botão de tela cheia
          disablekb: 1, // sem atalhos de teclado (seek)
          iv_load_policy: 3, // sem anotações
          playsinline: 1, // inline no mobile
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

  function toggle() {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }

  return (
    <div className="absolute inset-0">
      {/* iframe do YouTube — sem eventos de ponteiro (interação só pela camada) */}
      <div ref={hostRef} className="pointer-events-none h-full w-full" />

      {/* Camada que captura o clique: bloqueia tudo do YouTube e faz play/pause */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar vídeo" : title ? `Reproduzir: ${title}` : "Reproduzir vídeo"}
        className="group absolute inset-0 flex items-center justify-center outline-none"
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
    </div>
  );
}
