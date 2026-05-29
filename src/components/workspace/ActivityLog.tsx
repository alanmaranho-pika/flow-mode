import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const KIND_DOT: Record<string, string> = {
  thinking: "bg-lilac-deep animate-pulse",
  tool: "bg-ink",
  image: "bg-amber-500",
  done: "bg-emerald-500",
  error: "bg-red-500",
};

export function ActivityLog() {
  const activity = useStore((s) => s.activity);
  const thinking = useStore((s) => s.isAgentThinking);
  const [open, setOpen] = useState(false);

  const latest = activity[activity.length - 1];
  const recent = activity.slice(-12).reverse();

  // Auto-collapse a moment after the last event when idle
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 6000);
    return () => clearTimeout(t);
  }, [latest?.id, open]);

  if (!latest && !thinking) return null;

  return (
    <div className="pointer-events-auto fixed right-5 top-5 z-50 w-[280px] select-none font-mono text-[11px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-[0_4px_20px_rgba(13,13,13,0.06)] ring-1 ring-border backdrop-blur transition hover:bg-white"
      >
        <span className={cn("h-2 w-2 shrink-0 rounded-full", KIND_DOT[latest?.kind ?? "thinking"])} />
        <span className="flex-1 truncate text-left text-ink">
          {thinking ? "thinking…" : latest?.message ?? "idle"}
        </span>
        <span className="text-ink-quaternary">{open ? "—" : "+"}</span>
      </button>

      {open && (
        <ul className="mt-2 max-h-[260px] overflow-auto rounded-2xl bg-white/95 p-2 shadow-[0_4px_20px_rgba(13,13,13,0.06)] ring-1 ring-border backdrop-blur">
          {recent.length === 0 && (
            <li className="px-2 py-1 text-ink-quaternary">no activity yet</li>
          )}
          {recent.map((e) => (
            <li key={e.id} className="flex items-center gap-2 px-2 py-1">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", KIND_DOT[e.kind])} />
              <span className="w-10 shrink-0 text-ink-quaternary">{fmt(e.at)}</span>
              <span className="truncate text-ink">{e.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmt(t: number) {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
