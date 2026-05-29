import { useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { ShimmerReveal } from "@/components/reveal/ShimmerReveal";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { usePlayback } from "@/lib/playback";
import type { Scene } from "@/lib/agent/types";

export function StoryboardView() {
  const project = useStore((s) => s.project);
  const tab = useStore((s) => s.activeTab);
  const idx = usePlayback((p) => p.idx);
  const progress = usePlayback((p) => p.progress);
  const isPlaying = usePlayback((p) => p.isPlaying);
  const seek = usePlayback((p) => p.seek);
  const scenes = project.scenes;
  const selected = scenes[idx] ?? scenes[0];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  if (!selected) return null;

  const isScenes = tab === "scenes";
  const aspectCls = project.aspect === "9:16" ? "aspect-[9/16] max-w-[340px]" : "aspect-video max-w-[820px]";

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (tab === "animation" && isPlaying && selected.videoUrl) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }, [tab, isPlaying, selected.videoUrl, idx]);

  const stageKey = `${selected.id}-${idx}-${tab}`;

  // Playhead position across the whole timeline
  const totalDur = scenes.reduce((sum, s) => sum + (s.duration || 3), 0) || 1;
  let elapsed = 0;
  for (let i = 0; i < idx; i++) elapsed += scenes[i].duration || 3;
  elapsed += progress * (selected.duration || 3);
  const playheadPct = Math.min(100, (elapsed / totalDur) * 100);

  return (
    <div className="relative flex h-full">
      <div className="flex flex-1 flex-col gap-6 px-8 pb-6 pt-2">
        {/* main stage — uniform aspect frame across all tabs */}
        <div className="flex flex-1 items-center justify-center">
          <StageFrame aspectCls={aspectCls} stageKey={stageKey} isPlaying={isPlaying}>
            {isScenes ? (
              <SceneCard scene={selected} cast={project.cast} isPlaying={isPlaying} />
            ) : (
              <ShimmerReveal active={selected.imageStatus !== "ready"} key={selected.id + (selected.imageUrl || "loading")}>
                <div className="h-full w-full">
                  {tab === "animation" && selected.videoUrl ? (
                    <video
                      ref={videoRef}
                      src={selected.videoUrl}
                      className="h-full w-full object-cover"
                      autoPlay={isPlaying}
                      loop={!isPlaying}
                      muted
                      onEnded={() => {
                        if (!isPlaying) return;
                        const next = idx + 1;
                        if (next < scenes.length) seek(next);
                        else usePlayback.getState().pause();
                      }}
                    />
                  ) : selected.imageUrl ? (
                    <img
                      key={stageKey}
                      src={selected.imageUrl}
                      alt={selected.title}
                      style={{ ["--kb-dur" as any]: `${Math.max(0.5, selected.duration || 3)}s` }}
                      className={cn("h-full w-full object-cover", isPlaying && "kenburns")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-lilac-soft to-transparent text-ink-quaternary">
                      {selected.imageStatus === "pending" ? "generating…" : "open storyboard to render"}
                    </div>
                  )}
                </div>
              </ShimmerReveal>
            )}
          </StageFrame>
        </div>

        {/* timeline + orange playhead */}
        <div className="relative flex flex-col gap-2">
          {/* ruler */}
          <div className="relative h-3 px-1 text-[10px] text-ink-quaternary">
            {[5, 10, 15].map((s) => (
              <span key={s} className="absolute" style={{ left: `${(s / 15) * 100}%` }}>
                {s}s
              </span>
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center gap-2">
              {scenes.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => seek(i, { pause: true })}
                  style={{ flexGrow: s.duration || 3 }}
                  className={cn(
                    "relative h-[56px] flex-1 shrink-0 overflow-hidden rounded-xl transition-all",
                    idx === i ? "ring-2 ring-ink" : "ring-1 ring-border",
                  )}
                >
                  {isScenes || !s.imageUrl ? (
                    <div className="flex h-full w-full items-center justify-center bg-white text-[12px] text-ink-tertiary">
                      #{s.id}
                    </div>
                  ) : (
                    <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
              <button className="flex h-[56px] w-[56px] items-center justify-center rounded-xl bg-ink/5 text-ink-tertiary hover:bg-ink/10">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* audio track */}
          <div className="relative flex items-center gap-3 rounded-xl bg-lilac-soft px-4 py-2">
            <span className="text-[12px] font-medium text-lilac-deep">
              {project.audio
                ? `${project.audio.label}${project.audio.trackSource ? ` · ${project.audio.trackSource}` : ""}`
                : "Audio.mp4"}
            </span>
            <div className="flex h-5 flex-1 items-end gap-[2px]">
              {Array.from({ length: 80 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-full bg-lilac-deep/50"
                  style={{ height: `${30 + Math.sin(i * 0.6) * 40 + Math.random() * 30}%` }}
                />
              ))}
            </div>
          </div>

          {/* Orange playhead spans the timeline + audio */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-3 bottom-0 w-[2px] bg-[color:var(--playhead)] z-10"
            style={{ left: `calc(${playheadPct}% )` }}
          />
        </div>
      </div>

      <RightRail />
    </div>
  );
}

function StageFrame({
  aspectCls,
  stageKey,
  isPlaying,
  children,
}: {
  aspectCls: string;
  stageKey: string;
  isPlaying: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      key={stageKey}
      className={cn(
        "w-full overflow-hidden rounded-3xl bg-white ring-1 ring-border shadow-[0_18px_60px_rgba(13,13,13,0.06)]",
        aspectCls,
        isPlaying && "animatic-in",
      )}
    >
      {children}
    </div>
  );
}

function SceneCard({ scene, cast, isPlaying }: { scene: Scene; cast: ReturnType<typeof useStore.getState>["project"]["cast"]; isPlaying: boolean }) {
  return (
    <div className={cn("flex h-full w-full flex-col p-10", isPlaying && "animatic-in")}>
      <div className="text-lilac-deep font-display text-[28px] tracking-tight">#{scene.title}</div>
      <div className="flex-1" />
      <pre className="whitespace-pre-wrap font-mono text-[14px] leading-relaxed text-ink">
        {scene.description}
      </pre>
      {scene.castIds && scene.castIds.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-ink-quaternary">subject</span>
          {scene.castIds.map((cid) => {
            const c = cast.find((m) => m.id === cid);
            if (!c) return null;
            return (
              <span key={cid} className="flex items-center gap-1.5 rounded-full bg-lilac-soft px-2.5 py-1 text-[12px] text-lilac-deep">
                {c.portraitUrl && (
                  <img src={c.portraitUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                )}
                {c.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RightRail() {
  const project = useStore((s) => s.project);
  return (
    <aside className="flex w-[120px] shrink-0 flex-col items-center gap-4 px-4 py-8">
      <RailCard
        label="References"
        count={project.references.length}
        thumb={project.references[0]?.kind === "image" ? project.references[0].value : undefined}
        fallback="bg-gradient-to-br from-rose-200 via-orange-200 to-amber-200"
      />
      <RailCard
        label="Subject"
        count={project.cast.length}
        thumb={project.cast[0]?.portraitUrl}
        fallback="bg-gradient-to-br from-pink-200 to-purple-200"
      />
      <RailCard label="Elements" count={0} fallback="bg-white" plus />
    </aside>
  );
}

function RailCard({ label, count, thumb, fallback, plus }: { label: string; count: number; thumb?: string; fallback: string; plus?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn("relative h-[72px] w-[72px] overflow-hidden rounded-2xl ring-1 ring-border", fallback)}>
        {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
        {plus && (
          <div className="flex h-full w-full items-center justify-center text-ink-tertiary">
            <Plus className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-[12px]">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-lilac-deep">{count}</span>
      </div>
    </div>
  );
}
