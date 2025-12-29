// File: _score.ts

// @ts-ignore - CDN import without type declarations
import RegionsPlugin from "https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/plugins/regions.esm.js";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: typeof YT;
  }
}

declare const WaveSurfer: any;
declare const opensheetmusicdisplay: any;

interface YTPlayer {
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

if (isBrowser()) {
  // -------------------------
  // YouTube players
  // -------------------------
  let playerBuble: YTPlayer | null = null;
  let playerComo: YTPlayer | null = null;

  function onPlayerStateChange(event: { data: number; target: YTPlayer }) {
    // When one video starts playing, pause the other
    if (event.data === window.YT.PlayerState.PLAYING) {
      if (event.target === playerBuble && playerComo) {
        playerComo.pauseVideo();
      } else if (event.target === playerComo && playerBuble) {
        playerBuble.pauseVideo();
      }
    }
  }

  window.onYouTubeIframeAPIReady = function () {
    playerBuble = new window.YT.Player("player-buble", {
      videoId: "0bhsXykXxfg",
      playerVars: { start: 76, rel: 0 },
      events: { onStateChange: onPlayerStateChange },
    }) as unknown as YTPlayer;

    playerComo = new window.YT.Player("player-como", {
      videoId: "SnunPV-XTbA",
      playerVars: { start: 45, rel: 0 },
      events: { onStateChange: onPlayerStateChange },
    }) as unknown as YTPlayer;
  };

  // Load YouTube iframe API
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  // Play links
  document.addEventListener("DOMContentLoaded", () => {
    const skipLink = document.getElementById("skip-to-como");
    const playBuble = document.getElementById("play-buble");
    const playFontane = document.getElementById("play-fontane");
    const playComo = document.getElementById("play-como");
    const playNothing = document.getElementById("play-nothing");

    function playVideo(
      player: YTPlayer | null,
      other: YTPlayer | null,
      time: number
    ) {
      if (!player) return;
      other?.pauseVideo();
      player.seekTo(time, true);
      player.playVideo();
    }

    skipLink?.addEventListener("click", (e) => {
      e.preventDefault();
      playVideo(playerComo, playerBuble, 114);
    });

    playBuble?.addEventListener("click", (e) => {
      e.preventDefault();
      playVideo(playerBuble, playerComo, 76);
    });

    playFontane?.addEventListener("click", (e) => {
      e.preventDefault();
      playVideo(playerComo, playerBuble, 45);
    });

    playComo?.addEventListener("click", (e) => {
      e.preventDefault();
      playVideo(playerComo, playerBuble, 114);
    });

    playNothing?.addEventListener("click", (e) => {
      e.preventDefault();
      playerComo?.pauseVideo();
      playerBuble?.pauseVideo();
    });
  });

  // -------------------------
  // WaveSurfer markers
  // -------------------------
  interface AudioMarker {
    time: number;
    label: string;
    category: "beat" | "lyric" | "dolls";
  }

  const categoryStyles: Record<AudioMarker["category"], { color: string }> = {
    beat: { color: "rgba(100, 100, 255, 0.2)" },
    lyric: { color: "rgba(255, 150, 50, 0.3)" },
    dolls: { color: "rgba(255, 50, 50, 0.4)" },
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

  document.addEventListener("DOMContentLoaded", () => {
    const waveformEl = document.querySelector("#waveform");
    if (!waveformEl) return;

    const wavesurfer = WaveSurfer.create({
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

    const regions = wavesurfer.registerPlugin(RegionsPlugin.create());

    wavesurfer.on("ready", () => {
      markers.forEach((marker, index) => {
        const style = categoryStyles[marker.category];
        regions.addRegion({
          start: marker.time,
          end: marker.time + 0.05,
          color: style.color,
          content: marker.label,
          resize: false,
          drag: false,
          id: `marker-${index}`,
        });
      });
    });

    const playPauseBtn = document.getElementById("play-pause");
    const resetBtn = document.getElementById("reset");

    playPauseBtn?.addEventListener("click", () => wavesurfer.playPause());

    resetBtn?.addEventListener("click", () => {
      wavesurfer.seekTo(0);
      wavesurfer.pause();
    });

    wavesurfer.on("play", () => {
      if (playPauseBtn) playPauseBtn.textContent = "Pause";
    });

    wavesurfer.on("pause", () => {
      if (playPauseBtn) playPauseBtn.textContent = "Play";
    });

    regions.on(
      "region-clicked",
      (region: { start: number }, e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        wavesurfer.setTime(region.start);
      }
    );
  });

  // -------------------------
  // OSMD: render 4 score variants
  // -------------------------
  type ScoreSpec = { containerId: string; file: string; swing: boolean };

  const scores: ScoreSpec[] = [
    {
      containerId: "osmd-container-straight",
      file: "/files/scores/dolls-that-will-talk-straight.mxl",
      swing: false,
    },
    {
      containerId: "osmd-container-triplets",
      file: "/files/scores/dolls-that-will-talk-triplet.mxl",
      swing: false,
    },
    {
      containerId: "osmd-container-eights",
      file: "/files/scores/dolls-that-will-talk-eighth.mxl",
      swing: false,
    },
    {
      containerId: "osmd-container-swing",
      file: "/files/scores/dolls-that-will-talk-swing.mxl",
      swing: true,
    },
  ];

  function computeZoom(width: number): number {
    if (width < 420) return 0.45;
    if (width < 480) return 0.55;
    if (width < 768) return 0.7;
    return 0.85;
  }

  async function renderScore(spec: ScoreSpec): Promise<void> {
    const container = document.getElementById(spec.containerId);
    if (!container) return;

    const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(
      spec.containerId,
      {
        followCursor: false,
        backend: "svg",
        autoResize: true,
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawLyricist: false,
      }
    );

    await osmd.load(spec.file);
    await document.fonts.ready;

    const width = container.clientWidth || 800;
    osmd.Zoom = computeZoom(width);

    await osmd.render();

    const svg = container.querySelector("svg");
    if (spec.swing && svg) {
      svg.querySelectorAll("text").forEach((t) => {
        t.removeAttribute("font-family");
        t.style.fontFamily = "MuseJazzText, sans-serif";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // Only try if OSMD is present
    if (
      typeof opensheetmusicdisplay === "undefined" ||
      !opensheetmusicdisplay?.OpenSheetMusicDisplay
    ) {
      return;
    }

    // Render sequentially (simpler, avoids spiky CPU)
    for (const spec of scores) {
      // eslint-disable-next-line no-await-in-loop
      await renderScore(spec);
    }
  });
}
