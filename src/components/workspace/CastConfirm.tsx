import { respondToBlock, generatePortrait } from "@/lib/agent/runner";
import { TextReveal } from "@/components/reveal/TextReveal";
import { useStore } from "@/lib/store";
import type { CastMember } from "@/lib/agent/types";
import { UploadTile } from "./UploadTile";
import { ShimmerReveal } from "@/components/reveal/ShimmerReveal";
import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";

export function CastConfirm({
  id,
  suggested,
  question,
}: {
  id: string;
  suggested: CastMember[];
  question: string;
}) {
  const setCast = useStore((s) => s.setCast);
  const cast = useStore((s) => s.project.cast);
  const updateCastMember = useStore((s) => s.updateCastMember);
  const removeCastMember = useStore((s) => s.removeCastMember);

  // Seed project.cast from suggested on first render
  useEffect(() => {
    if (cast.length === 0 && suggested.length > 0) {
      setCast(suggested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allReady = cast.length > 0 && cast.every((c) => !!c.portraitUrl);

  function handleUpload(memberId: string, files: { dataUrl: string; name: string }[]) {
    const first = files[0];
    if (!first) return;
    updateCastMember(memberId, {
      portraitUrl: first.dataUrl,
      portraitStatus: "ready",
      portraitSource: "upload",
    });
  }

  function confirm() {
    if (!allReady) return;
    respondToBlock(id, `cast ready: ${cast.map((c) => c.name).join(", ")}`);
  }

  return (
    <div className="flex h-full flex-col items-center gap-6 px-6 py-8 overflow-y-auto">
      <h2 className="font-display text-[clamp(24px,4vw,44px)] uppercase leading-[0.95] tracking-tight text-ink text-center">
        <TextReveal text={question} />
      </h2>

      <p className="text-[13px] text-ink-tertiary">
        upload or generate a portrait for each subject — this anchors their look across every scene
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {cast.map((c) => (
          <div key={c.id} className="relative flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-border">
            <button
              onClick={() => removeCastMember(c.id)}
              className="absolute right-2 top-2 rounded-full p-1 text-ink-quaternary hover:bg-ink/5 hover:text-ink"
              title="remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <ShimmerReveal active={c.portraitStatus === "pending"}>
              <div className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-ink/5 ring-1 ring-border">
                {c.portraitUrl ? (
                  <img src={c.portraitUrl} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-ink-quaternary">
                    {c.portraitStatus === "pending" ? "generating…" : "no portrait yet"}
                  </div>
                )}
              </div>
            </ShimmerReveal>
            <div className="flex flex-1 flex-col gap-2">
              <div>
                <div className="text-[15px] font-semibold text-ink">{c.name}</div>
                <div className="text-[12px] text-ink-tertiary">{c.role}</div>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <UploadTile
                  onFiles={(files) => handleUpload(c.id, files)}
                  label="drop or click to upload"
                  className="h-[60px]"
                  multiple={false}
                />
                <button
                  onClick={() => generatePortrait(c.id)}
                  disabled={c.portraitStatus === "pending"}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-lilac-soft px-3 py-2 text-[12px] font-medium text-lilac-deep transition-colors hover:bg-lilac/30 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {c.portraitUrl ? "regenerate" : "generate with AI"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={confirm}
        disabled={!allReady}
        className="rounded-full bg-ink px-6 py-3 text-[14px] font-medium text-white transition-opacity disabled:opacity-40"
      >
        {allReady ? "continue to scenes" : `add ${cast.filter((c) => !c.portraitUrl).length} more portrait(s)`}
      </button>
    </div>
  );
}
