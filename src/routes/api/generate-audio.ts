import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  prompt: z.string().min(1).max(2000),
  durationMs: z.number().int().min(10000).max(300000).optional(),
});

export const Route = createFileRoute("/api/generate-audio")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid input" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const { prompt, durationMs } = parsed.data;

        const key = process.env.ELEVENLABS_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({
              error:
                "ElevenLabs is not connected. Add ELEVENLABS_API_KEY to enable AI music generation.",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }

        const ms = Math.min(Math.max(durationMs ?? 20000, 10000), 300000);

        const upstream = await fetch("https://api.elevenlabs.io/v1/music", {
          method: "POST",
          headers: {
            "xi-api-key": key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, music_length_ms: ms }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(
            JSON.stringify({
              error: `ElevenLabs error ${upstream.status}`,
              upstreamMessage: text,
            }),
            {
              status: upstream.status,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const buf = await upstream.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
