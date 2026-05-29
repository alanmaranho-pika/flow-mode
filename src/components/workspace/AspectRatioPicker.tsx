import { respondToBlock } from "@/lib/agent/runner";
import { TextReveal } from "@/components/reveal/TextReveal";

export function AspectRatioPicker({ id, question }: { id: string; question: string }) {
  return (
    <div className="flex h-full flex-col px-6 pb-6 pt-4">
      <div className="flex flex-1 items-center justify-center gap-16">
        <button
          onClick={() => respondToBlock(id, "vertical 9:16")}
          className="tilt-left group flex flex-col items-center gap-4"
        >
          <div className="grid h-[360px] w-[220px] grid-cols-3 grid-rows-3 gap-0 rounded-2xl bg-white shadow-[0_18px_60px_rgba(13,13,13,0.08)] ring-1 ring-border overflow-hidden transition-shadow group-hover:shadow-[0_22px_70px_rgba(13,13,13,0.14)]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border-r border-b border-border/60" />
            ))}
          </div>
          <div className="text-center">
            <div className="text-[15px] font-semibold text-ink">Vertical</div>
            <div className="text-[13px] text-ink-tertiary">TikTok, Reels, Shorts</div>
          </div>
        </button>

        <button
          onClick={() => respondToBlock(id, "horizontal 16:9")}
          className="tilt-right group flex flex-col items-center gap-4"
        >
          <div className="grid h-[260px] w-[460px] grid-cols-3 grid-rows-3 gap-0 rounded-2xl bg-white shadow-[0_18px_60px_rgba(13,13,13,0.08)] ring-1 ring-border overflow-hidden transition-shadow group-hover:shadow-[0_22px_70px_rgba(13,13,13,0.14)]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border-r border-b border-border/60" />
            ))}
          </div>
          <div className="text-center">
            <div className="text-[15px] font-semibold text-ink">Horizontal</div>
            <div className="text-[13px] text-ink-tertiary">Youtube, Cinematic</div>
          </div>
        </button>
      </div>
      <div className="pt-6 text-center">
        <h2 className="text-[22px] font-medium text-ink">
          <TextReveal text={question} leadingCount={3} charDelay={22} />
        </h2>
      </div>
    </div>
  );
}
