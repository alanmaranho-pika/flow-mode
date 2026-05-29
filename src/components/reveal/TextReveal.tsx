import { useEffect, useMemo, useState, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
  leadingCount?: number;
  charDelay?: number;
  as?: ElementType;
}

/**
 * Splits text into char spans, animates them in sequentially.
 * The last `leadingCount` characters get a lilac gradient mask.
 */
export function TextReveal({ text, className, leadingCount = 3, charDelay = 28, as = "span" }: Props) {
  const Tag = as as any;
  const chars = useMemo(() => Array.from(text), [text]);
  const [tick, setTick] = useState(0);

  // re-run when text changes
  useEffect(() => setTick((t) => t + 1), [text]);

  return (
    <Tag key={tick} className={cn("text-reveal", className)}>
      {chars.map((ch, i) => {
        const isLeading = i >= chars.length - leadingCount && i < chars.length;
        return (
          <span
            key={i}
            className={isLeading ? "is-leading" : undefined}
            style={{ ["--char-i" as any]: i, animationDelay: `${i * charDelay}ms` }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </Tag>
  );
}
