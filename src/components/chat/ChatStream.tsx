import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Only ephemeral user messages render here — as centered lilac pills above
 * the composer. Agent prompts are rendered inside the workspace Gen-UI blocks.
 */
export function ChatStream() {
  const messages = useStore((s) => s.messages);
  const isThinking = useStore((s) => s.isAgentThinking);
  const pruneEphemeral = useStore((s) => s.pruneEphemeral);

  useEffect(() => {
    const timers: number[] = [];
    messages
      .filter((m) => m.ephemeral)
      .forEach((m) => {
        const age = Date.now() - m.createdAt;
        const remaining = Math.max(0, 2400 - age);
        const t = window.setTimeout(() => {
          const el = document.querySelector<HTMLElement>(`[data-msg-id="${m.id}"]`);
          el?.classList.add("ephemeral-out");
          window.setTimeout(() => pruneEphemeral(m.id), 320);
        }, remaining);
        timers.push(t);
      });
    return () => timers.forEach(clearTimeout);
  }, [messages, pruneEphemeral]);

  const ephemeral = messages.filter((m) => m.role === "user" && m.ephemeral);

  return (
    <div className="flex min-h-[28px] flex-col items-center gap-1.5 px-4">
      {ephemeral.map((m) => (
        <div
          key={m.id}
          data-msg-id={m.id}
          className="overflow-hidden rounded-2xl bg-lilac-soft px-4 py-1.5 text-[14px] text-ink transition-all"
        >
          {m.content}
        </div>
      ))}
      {isThinking && (
        <div className="flex items-center gap-1.5 py-0.5">
          <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink-tertiary" />
          <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink-tertiary" />
          <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink-tertiary" />
        </div>
      )}
    </div>
  );
}
