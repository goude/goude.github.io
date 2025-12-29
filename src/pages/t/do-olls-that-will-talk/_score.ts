// @ts-ignore - CDN import without type declarations
import RegionsPlugin from "https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/plugins/regions.esm.js";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: typeof YT;
  }
}

declare const WaveSurfer: any;
declare const RegionsPlugin: any;
declare const opensheetmusicdisplay: any;

interface YTPlayer {
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
}

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
    playerVars: {
      start: 76,
      rel: 0,
    },
    events: {
      onStateChange: onPlayerStateChange,
    },
  }) as unknown as YTPlayer;

  playerComo = new window.YT.Player("player-como", {
    videoId: "SnunPV-XTbA",
    playerVars: {
      start: 45,
      rel: 0,
    },
    events: {
      onStateChange: onPlayerStateChange,
    },
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
    if (player) {
      if (other) other.pauseVideo();
      player.seekTo(time, true);
      player.playVideo();
    }
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

// Audio markers data structure
interface AudioMarker {
  time: number;
  label: string;
  category: "beat" | "lyric" | "dolls";
}

// Category styling configuration
const categoryStyles: Record<AudioMarker["category"], { color: string }> = {
  beat: { color: "rgba(100, 100, 255, 0.2)" },
  lyric: { color: "rgba(255, 150, 50, 0.3)" },
  dolls: { color: "rgba(255, 50, 50, 0.4)" },
};

// Define your markers here - easy to extend
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

// Initialize WaveSurfer
document.addEventListener("DOMContentLoaded", () => {
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

  // Initialize regions plugin
  const regions = wavesurfer.registerPlugin(RegionsPlugin.create());

  // Add regions when waveform is ready
  wavesurfer.on("ready", () => {
    markers.forEach((marker, index) => {
      const style = categoryStyles[marker.category];

      regions.addRegion({
        start: marker.time,
        end: marker.time + 0.05, // Small width for visibility
        color: style.color,
        content: marker.label,
        resize: false,
        drag: false,
        id: `marker-${index}`,
      });
    });
  });

  // Control buttons
  const playPauseBtn = document.getElementById("play-pause");
  const resetBtn = document.getElementById("reset");

  playPauseBtn?.addEventListener("click", () => {
    wavesurfer.playPause();
  });

  resetBtn?.addEventListener("click", () => {
    wavesurfer.seekTo(0);
    wavesurfer.pause();
  });

  // Update button text based on playback state
  wavesurfer.on("play", () => {
    if (playPauseBtn) playPauseBtn.textContent = "Pause";
  });

  wavesurfer.on("pause", () => {
    if (playPauseBtn) playPauseBtn.textContent = "Play";
  });

  // Optional: Click on region to jump to that position
  regions.on(
    "region-clicked",
    (region: { start: number }, e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      wavesurfer.setTime(region.start);
    }
  );
});

document.addEventListener("DOMContentLoaded", async () => {
  // @ts-ignore - CDN import without type declarations
  const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(
    "osmd-container",
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

  await osmd.load("/files/scores/dolls-that-will-talk-straight.mxl");
  await document.fonts.ready;
  const container = document.getElementById("osmd-container");
  if (container != null) {
    const width = container.clientWidth;
    osmd.Zoom = width < 480 ? 0.5 : 0.75;
    await osmd.render();
    const svg = container.querySelector("svg");
    if (svg != null) {
      svg.querySelectorAll("text").forEach((t) => {
        t.removeAttribute("font-family");
        t.style.fontFamily = "MuseJazzText, sans-serif";
      });
    }
  }
});
