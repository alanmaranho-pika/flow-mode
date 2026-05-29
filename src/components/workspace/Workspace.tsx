import { useStore } from "@/lib/store";
import { BlankState } from "./BlankState";
import { AspectRatioPicker } from "./AspectRatioPicker";
import { VibePicker } from "./VibePicker";
import { ReferencesPicker } from "./ReferencesPicker";
import { CastConfirm } from "./CastConfirm";
import { StoryboardView } from "./StoryboardView";
import { TopTabs } from "./TopTabs";
import { AudioPicker } from "./AudioPicker";
import { VisualProbePicker } from "./VisualProbePicker";

export function Workspace({ sidebarCollapsed, onOpenSidebar }: { sidebarCollapsed: boolean; onOpenSidebar: () => void }) {
  const project = useStore((s) => s.project);
  const blocks = useStore((s) => s.blocks);
  const messages = useStore((s) => s.messages);
  const active = blocks[blocks.length - 1];
  const hasStoryboard = project.scenes.length > 0;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.content.trim());

  return (
    <div className="flex h-full flex-col">
      <TopTabs sidebarCollapsed={sidebarCollapsed} onOpenSidebar={onOpenSidebar} />
      <div className="relative flex-1 overflow-hidden">
        {hasStoryboard ? (
          <StoryboardView />
        ) : active ? (
          renderBlock(active)
        ) : lastAssistant ? (
          <AgentPrompt text={lastAssistant.content} />
        ) : !project.title ? (
          <BlankState />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-tertiary text-sm">
            keep going in chat below…
          </div>
        )}
      </div>
    </div>
  );
}

function AgentPrompt({ text }: { text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-end px-6 pb-10 text-center">
      <p className="max-w-[640px] text-[22px] font-medium leading-snug text-ink">{text}</p>
      <p className="mt-3 text-[12px] uppercase tracking-wider text-ink-quaternary">reply below to keep going</p>
    </div>
  );
}

function renderBlock(b: ReturnType<typeof useStore.getState>["blocks"][number]) {
  switch (b.kind) {
    case "blank":
      return <BlankState />;
    case "ask_visual_probe":
      return <VisualProbePicker id={b.id} question={b.question} options={b.options} />;
    case "ask_vibe":
      return <VibePicker id={b.id} vibe={b.vibe} question={b.question} />;
    case "ask_aspect_ratio":
      return <AspectRatioPicker id={b.id} question={b.question} />;
    case "ask_references":
      return <ReferencesPicker id={b.id} question={b.question} />;
    case "ask_cast":
      return <CastConfirm id={b.id} suggested={b.suggested} question={b.question} />;
    case "ask_audio":
      return <AudioPicker id={b.id} question={b.question} options={b.options} />;
    case "storyboard":
      return <StoryboardView />;
    case "confirm":
      return (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p className="text-[18px] text-ink-tertiary">{b.message}</p>
        </div>
      );
  }
}
