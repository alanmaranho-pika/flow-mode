import { useStore, newId } from "@/lib/store";
import type { TranscriptMessage } from "@/lib/agent/types";
import { toast } from "sonner";

type ToolAcc = { id: string; name: string; argText: string };

class ToastedApiError extends Error {}

let lastImageErrorToastAt = 0;

const TOOL_LABEL: Record<string, string> = {
  set_brief: "noting the brief",
  ask_visual_probe: "asking a visual question",
  ask_vibe: "asking about the vibe",
  ask_aspect_ratio: "asking aspect ratio",
  ask_references: "asking for references",
  ask_cast: "confirming the subject",
  ask_audio: "asking about audio",
  build_storyboard: "building storyboard",
  confirm: "wrapping up",
};

export async function runAgent() {
  const s = useStore.getState();
  s.setAgentThinking(true);
  s.logActivity("thinking…", "thinking");

  try {
    const transcript: TranscriptMessage[] = s.transcript;
    const projectState = sanitizeProject(s.project);

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, projectState }),
    });

    if (!res.ok) {
      await toastApiError(res, "agent");
      throw new ToastedApiError(`Agent failed: ${res.status}`);
    }

    if (!res.body) {
      throw new Error("Agent failed: empty response body");
    }

    let assistantId: string | null = null;
    let textBuffer = "";
    const toolAccs = new Map<number, ToolAcc>();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let done = false;

    while (!done) {
      const { value, done: d } = await reader.read();
      if (d) break;
      buf += decoder.decode(value, { stream: true });

      let i: number;
      while ((i = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") { done = true; break; }

        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (typeof delta.content === "string" && delta.content) {
            if (!assistantId) assistantId = useStore.getState().pushAssistant("");
            useStore.getState().appendAssistantDelta(assistantId, delta.content);
            textBuffer += delta.content;
          }

          if (Array.isArray(delta.tool_calls)) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              const acc = toolAccs.get(idx) ?? { id: "", name: "", argText: "" };
              if (tc.id) acc.id = tc.id;
              if (tc.function?.name) acc.name = tc.function.name;
              if (tc.function?.arguments) acc.argText += tc.function.arguments;
              toolAccs.set(idx, acc);
            }
          }
        } catch {
          buf = line + "\n" + buf;
          break;
        }
      }
    }

    const allToolCalls = Array.from(toolAccs.values())
      .filter((t) => t.name)
      .map((t) => ({
        id: t.id || newId(),
        type: "function" as const,
        function: { name: t.name, arguments: t.argText || "{}" },
      }));

    const BLOCKING = new Set([
      "ask_visual_probe",
      "ask_vibe",
      "ask_aspect_ratio",
      "ask_references",
      "ask_cast",
      "ask_audio",
    ]);
    const toolCalls: typeof allToolCalls = [];
    for (const tc of allToolCalls) {
      toolCalls.push(tc);
      if (BLOCKING.has(tc.function.name)) break;
    }

    if (textBuffer || toolCalls.length) {
      useStore.getState().appendToTranscript({
        role: "assistant",
        content: textBuffer || null,
        tool_calls: toolCalls.length ? toolCalls : undefined,
      });
    }

    let needsFollowUp = false;
    let hitBlocking = false;
    for (const tc of toolCalls) {
      let args: any = {};
      try { args = JSON.parse(tc.function.arguments); } catch {}
      useStore.getState().logActivity(TOOL_LABEL[tc.function.name] ?? tc.function.name, "tool");
      const result = dispatchTool(tc.function.name, args);
      useStore.getState().appendToTranscript({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
      if (BLOCKING.has(tc.function.name)) hitBlocking = true;
      if (tc.function.name === "set_brief") needsFollowUp = true;
    }
    if (hitBlocking) needsFollowUp = false;

    useStore.getState().setAgentThinking(false);
    if (!needsFollowUp) useStore.getState().logActivity("waiting on you", "done");

    if (needsFollowUp) {
      await runAgent();
    }
  } catch (e) {
    console.error("runAgent error", e);
    useStore.getState().setAgentThinking(false);
    if (!(e instanceof ToastedApiError)) {
      useStore.getState().pushAssistant("hmm, something hiccupped. try again?");
    }
  }
}

function sanitizeProject(p: any) {
  const castReady =
    p.cast.length === 0 || p.cast.every((c: any) => !!c.portraitUrl);
  return {
    title: p.title,
    description: p.description,
    vibe: p.vibe
      ? { presentation: p.vibe.presentation, selected: p.vibe.selected, options: p.vibe.options?.map((o: any) => ({ id: o.id, label: o.label })) }
      : undefined,
    aspect: p.aspect,
    references: p.references?.map((r: any) =>
      r.kind === "image" ? { kind: "image", label: r.label || "uploaded image" } : r,
    ),
    cast: p.cast.map((c: any) => ({ id: c.id, name: c.name, role: c.role, hasPortrait: !!c.portraitUrl })),
    castReady,
    audio: p.audio ? { kind: p.audio.kind, label: p.audio.label, note: p.audio.note, hasTrack: !!p.audio.trackUrl } : undefined,
    scenes: p.scenes?.map((s: any) => ({ id: s.id, title: s.title, description: s.description, duration: s.duration, castIds: s.castIds, hasImage: !!s.imageUrl })),
    status: p.status,
  };
}

async function toastApiError(res: Response, kind: "agent" | "image") {
  const raw = await res.text().catch(() => "");
  let parsed: any = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch {}

  const upstreamMessage = parsed?.upstreamMessage || parsed?.error || raw;
  const details = upstreamMessage ? { description: String(upstreamMessage).slice(0, 180) } : undefined;
  const label = kind === "agent" ? "AI request" : "Image generation";

  if (res.status === 402) {
    toast.error(`${label} needs more credits for this model.`, details);
  } else if (res.status === 429) {
    toast.error(`${label} is rate limited. Try again in a moment.`, details);
  } else if (res.status === 401 || res.status === 403) {
    toast.error(`${label} has an auth issue with the AI gateway.`, details);
  } else {
    toast.error(`${label} failed (${res.status}).`, details);
  }
}

function shouldToastImageError() {
  const now = Date.now();
  if (now - lastImageErrorToastAt < 5000) return false;
  lastImageErrorToastAt = now;
  return true;
}

function dispatchTool(name: string, args: any) {
  const s = useStore.getState();
  switch (name) {
    case "set_brief":
      s.setBrief(args.title, args.description);
      return { ok: true };
    case "ask_visual_probe": {
      const id = newId();
      const options = (args.options || []).map((o: any) => ({
        id: o.id,
        label: o.label,
        description: o.description,
        imagePrompt: o.imagePrompt,
      }));
      s.addBlock({ kind: "ask_visual_probe", id, question: args.question, options });
      options.forEach((opt: any) => {
        if (opt.imagePrompt) generateProbeOptionImage(id, opt.id, opt.imagePrompt);
      });
      return { ok: true, awaiting: "user_selection" };
    }
    case "ask_vibe": {
      const id = newId();
      const vibe = { presentation: args.presentation, options: args.options };
      s.setVibe(vibe);
      s.addBlock({ kind: "ask_vibe", id, vibe, question: args.question });
      if (args.presentation === "image_grid") {
        args.options.forEach((opt: any) => {
          if (opt.imagePrompt) generateOptionImage(opt.id, opt.imagePrompt);
        });
      }
      return { ok: true, awaiting: "user_selection" };
    }
    case "ask_aspect_ratio": {
      const id = newId();
      s.addBlock({ kind: "ask_aspect_ratio", id, question: args.question });
      return { ok: true, awaiting: "user_selection" };
    }
    case "ask_references": {
      const id = newId();
      s.addBlock({ kind: "ask_references", id, question: args.question });
      return { ok: true, awaiting: "user_selection" };
    }
    case "ask_cast": {
      const id = newId();
      const suggested = (args.suggested || []).map((c: any) => ({
        id: newId(),
        name: c.name,
        role: c.role,
        portraitPrompt: c.portraitPrompt,
        portraitStatus: "idle" as const,
      }));
      s.addBlock({ kind: "ask_cast", id, question: args.question, suggested });
      return { ok: true, awaiting: "user_selection" };
    }
    case "ask_audio": {
      const id = newId();
      s.addBlock({ kind: "ask_audio", id, question: args.question, options: args.options });
      return { ok: true, awaiting: "user_selection" };
    }
    case "build_storyboard": {
      const scenes = args.scenes.map((sc: any, i: number) => ({
        id: `S${i + 1}`,
        title: sc.title,
        description: sc.description,
        duration: sc.duration,
        imagePrompt: sc.imagePrompt,
        castIds: Array.isArray(sc.castIds) ? sc.castIds : [],
        imageStatus: "idle" as const,
      }));
      s.setScenes(scenes);
      const id = newId();
      s.addBlock({ kind: "storyboard", id, sceneIds: scenes.map((sc: any) => sc.id) });
      return { ok: true };
    }
    case "confirm": {
      const id = newId();
      s.addBlock({ kind: "confirm", id, message: args.message });
      return { ok: true };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

async function generateOptionImage(optionId: string, prompt: string) {
  const log = useStore.getState().logActivity;
  log(`rendering vibe ${optionId}`, "image");
  try {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      if (shouldToastImageError()) await toastApiError(res, "image");
      log(`vibe ${optionId} failed`, "error");
      return;
    }
    const { url } = await res.json();
    const s = useStore.getState();
    if (!s.project.vibe) return;
    const options = s.project.vibe.options.map((o) =>
      o.id === optionId ? { ...o, imageUrl: url } : o,
    );
    s.setVibe({ ...s.project.vibe, options });
    log(`vibe ${optionId} ready`, "image");
  } catch (e) { console.error("option image", e); log(`vibe ${optionId} errored`, "error"); }
}

async function generateProbeOptionImage(blockId: string, optionId: string, prompt: string) {
  const log = useStore.getState().logActivity;
  log(`rendering probe ${optionId}`, "image");
  try {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      if (shouldToastImageError()) await toastApiError(res, "image");
      log(`probe ${optionId} failed`, "error");
      return;
    }
    const { url } = await res.json();
    const store = useStore.getState();
    const blocks = store.blocks.map((b) => {
      if (b.id !== blockId || b.kind !== "ask_visual_probe") return b;
      return { ...b, options: b.options.map((o) => (o.id === optionId ? { ...o, imageUrl: url } : o)) };
    });
    // Use raw set via re-add to keep store immutability
    useStore.setState({ blocks });
    log(`probe ${optionId} ready`, "image");
  } catch (e) { console.error("probe image", e); log(`probe ${optionId} errored`, "error"); }
}

export async function generatePortrait(castId: string) {
  const s = useStore.getState();
  const member = s.project.cast.find((c) => c.id === castId);
  if (!member) return;
  const prompt =
    member.portraitPrompt ||
    `Cinematic headshot portrait of ${member.name}, ${member.role}, studio lighting, neutral background.`;
  s.updateCastMember(castId, { portraitStatus: "pending" });
  s.logActivity(`portrait ${member.name}`, "image");
  try {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      if (shouldToastImageError()) await toastApiError(res, "image");
      useStore.getState().updateCastMember(castId, { portraitStatus: "error" });
      return;
    }
    const { url } = await res.json();
    useStore.getState().updateCastMember(castId, {
      portraitUrl: url,
      portraitStatus: "ready",
      portraitSource: "generated",
    });
    useStore.getState().logActivity(`portrait ${member.name} ready`, "image");
  } catch (e) {
    console.error("portrait", e);
    useStore.getState().updateCastMember(castId, { portraitStatus: "error" });
  }
}

export function generateStoryboardImages() {
  const scenes = useStore.getState().project.scenes;
  for (const sc of scenes) {
    if (sc.imagePrompt && sc.imageStatus !== "ready" && sc.imageStatus !== "pending") {
      useStore.getState().updateScene(sc.id, { imageStatus: "pending" });
      generateSceneImage(sc.id, sc.imagePrompt);
    }
  }
}

async function generateSceneImage(sceneId: string, prompt: string) {
  const log = useStore.getState().logActivity;
  log(`rendering scene ${sceneId}`, "image");
  try {
    const s = useStore.getState();
    const aspect = s.project.aspect;
    const scene = s.project.scenes.find((sc) => sc.id === sceneId);
    const referenceImageUrls = (scene?.castIds ?? [])
      .map((id) => s.project.cast.find((c) => c.id === id)?.portraitUrl)
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspect, referenceImageUrls }),
    });
    if (!res.ok) {
      if (shouldToastImageError()) await toastApiError(res, "image");
      useStore.getState().updateScene(sceneId, { imageStatus: "error" });
      log(`scene ${sceneId} failed`, "error");
      return;
    }
    const { url } = await res.json();
    useStore.getState().updateScene(sceneId, { imageUrl: url, imageStatus: "ready" });
    log(`scene ${sceneId} ready`, "image");
  } catch (e) {
    console.error("scene image", e);
    useStore.getState().updateScene(sceneId, { imageStatus: "error" });
    log(`scene ${sceneId} errored`, "error");
  }
}

export function respondToBlock(blockId: string, userText: string) {
  const s = useStore.getState();
  s.pushUser(userText);
  s.removeBlock(blockId);
  runAgent();
}

export function sendUserMessage(text: string) {
  const s = useStore.getState();
  s.pushUser(text);
  runAgent();
}
