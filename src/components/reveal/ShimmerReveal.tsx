import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  active?: boolean;
}

export function ShimmerReveal({ children, className, active = true }: Props) {
  return <div className={cn(active && "shimmer-reveal", className)}>{children}</div>;
}
