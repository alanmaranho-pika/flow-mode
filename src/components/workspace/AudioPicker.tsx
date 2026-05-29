import { respondToBlock } from "@/lib/agent/runner";
import { TextReveal } from "@/components/reveal/TextReveal";
import { useStore } from "@/lib/store";
import type { AudioOption, AudioDirection } from "@/lib/agent/types";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Upload as UploadIcon, RotateCcw, Check, ArrowLeft } from "lucide-react";
import { UploadTile } from "./UploadTile";
import { toast } from "sonner";

const KIND_ICON: Record<string, string> = {
  music: "♪",
  ai_music: "✦",
  voiceover: "🎙",
  sfx: "✶",
  silent: "∅",
  mixed: "≋",
};

type Phase = "pick" | "source" | "generating" | "confirm";

export function AudioPicker({ id, question, options }: { id: string; question: string; options: AudioOption[] }) {
  const setAudio = useStore((s) => s.setAudio);
  const scenes = useStore((s) => s.project.scenes);
  const totalDur = Math.max(15, scenes.reduce((sum, s) => sum + (s.duration || 3), 0));

  const [phase, setPhase] = useState<Phase>("pick");
  const [selected, setSelected] = useState<AudioOption | null>(null);
  const [note, setNote] = useState("");
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [source, setSource] = useState<"upload" | "generated" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  function pick(opt: AudioOption) {
    setSelected(opt);
    setNote(opt.description || "");
    if (opt.kind === "silent") {
      // No track needed
      const dir: AudioDirection = { kind: "silent", label: opt.label };
      setAudio(dir);
      respondToBlock(id, opt.label);
      return;
    }
    setPhase("source");
  }

  function handleUpload(files: { dataUrl: string; name: string }[]) {
    const first = files[0];
    if (!first) return;
    setTrackUrl(first.dataUrl);
    setSource("upload");
    setPhase("confirm");
  }

  async function generate() {
    if (!selected) return;
    const prompt = note.trim() || selected.description || selected.label;
    if (!prompt) {
      toast.error("describe the track first");
      return;
    }
    setPhase("generating");
    try {
      const res = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, durationMs: Math.round(totalDur * 1000) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || `audio generation failed (${res.status})`);
        setPhase("source");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setTrackUrl(url);
      setSource("generated");
      setPhase("confirm");
    } catch (e) {
      console.error(e);
      toast.error("audio generation failed");
      setPhase("source");
    }
  }

  function confirm() {
    if (!selected || !trackUrl) return;
    const dir: AudioDirection = {
      kind: selected.kind,
      label: selected.label,
      note: note.trim() || undefined,
      trackUrl,
      trackStatus: "ready",
      trackSource: source ?? undefined,
    };
    setAudio(dir);
    const summary = source === "upload" ? `${selected.label} (uploaded)` : `${selected.label} — ${note.trim() || "AI generated"}`;
    respondToBlock(id, summary);
  }

  // ===== render =====
  if (phase === "pick") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-6 py-10">
        <h2 className="font-display text-[clamp(24px,4vw,44px)] uppercase leading-[0.95] tracking-tight text-ink text-center">
          <TextReveal text={question} />
        </h2>
        <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => pick(o)}
              className="group flex items-start gap-4 rounded-2xl bg-white p-5 text-left ring-1 ring-border transition-all hover:shadow-lg hover:ring-lilac"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lilac-soft text-lilac-deep text-[22px]">
                {KIND_ICON[o.kind] ?? "♪"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
                  {o.label}
                  {o.kind === "ai_music" && <Sparkles className="h-3.5 w-3.5 text-lilac-deep" />}
                </div>
                {o.description && <div className="text-[13px] text-ink-tertiary mt-0.5">{o.description}</div>}
              </div>
            </button>
          ))}
        </div>
        <p className="text-[13px] text-ink-quaternary">pick a direction — next you'll upload or generate the track</p>
      </div>
    );
  }

  if (phase === "source" || phase === "generating") {
    const isMusic = selected?.kind === "music" || selected?.kind === "ai_music" || selected?.kind === "mixed";
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10">
        <button onClick={() => setPhase("pick")} className="self-start ml-2 flex items-center gap-1 text-[12px] text-ink-tertiary hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> back
        </button>
        <h2 className="font-display text-[clamp(20px,3vw,36px)] uppercase leading-[0.95] tracking-tight text-ink text-center">
          {selected?.label} — upload or generate
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
          <div className="flex flex-col gap-2">
            <div className="text-[12px] uppercase tracking-wider text-ink-quaternary">upload your own</div>
            <UploadTile
              onFiles={handleUpload}
              label="drop or click an audio file (mp3, wav)"
              accept="audio/*"
              multiple={false}
              className="h-[180px]"
            />
          </div>

          {isMusic && (
            <div className="flex flex-col gap-2">
              <div className="text-[12px] uppercase tracking-wider text-ink-quaternary">generate with AI</div>
              <div className="flex h-[180px] flex-col gap-2 rounded-2xl bg-white p-4 ring-1 ring-border">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="describe the track — genre, tempo, mood, instruments"
                  className="flex-1 resize-none rounded-lg bg-canvas px-3 py-2 text-[13px] outline-none ring-1 ring-border focus:ring-lilac"
                />
                <button
                  onClick={generate}
                  disabled={phase === "generating" || !note.trim()}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {phase === "generating" ? "generating…" : `generate ${Math.round(totalDur)}s track`}
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-[11px] text-ink-quaternary">
          AI generation uses ElevenLabs Music — you'll need ELEVENLABS_API_KEY added to your project.
        </p>
      </div>
    );
  }

  // confirm
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10">
      <h2 className="font-display text-[clamp(20px,3vw,36px)] uppercase leading-[0.95] tracking-tight text-ink text-center">
        sound good?
      </h2>
      <div className="flex w-full max-w-xl flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lilac-soft text-lilac-deep">
            {KIND_ICON[selected?.kind ?? "music"]}
          </div>
          <div>
            <div className="text-[15px] font-semibold text-ink">{selected?.label}</div>
            <div className="text-[12px] text-ink-tertiary">
              {source === "upload" ? "uploaded track" : "AI generated"}
              {note.trim() && ` · ${note.trim()}`}
            </div>
          </div>
        </div>
        {trackUrl && (
          <audio ref={audioRef} src={trackUrl} controls className="w-full" />
        )}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={confirm}
            className="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-white"
          >
            <Check className="h-3.5 w-3.5" />
            use this track
          </button>
          {source === "generated" && (
            <button
              onClick={generate}
              className="flex items-center gap-1.5 rounded-full bg-lilac-soft px-5 py-2.5 text-[13px] font-medium text-lilac-deep"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              regenerate
            </button>
          )}
          <button
            onClick={() => { setTrackUrl(null); setSource(null); setPhase("source"); }}
            className="flex items-center gap-1.5 rounded-full bg-canvas px-5 py-2.5 text-[13px] font-medium text-ink ring-1 ring-border"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            try something else
          </button>
        </div>
      </div>
    </div>
  );
}
