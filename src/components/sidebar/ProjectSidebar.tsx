import { useStore } from "@/lib/store";
import { TextReveal } from "@/components/reveal/TextReveal";
import { ShimmerReveal } from "@/components/reveal/ShimmerReveal";
import { ChevronLeft, MoreHorizontal } from "lucide-react";

export function ProjectSidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  const project = useStore((s) => s.project);
  const hasScenes = project.scenes.length > 0;
  if (collapsed) return null;

  return (
    <aside className="flex h-full w-[380px] shrink-0 p-4">
      <div className="flex h-full w-full flex-col rounded-[28px] bg-white p-6 ring-1 ring-border shadow-[0_18px_60px_rgba(13,13,13,0.04)]">
        {/* header: back + K logo */}
        <div className="flex items-center justify-between">
          <button
            onClick={onCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary hover:text-ink"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-border text-[12px] font-bold text-ink">
            K
          </div>
        </div>

        {/* title */}
        <div className="mt-10">
          <ShimmerReveal active={!!project.title} key={project.title || "title"}>
            <h1 className="font-display text-[52px] leading-[0.88] tracking-tight text-ink uppercase">
              {project.title ? (
                <TextReveal text={project.title} leadingCount={2} charDelay={26} />
              ) : (
                <span className="text-ink-quaternary">
                  New<br />Project
                </span>
              )}
            </h1>
          </ShimmerReveal>
        </div>

        {/* fields */}
        <div className="mt-8 space-y-5 text-[14px]">
          {project.description ? (
            <ShimmerReveal key={project.description}>
              <p className="text-ink leading-relaxed">{project.description}</p>
            </ShimmerReveal>
          ) : (
            <p className="text-ink-quaternary">Description</p>
          )}

          <Divider />
          <FieldRow label="Aspect Ratio" value={project.aspect ?? "Select"} muted={!project.aspect} />
          <Divider />
          <FieldRow label="Other Stuff" value="Settings Here" muted />
        </div>

        <div className="flex-1" />

        {/* footer actions, only when project has begun */}
        {hasScenes && (
          <div className="flex items-center gap-2 pt-4">
            <button className="flex-1 rounded-full bg-ink/5 py-3 text-[14px] font-semibold text-ink hover:bg-ink/10">
              Export
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 text-ink hover:bg-ink/10">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}

function FieldRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink">{label}</span>
      <span className={muted ? "text-ink-quaternary" : "text-ink"}>{value}</span>
    </div>
  );
}
