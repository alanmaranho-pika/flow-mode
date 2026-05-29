import { useState } from "react";
import { useStore } from "@/lib/store";
import { Plus, Mic, AudioLines, History } from "lucide-react";
import { sendUserMessage, respondToBlock } from "@/lib/agent/runner";
import { cn } from "@/lib/utils";

export function ChatComposer() {
  const [text, setText] = useState("");
  const blocks = useStore((s) => s.blocks);
  const isThinking = useStore((s) => s.isAgentThinking);
  const hasProject = useStore((s) => !!s.project.title);
  const hasStoryboard = useStore((s) => s.project.scenes.length > 0);

  const activeBlock = blocks[blocks.length - 1];
  const routesToBlock = activeBlock && activeBlock.kind !== "storyboard" && activeBlock.kind !== "confirm";

  function submit() {
    const v = text.trim();
    if (!v || isThinking) return;
    setText("");
    if (routesToBlock && activeBlock) respondToBlock(activeBlock.id, v);
    else sendUserMessage(v);
  }

  const placeholder = !hasProject ? "Type a message…" : "Type a message…";

  return (
    <div className="flex w-full items-center justify-center gap-3 px-4 pb-6 pt-2">
      {hasStoryboard && (
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-border text-ink-tertiary hover:text-ink">
          <History className="h-4 w-4" />
        </button>
      )}

      <div
        className={cn(
          "flex h-11 min-w-[420px] max-w-[560px] flex-1 items-center gap-2 rounded-full bg-white px-2 ring-1 ring-border shadow-[0_8px_24px_rgba(13,13,13,0.04)]",
          isThinking && "opacity-70",
        )}
      >
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-tertiary hover:text-ink">
          <Plus className="h-4 w-4" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          disabled={isThinking}
          className="flex-1 bg-transparent text-[14px] placeholder:text-ink-tertiary focus:outline-none"
        />
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-tertiary hover:text-ink">
          <Mic className="h-4 w-4" />
        </button>
        <button
          onClick={submit}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lilac-soft text-lilac-deep hover:bg-lilac/40"
        >
          <AudioLines className="h-4 w-4" />
        </button>
      </div>

      <button className="flex h-11 items-center gap-2 rounded-full bg-white px-3 ring-1 ring-border text-[11px] uppercase tracking-wider text-ink-tertiary">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/5">
          <span className="h-2.5 w-2.5 rounded-full border border-ink-tertiary" />
        </span>
        OFF
      </button>
    </div>
  );
}
