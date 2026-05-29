import { create } from "zustand";
import type {
  AudioDirection,
  CastMember,
  ChatMessage,
  GenUiBlock,
  Project,
  Reference,
  Scene,
  TranscriptMessage,
  Vibe,
} from "./agent/types";

const newId = () => Math.random().toString(36).slice(2, 10);

export interface ActivityEntry {
  id: string;
  message: string;
  kind: "thinking" | "tool" | "image" | "done" | "error";
  at: number;
}

interface State {
  project: Project;
  messages: ChatMessage[];
  transcript: TranscriptMessage[];
  blocks: GenUiBlock[];      // active workspace blocks (most recent shown)
  isAgentThinking: boolean;
  activeTab: "scenes" | "storyboard" | "animation";
  activity: ActivityEntry[];

  // actions
  pushUser: (content: string) => string;
  pushAssistant: (content: string) => string;
  appendAssistantDelta: (id: string, delta: string) => void;
  pruneEphemeral: (id: string) => void;
  setAgentThinking: (v: boolean) => void;
  addBlock: (b: GenUiBlock) => void;
  removeBlock: (id: string) => void;
  setActiveTab: (t: State["activeTab"]) => void;
  logActivity: (message: string, kind?: ActivityEntry["kind"]) => void;

  // project mutations
  setBrief: (title: string, description: string) => void;
  setVibe: (v: Vibe) => void;
  selectVibe: (optionId: string) => void;
  setAspect: (a: "16:9" | "9:16") => void;
  addReference: (r: Reference) => void;
  setCast: (c: CastMember[]) => void;
  updateCastMember: (id: string, patch: Partial<CastMember>) => void;
  removeCastMember: (id: string) => void;
  setAudio: (a: AudioDirection) => void;
  setScenes: (s: Scene[]) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  setStatus: (s: Project["status"]) => void;

  // transcript
  appendToTranscript: (m: TranscriptMessage) => void;
  reset: () => void;
}

const emptyProject = (): Project => ({
  id: newId(),
  references: [],
  cast: [],
  scenes: [],
  status: "idle",
});

export const useStore = create<State>((set) => ({
  project: emptyProject(),
  messages: [],
  transcript: [],
  blocks: [],
  isAgentThinking: false,
  activeTab: "scenes",
  activity: [],

  pushUser: (content) => {
    const id = newId();
    set((s) => ({
      messages: [...s.messages, { id, role: "user", content, ephemeral: true, createdAt: Date.now() }],
      transcript: [...s.transcript, { role: "user", content }],
    }));
    return id;
  },
  pushAssistant: (content) => {
    const id = newId();
    set((s) => ({
      messages: [...s.messages, { id, role: "assistant", content, createdAt: Date.now() }],
    }));
    return id;
  },
  appendAssistantDelta: (id, delta) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m)),
    })),
  pruneEphemeral: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
  setAgentThinking: (v) => set({ isAgentThinking: v }),
  addBlock: (b) => set((s) => ({ blocks: [...s.blocks.filter((x) => x.kind !== b.kind), b] })),
  removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),
  setActiveTab: (t) => set({ activeTab: t }),
  logActivity: (message, kind = "tool") =>
    set((s) => ({
      activity: [...s.activity, { id: newId(), message, kind, at: Date.now() }].slice(-30),
    })),

  setBrief: (title, description) =>
    set((s) => ({ project: { ...s.project, title, description, status: "gathering" } })),
  setVibe: (vibe) => set((s) => ({ project: { ...s.project, vibe } })),
  selectVibe: (optionId) =>
    set((s) => ({
      project: s.project.vibe
        ? { ...s.project, vibe: { ...s.project.vibe, selected: optionId } }
        : s.project,
    })),
  setAspect: (aspect) => set((s) => ({ project: { ...s.project, aspect } })),
  addReference: (r) => set((s) => ({ project: { ...s.project, references: [...s.project.references, r] } })),
  setCast: (cast) =>
    set((s) => {
      // Preserve existing portraits when ids match
      const merged = cast.map((c) => {
        const prev = s.project.cast.find((p) => p.id === c.id || p.name === c.name);
        return prev ? { ...prev, ...c, id: c.id || prev.id } : c;
      });
      const ids = new Set(merged.map((c) => c.id));
      const scenes = s.project.scenes.map((sc) =>
        sc.castIds
          ? { ...sc, castIds: sc.castIds.filter((id) => ids.has(id)) }
          : sc,
      );
      // Invalidate scene images that referenced now-changed cast
      const prevIds = new Set(s.project.cast.map((c) => c.id));
      const changed =
        merged.length !== s.project.cast.length ||
        merged.some((c) => !prevIds.has(c.id));
      const finalScenes = changed
        ? scenes.map((sc) =>
            sc.castIds && sc.castIds.length
              ? { ...sc, imageUrl: undefined, imageStatus: "idle" as const }
              : sc,
          )
        : scenes;
      return { project: { ...s.project, cast: merged, scenes: finalScenes } };
    }),
  updateCastMember: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        cast: s.project.cast.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      },
    })),
  removeCastMember: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        cast: s.project.cast.filter((c) => c.id !== id),
        scenes: s.project.scenes.map((sc) =>
          sc.castIds?.includes(id)
            ? {
                ...sc,
                castIds: sc.castIds.filter((cid) => cid !== id),
                imageUrl: undefined,
                imageStatus: "idle" as const,
              }
            : sc,
        ),
      },
    })),
  setAudio: (audio) => set((s) => ({ project: { ...s.project, audio } })),
  setScenes: (scenes) =>
    set((s) => ({
      project: { ...s.project, scenes, status: "storyboarding" },
      activeTab: "scenes",
    })),
  updateScene: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        scenes: s.project.scenes.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)),
      },
    })),
  setStatus: (status) => set((s) => ({ project: { ...s.project, status } })),

  appendToTranscript: (m) => set((s) => ({ transcript: [...s.transcript, m] })),
  reset: () =>
    set({
      project: emptyProject(),
      messages: [],
      transcript: [],
      blocks: [],
      isAgentThinking: false,
      activeTab: "scenes",
      activity: [],
    }),
}));

export { newId };
