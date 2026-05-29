import { respondToBlock } from "@/lib/agent/runner";
import { TextReveal } from "@/components/reveal/TextReveal";
import { ShimmerReveal } from "@/components/reveal/ShimmerReveal";
import { useStore } from "@/lib/store";
import { UploadTile } from "./UploadTile";
import { useState } from "react";
import type { VisualProbeOption } from "@/lib/agent/types";

export function VisualProbePicker({
  id,
  question,
  options,
}: {
  id: string;
  question: string;
  options: VisualProbeOption[];
}) {
  const addReference = useStore((s) => s.addReference);
  const allRefs = useStore((s) => s.project.references);
  const refs = allRefs.filter((r) => r.kind === "image");
  const [note, setNote] = useState("");

  function pick(label: string) {
    respondToBlock(id, label);
  }

  function handleUpload(files: { dataUrl: string; name: string }[]) {
    for (const f of files) addReference({ kind: "image", value: f.dataUrl, label: f.name });
    respondToBlock(id, `uploaded ${files.length} reference image${files.length > 1 ? "s" : ""}`);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-8 overflow-y-auto">
      <h2 className="font-display text-[clamp(24px,4vw,44px)] uppercase leading-[0.95] tracking-tight text-ink text-center">
        <TextReveal text={question} />
      </h2>

      <div className="grid grid-cols-4 gap-4">
        {options.map((o) => (
          <button key={o.id} onClick={() => pick(o.label)} className="group flex flex-col items-start gap-2">
            <ShimmerReveal active={!o.imageUrl} key={o.imageUrl ? "ready" : "loading"}>
              <div className="h-[180px] w-[180px] overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-border transition-all group-hover:ring-lilac">
                {o.imageUrl ? (
                  <img src={o.imageUrl} alt={o.label} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full animate-pulse bg-gradient-to-br from-lilac-soft to-transparent" />
                )}
              </div>
            </ShimmerReveal>
            <div className="text-[13px] font-medium text-ink">{o.label}</div>
            {o.description && <div className="text-[12px] text-ink-tertiary">{o.description}</div>}
          </button>
        ))}
        <UploadTile onFiles={handleUpload} compact label="upload your own" />
      </div>

      {refs.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {refs.slice(-8).map((r, i) => (
            <img key={i} src={r.value} alt="" className="h-12 w-12 rounded-md object-cover ring-1 ring-border" />
          ))}
        </div>
      )}

      <div className="flex w-full max-w-lg items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && note.trim() && pick(note.trim())}
          placeholder="or describe it yourself…"
          className="flex-1 rounded-full bg-white px-5 py-3 text-[14px] ring-1 ring-border outline-none focus:ring-lilac"
        />
        {note.trim() && (
          <button onClick={() => pick(note.trim())} className="rounded-full bg-ink px-5 py-3 text-[13px] font-medium text-white">
            send
          </button>
        )}
      </div>
    </div>
  );
}
