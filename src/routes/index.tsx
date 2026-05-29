import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ProjectSidebar } from "@/components/sidebar/ProjectSidebar";
import { Workspace } from "@/components/workspace/Workspace";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatStream } from "@/components/chat/ChatStream";
import { ActivityLog } from "@/components/workspace/ActivityLog";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pika — make a video by chatting" },
      { name: "description", content: "Describe a video, then let Pika guide you through framing, vibe, scenes and animation." },
      { property: "og:title", content: "Pika — make a video by chatting" },
      { property: "og:description", content: "Describe a video, then let Pika guide you through framing, vibe, scenes and animation." },
    ],
  }),
  component: Editor,
});

function Editor() {
  const project = useStore((s) => s.project);
  const hasStoryboard = project.scenes.length > 0;
  const [manualCollapsed, setManualCollapsed] = useState(false);
  // sidebar auto-collapses once storyboard exists (matches Figma frame 03)
  const collapsed = manualCollapsed || hasStoryboard;

  return (
    <div className="flex h-screen w-screen bg-canvas overflow-hidden">
      <ActivityLog />
      <ProjectSidebar collapsed={collapsed} onCollapse={() => setManualCollapsed(true)} />

      <main className="relative flex flex-1 flex-col">
        <div className="flex-1 overflow-hidden">
          <Workspace sidebarCollapsed={collapsed} onOpenSidebar={() => setManualCollapsed(false)} />
        </div>

        <div className="shrink-0">
          <ChatStream />
          <ChatComposer />
        </div>
      </main>
    </div>
  );
}
