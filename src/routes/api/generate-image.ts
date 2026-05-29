import { createFileRoute } from "@tanstack/react-router";

const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

/**
 * POST /api/generate-image
 * Body: { prompt: string, aspect?: "16:9" | "9:16", referenceImageUrls?: string[] }
 *
 * Gemini Nano-Banana 2 supports multi-image input in chat-completions shape —
 * we attach reference images (e.g. cast portraits) so character likeness
 * stays consistent across scenes.
 */
export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const requestId = `image_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const { prompt, aspect, referenceImageUrls } = (await request.json()) as {
          prompt: string;
          aspect?: "16:9" | "9:16";
          referenceImageUrls?: string[];
        };

        const aspectHint =
          aspect === "9:16"
            ? " Aspect ratio: 9:16, vertical."
            : aspect === "16:9"
              ? " Aspect ratio: 16:9, widescreen."
              : " Aspect ratio: 1:1, square.";

        const refs = (referenceImageUrls ?? []).filter((u) => typeof u === "string" && u.length > 0);
        const userContent: any[] = [];
        if (refs.length) {
          userContent.push({
            type: "text",
            text:
              "Reference image" +
              (refs.length > 1 ? "s" : "") +
              " for character likeness — keep the same person consistent across shots:",
          });
          for (const url of refs) {
            userContent.push({ type: "image_url", image_url: { url } });
          }
        }
        userContent.push({ type: "text", text: prompt + aspectHint });

        const body = {
          model: IMAGE_MODEL,
          messages: [{ role: "user", content: refs.length ? userContent : prompt + aspectHint }],
          modalities: ["image", "text"],
        };

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: request.signal,
        });

        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          console.error("image upstream error", { requestId, model: IMAGE_MODEL, status: upstream.status, body: txt });
          return new Response(JSON.stringify({ error: "Image generation failed", upstreamMessage: txt, requestId }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }
        const json: any = await upstream.json();
        const b64 = json?.data?.[0]?.b64_json;
        const url = json?.data?.[0]?.url;
        const out = b64 ? `data:image/png;base64,${b64}` : url;
        return Response.json({ url: out });
      },
    },
  },
});
