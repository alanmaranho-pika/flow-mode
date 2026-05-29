import { useState } from "react";
import { respondToBlock } from "@/lib/agent/runner";
import { TextReveal } from "@/components/reveal/TextReveal";
import { useStore } from "@/lib/store";
import { Link as LinkIcon } from "lucide-react";
import { UploadTile } from "./UploadTile";

export function ReferencesPicker({ id, question }: { id: string; question: string }) {
  const [url, setUrl] = useState("");
  const addReference = useStore((s) => s.addReference);
  const refs = useStore((s) => s.project.references);

  function addUrl() {
    if (!url.trim()) return;
    addReference({ kind: "url", value: url.trim() });
    setUrl("");
  }

  function skip() {
    respondToBlock(id, "no references, let's move on");
  }

  function done() {
    respondToBlock(id, "references added");
  }

  function handleUpload(files: { dataUrl: string; name: string }[]) {
    for (const f of files) addReference({ kind: "image", value: f.dataUrl, label: f.name });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6">
      <h2 className="font-display text-[clamp(28px,5vw,52px)] uppercase leading-[0.95] tracking-tight text-ink text-center max-w-2xl">
        <TextReveal text={question} />
      </h2>

      <div className="flex w-full max-w-lg flex-col gap-4">
        <UploadTile onFiles={handleUpload} label="drop reference images here" />

        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-border">
            <LinkIcon className="h-4 w-4 text-ink-tertiary" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="paste a url"
              className="flex-1 bg-transparent py-2.5 text-[14px] focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
            />
          </div>
          <button onClick={addUrl} className="rounded-xl bg-ink px-4 text-[13px] font-medium text-white">
            Add
          </button>
        </div>

        {refs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {refs.map((r, i) =>
              r.kind === "image" ? (
                <img key={i} src={r.value} alt="" className="h-12 w-12 rounded-md object-cover ring-1 ring-border" />
              ) : (
                <span key={i} className="rounded-full bg-ink/5 px-3 py-1 text-[12px] text-ink-tertiary">
                  {r.label || r.value.slice(0, 30)}
                </span>
              ),
            )}
          </div>
        )}

        <div className="flex justify-center gap-3 pt-2">
          <button onClick={skip} className="rounded-full px-5 py-2 text-[13px] text-ink-tertiary hover:text-ink">
            skip
          </button>
          <button onClick={done} className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white">
            continue
          </button>
        </div>
      </div>
    </div>
  );
}
