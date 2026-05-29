import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Play, Pause, PanelLeftOpen } from "lucide-react";
import { usePlayback } from "@/lib/playback";
import { generateStoryboardImages } from "@/lib/agent/runner";

export function TopTabs({ sidebarCollapsed, onOpenSidebar }: { sidebarCollapsed: boolean; onOpenSidebar: () => void }) {
  const project = useStore((s) => s.project);
  const tab = useStore((s) => s.activeTab);
  const setTab = useStore((s) => s.setActiveTab);
  const isPlaying = usePlayback((p) => p.isPlaying);
  const toggle = usePlayback((p) => p.toggle);
  if (!project.scenes.length) return null;

  const tabs: Array<{ id: typeof tab; label: string; enabled: boolean }> = [
    { id: "scenes", label: "Scenes", enabled: true },
    { id: "storyboard", label: "Storyboard", enabled: true },
    { id: "animation", label: "Animation", enabled: project.scenes.some((s) => s.videoUrl) || project.status === "rendering" || project.status === "done" },
  ];

  const onTabClick = (id: typeof tab) => {
    setTab(id);
    if (id === "storyboard") {
      // Lazily generate keyframes the first time the user opens Storyboard
      generateStoryboardImages();
    }
  };

  return (
    <div className="relative flex items-center justify-between px-6 py-4">
      {/* left: collapsed-sidebar opener + project title */}
      <div className="flex items-center gap-3">
        {sidebarCollapsed && (
          <>
            <button
              onClick={onOpenSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary hover:text-ink"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
            <span className="text-[15px] font-semibold text-ink">{project.title || "Project Title"}</span>
          </>
        )}
      </div>

      {/* center: pill tabs + play */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3">
        <div className="flex items-center gap-1 rounded-full bg-ink/5 p-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              disabled={!t.enabled}
              onClick={() => onTabClick(t.id)}
              className={cn(
                "rounded-full px-5 py-2 text-[14px] font-medium transition-colors disabled:opacity-30",
                tab === t.id ? "bg-white text-ink shadow-sm" : "text-ink-tertiary hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pause animatic" : "Play animatic"}
          className="flex h-11 w-14 items-center justify-center rounded-2xl bg-ink text-white transition-colors hover:bg-ink/90"
        >
          {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        </button>
      </div>

      <div />
    </div>
  );
}
