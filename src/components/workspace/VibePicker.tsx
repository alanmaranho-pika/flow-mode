import { respondToBlock } from "@/lib/agent/runner";
import { TextReveal } from "@/components/reveal/TextReveal";
import { ShimmerReveal } from "@/components/reveal/ShimmerReveal";
import type { Vibe } from "@/lib/agent/types";
import { useStore } from "@/lib/store";
import { UploadTile } from "./UploadTile";

export function VibePicker({ id, vibe, question }: { id: string; vibe: Vibe; question: string }) {
  const addReference = useStore((s) => s.addReference);
  const allRefs = useStore((s) => s.project.references);
  const refs = allRefs.filter((r) => r.kind === "image");

  function handleUpload(files: { dataUrl: string; name: string }[]) {
    for (const f of files) addReference({ kind: "image", value: f.dataUrl, label: f.name });
    respondToBlock(id, `added ${files.length} reference image${files.length > 1 ? "s" : ""} to the moodboard`);
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 py-10">
      <h2 className="font-display text-[clamp(24px,4vw,44px)] uppercase leading-[0.95] tracking-tight text-ink text-center">
        <TextReveal text={question} />
      </h2>

      {vibe.presentation === "image_grid" && (
        <>
          <div className="grid grid-cols-4 gap-5">
            {vibe.options.map((o) => (
              <button
                key={o.id}
                onClick={() => respondToBlock(id, o.label)}
                className="group flex flex-col items-start gap-2"
              >
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
        </>
      )}

      {vibe.presentation === "swatch_palette" && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {vibe.options.map((o) => (
            <button
              key={o.id}
              onClick={() => respondToBlock(id, o.label)}
              className="group rounded-2xl bg-white p-4 text-left ring-1 ring-border transition-all hover:ring-lilac hover:shadow-lg"
            >
              <div className="flex gap-1.5 mb-3">
                {(o.colors ?? []).map((c, i) => (
                  <div key={i} className="h-12 w-12 rounded-lg" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="text-[15px] font-semibold text-ink">{o.label}</div>
              {o.description && <div className="text-[13px] text-ink-tertiary mt-0.5">{o.description}</div>}
            </button>
          ))}
        </div>
      )}

      {vibe.presentation === "keyword_chips" && (
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
          {vibe.options.map((o) => (
            <button
              key={o.id}
              onClick={() => respondToBlock(id, o.label)}
              className="group flex flex-col gap-2 rounded-2xl bg-white px-5 py-4 ring-1 ring-border transition-all hover:ring-lilac hover:bg-lilac-soft"
            >
              <div className="text-[15px] font-semibold text-ink">{o.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {(o.keywords ?? []).map((k) => (
                  <span key={k} className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] text-ink-tertiary">
                    {k}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-[13px] text-ink-quaternary">click or describe your own</p>
    </div>
  );
}
