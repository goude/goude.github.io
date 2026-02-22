// File: _score.ts

// @ts-expect-error - CDN ESM import without type declarations
import RegionsPlugin from "https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/plugins/regions.esm.js";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: unknown;
  }
}

type WaveSurferInstance = {
  registerPlugin: (plugin: unknown) => unknown;
  on: (event: string, fn: (...args: unknown[]) => void) => void;
  playPause: () => void;
  seekTo: (progress: number) => void;
  pause: () => void;
  setTime: (seconds: number) => void;
};

type WaveSurferStatic = {
  create: (opts: Record<string, unknown>) => WaveSurferInstance;
};

type OSMDInstance = {
  load: (file: string) => Promise<void>;
  render: () => Promise<void>;
  Zoom: number;
};

type OSMDGlobal = {
  OpenSheetMusicDisplay: new (
    id: string,
    opts: Record<string, unknown>
  ) => OSMDInstance;
};

declare const WaveSurfer: WaveSurferStatic;
declare const opensheetmusicdisplay: OSMDGlobal;

interface YTPlayer {
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
}

const $id = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;

const onReady = (fn: () => void | Promise<void>) =>
  document.addEventListener("DOMContentLoaded", () => void fn());

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

if (!isBrowser()) {
  // no-op on server
} else {
  // -------------------------
  // YouTube
  // -------------------------
  let buble: YTPlayer | null = null;
  let como: YTPlayer | null = null;

  const pauseOther = (current: YTPlayer) => {
    if (current === buble) como?.pauseVideo();
    if (current === como) buble?.pauseVideo();
  };

  const playAt = (player: YTPlayer | null, t: number) => {
    if (!player) return;
    pauseOther(player);
    player.seekTo(t, true);
    player.playVideo();
  };

  window.onYouTubeIframeAPIReady = () => {
    const onStateChange = (e: { data: number; target: YTPlayer }) => {
      if (e.data === window.YT.PlayerState.PLAYING) pauseOther(e.target);
    };

    buble = new window.YT.Player("player-buble", {
      videoId: "0bhsXykXxfg",
      playerVars: { start: 76, rel: 0 },
      events: { onStateChange },
    }) as unknown as YTPlayer;

    como = new window.YT.Player("player-como", {
      videoId: "SnunPV-XTbA",
      playerVars: { start: 45, rel: 0 },
      events: { onStateChange },
    }) as unknown as YTPlayer;
  };

  {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }

  onReady(() => {
    const bind = (id: string, fn: (e: MouseEvent) => void) =>
      $id<HTMLAnchorElement>(id)?.addEventListener("click", fn);

    bind("skip-to-como", (e) => {
      e.preventDefault();
      playAt(como, 114);
    });

    bind("play-buble", (e) => {
      e.preventDefault();
      playAt(buble, 76);
    });

    bind("play-fontane", (e) => {
      e.preventDefault();
      playAt(como, 45);
    });
  });

  // -------------------------
  // WaveSurfer + markers
  // -------------------------
  type Category = "beat" | "dolls";

  type AudioMarker = {
    time: number;
    label: string;
    category: Category;
  };

  const categoryColor: Record<Category, string> = {
    beat: "rgba(255, 255, 255, 0.65)",
    dolls: "rgba(255, 0, 0, 0.55)",
  };

  const markers: AudioMarker[] = [
    { time: 0.969, label: "1", category: "beat" },
    { time: 1.482, label: "2", category: "beat" },
    { time: 1.985, label: "3", category: "beat" },
    { time: 2.498, label: "4", category: "beat" },
    { time: 3.011, label: "1", category: "beat" },
    { time: 3.514, label: "2", category: "beat" },
    { time: 4.041, label: "3", category: "beat" },
    { time: 4.616, label: "4", category: "beat" },
    { time: 5.166, label: "1", category: "beat" },
    { time: 5.682, label: "2", category: "beat" },
    { time: 6.196, label: "3", category: "beat" },
    { time: 6.727, label: "4", category: "beat" },
    { time: 4.923, label: "", category: "dolls" },
  ];

  onReady(() => {
    if (!$id("waveform")) return;

    const ws = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#567",
      progressColor: "#223",
      cursorColor: "#ff0000",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 100,
      normalize: true,
      url: "/audio/do-olls-clip.mp4",
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());

    ws.on("ready", () => {
      markers.forEach((m, i) => {
        // regions is untyped (CDN plugin), so we go through unknown.
        (
          regions as { addRegion: (cfg: Record<string, unknown>) => void }
        ).addRegion({
          start: m.time,
          end: m.time + 0.05,
          color: categoryColor[m.category],
          content: m.label,
          resize: false,
          drag: false,
          id: `marker-${i}`,
        });
      });
    });

    const playPause = $id<HTMLButtonElement>("play-pause");
    const reset = $id<HTMLButtonElement>("reset");

    playPause?.addEventListener("click", () => ws.playPause());
    reset?.addEventListener("click", () => {
      ws.seekTo(0);
      ws.pause();
    });

    ws.on("play", () => {
      if (playPause) playPause.textContent = "Pause";
    });
    ws.on("pause", () => {
      if (playPause) playPause.textContent = "Play";
    });

    (
      regions as {
        on: (
          evt: string,
          fn: (r: { start: number }, e: { stopPropagation: () => void }) => void
        ) => void;
      }
    ).on("region-clicked", (r, e) => {
      e.stopPropagation();
      ws.setTime(r.start);
    });
  });

  // -------------------------
  // OSMD (4 variants)
  // -------------------------
  type ScoreSpec = { id: string; file: string };

  const scores: ScoreSpec[] = [
    {
      id: "osmd-container-straight",
      file: "/files/scores/dolls-that-will-talk-straight.mxl",
    },
    {
      id: "osmd-container-triplets",
      file: "/files/scores/dolls-that-will-talk-triplet.mxl",
    },
    {
      id: "osmd-container-eights",
      file: "/files/scores/dolls-that-will-talk-eighth.mxl",
    },
    {
      id: "osmd-container-swing",
      file: "/files/scores/dolls-that-will-talk-swing.mxl",
    },
  ];

  const zoomFor = (w: number) => {
    if (w < 420) return 0.45;
    if (w < 480) return 0.55;
    if (w < 768) return 0.7;
    return 0.85;
  };

  const applySvgFont = (container: HTMLElement) => {
    const svg = container.querySelector("svg");
    if (!svg) return;
    svg.querySelectorAll("text").forEach((t) => {
      t.removeAttribute("font-family");
      t.style.fontFamily = "MuseJazzText, sans-serif";
    });
  };

  const renderScore = async (spec: ScoreSpec) => {
    const container = $id(spec.id);
    if (!container) return;

    const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(spec.id, {
      followCursor: false,
      backend: "svg",
      autoResize: true,
      drawTitle: false,
      drawSubtitle: false,
      drawComposer: false,
      drawLyricist: false,
    });

    await osmd.load(spec.file);
    await document.fonts.ready;

    osmd.Zoom = zoomFor(container.clientWidth || 800);

    await osmd.render();
    applySvgFont(container);
  };

  onReady(async () => {
    if (
      typeof opensheetmusicdisplay === "undefined" ||
      !opensheetmusicdisplay?.OpenSheetMusicDisplay
    ) {
      return;
    }

    for (const spec of scores) {
      await renderScore(spec);
    }
  });
}
