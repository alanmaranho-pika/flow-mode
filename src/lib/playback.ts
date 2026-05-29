import { create } from "zustand";
import { useStore } from "./store";

interface PlaybackState {
  isPlaying: boolean;
  idx: number;
  /** 0..1 progress within current scene */
  progress: number;
  manualOverrideAt: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (idx: number, opts?: { pause?: boolean }) => void;
  _tick: (idx: number, progress: number) => void;
}

export const usePlayback = create<PlaybackState>((set, get) => ({
  isPlaying: false,
  idx: 0,
  progress: 0,
  manualOverrideAt: 0,
  play: () => {
    const scenes = useStore.getState().project.scenes;
    if (!scenes.length) return;
    set((s) => ({ isPlaying: true, idx: s.idx >= scenes.length ? 0 : s.idx }));
    syncAudioToPlayhead();
    startLoop();
  },
  pause: () => {
    set({ isPlaying: false });
    pauseAudio();
  },
  toggle: () => (get().isPlaying ? get().pause() : get().play()),
  seek: (idx, opts) => {
    set({
      idx,
      progress: 0,
      manualOverrideAt: Date.now(),
      isPlaying: opts?.pause ? false : get().isPlaying,
    });
    if (opts?.pause) pauseAudio();
    else syncAudioToPlayhead();
  },
  _tick: (idx, progress) => set({ idx, progress }),
}));

let raf: number | null = null;
let lastT = 0;

// ===== Shared audio element =====
let audioEl: HTMLAudioElement | null = null;
let currentTrackUrl: string | null = null;

function ensureAudio(url: string) {
  if (currentTrackUrl === url && audioEl) return audioEl;
  if (audioEl) {
    audioEl.pause();
    audioEl.src = "";
  }
  audioEl = new Audio(url);
  audioEl.preload = "auto";
  currentTrackUrl = url;
  return audioEl;
}

function elapsedSeconds(): number {
  const { idx, progress } = usePlayback.getState();
  const scenes = useStore.getState().project.scenes;
  let t = 0;
  for (let i = 0; i < idx && i < scenes.length; i++) t += scenes[i].duration || 3;
  const cur = scenes[idx];
  if (cur) t += progress * (cur.duration || 3);
  return t;
}

function syncAudioToPlayhead() {
  const url = useStore.getState().project.audio?.trackUrl;
  if (!url) return;
  const a = ensureAudio(url);
  try {
    a.currentTime = elapsedSeconds();
  } catch {}
  if (usePlayback.getState().isPlaying) {
    a.play().catch(() => {});
  }
}

function pauseAudio() {
  audioEl?.pause();
}

// Auto-pause audio when track changes / project resets
useStore.subscribe((state, prev) => {
  if (state.project.audio?.trackUrl !== prev?.project.audio?.trackUrl) {
    if (audioEl) {
      audioEl.pause();
      audioEl.src = "";
      audioEl = null;
      currentTrackUrl = null;
    }
  }
});

function startLoop() {
  if (raf != null) return;
  lastT = performance.now();
  const step = (t: number) => {
    raf = null;
    const dt = (t - lastT) / 1000;
    lastT = t;
    const pb = usePlayback.getState();
    if (!pb.isPlaying) return;
    const scenes = useStore.getState().project.scenes;
    if (!scenes.length) {
      usePlayback.setState({ isPlaying: false });
      pauseAudio();
      return;
    }
    const current = scenes[pb.idx] ?? scenes[0];
    const dur = Math.max(0.5, current.duration || 3);
    const elapsed = pb.progress * dur + dt;
    if (elapsed >= dur) {
      const nextIdx = pb.idx + 1;
      if (nextIdx >= scenes.length) {
        usePlayback.setState({ isPlaying: false, idx: 0, progress: 0 });
        pauseAudio();
        return;
      }
      usePlayback.getState()._tick(nextIdx, 0);
    } else {
      usePlayback.getState()._tick(pb.idx, elapsed / dur);
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
