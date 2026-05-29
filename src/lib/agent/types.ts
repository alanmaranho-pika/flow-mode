export type AspectRatio = "16:9" | "9:16";

export interface Scene {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  imagePrompt?: string;
  imageUrl?: string;
  imageStatus?: "idle" | "pending" | "ready" | "error";
  videoUrl?: string;
  videoStatus?: "idle" | "pending" | "ready" | "error";
  castIds?: string[]; // which characters appear in this shot
}

export type AudioKind = "music" | "voiceover" | "sfx" | "silent" | "mixed" | "ai_music";
export interface AudioDirection {
  kind: AudioKind;
  label: string;
  note?: string;
  trackUrl?: string;
  trackStatus?: "idle" | "pending" | "ready" | "error";
  trackSource?: "upload" | "generated";
}
export interface AudioOption {
  id: string;
  kind: AudioKind;
  label: string;
  description?: string;
}

export interface CastMember {
  id: string;
  name: string;
  role: string;
  portraitUrl?: string;
  portraitStatus?: "idle" | "pending" | "ready" | "error";
  portraitPrompt?: string;
  portraitSource?: "upload" | "generated";
}

export interface Reference {
  kind: "url" | "text" | "image";
  value: string;
  label?: string;
}

export interface Vibe {
  presentation: "image_grid" | "swatch_palette" | "keyword_chips";
  options: VibeOption[];
  selected?: string;
}
export interface VibeOption {
  id: string;
  label: string;
  description?: string;
  imagePrompt?: string;
  imageUrl?: string;
  colors?: string[];
  keywords?: string[];
}

export interface VisualProbeOption {
  id: string;
  label: string;
  description?: string;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface Project {
  id: string;
  title?: string;
  description?: string;
  vibe?: Vibe;
  aspect?: AspectRatio;
  references: Reference[];
  cast: CastMember[];
  audio?: AudioDirection;
  scenes: Scene[];
  status: "idle" | "gathering" | "storyboarding" | "rendering" | "done";
}

/** Anything the agent can render in the workspace or chat. */
export type GenUiBlock =
  | { kind: "blank"; id: string; prompt: string }
  | { kind: "ask_visual_probe"; id: string; question: string; options: VisualProbeOption[] }
  | { kind: "ask_vibe"; id: string; vibe: Vibe; question: string }
  | { kind: "ask_aspect_ratio"; id: string; question: string }
  | { kind: "ask_references"; id: string; question: string }
  | { kind: "ask_cast"; id: string; suggested: CastMember[]; question: string }
  | { kind: "ask_audio"; id: string; question: string; options: AudioOption[] }
  | { kind: "storyboard"; id: string; sceneIds: string[] }
  | { kind: "confirm"; id: string; message: string };


export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ephemeral?: boolean;
  createdAt: number;
}

export type TranscriptMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}
