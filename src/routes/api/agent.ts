import { createFileRoute } from "@tanstack/react-router";
import { tools } from "@/lib/agent/tools";
import { SYSTEM_PROMPT } from "@/lib/agent/systemPrompt";

const AGENT_MODEL = "google/gemini-3-flash-preview";

/**
 * POST /api/agent
 * Body: { transcript: TranscriptMessage[], projectState: object }
 * Streams SSE chunks straight from the Lovable AI Gateway (OpenAI format).
 * The client parses delta.content and delta.tool_calls itself.
 */
export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const requestId = `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

        const { transcript, projectState } = (await request.json()) as {
          transcript: any[];
          projectState: any;
        };

        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content: `Current project state:\n${JSON.stringify(projectState, null, 2)}`,
          },
          ...transcript,
        ];

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: AGENT_MODEL,
            messages,
            tools,
            tool_choice: "auto",
            stream: true,
          }),
          signal: request.signal,
        });

        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          console.error("agent upstream error", {
            requestId,
            model: AGENT_MODEL,
            status: upstream.status,
            body: txt,
          });
          const error =
            upstream.status === 429
              ? "Rate limit hit, try again in a moment."
              : upstream.status === 402
                ? "Out of AI credits — add some in Settings."
                : "Agent error";
          return new Response(JSON.stringify({ error, upstreamMessage: txt, requestId }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!upstream.body) {
          console.error("agent upstream missing body", {
            requestId,
            model: AGENT_MODEL,
            status: upstream.status,
          });
          return new Response(JSON.stringify({ error: "Agent response was empty", requestId }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
