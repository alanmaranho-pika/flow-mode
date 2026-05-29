export const tools = [
  {
    type: "function",
    function: {
      name: "set_brief",
      description:
        "Set the project title and one-sentence description from the user's brief. Call this as soon as you have enough to summarize the project.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short project title, 2-5 words." },
          description: { type: "string", description: "One concise sentence summarizing the video." },
        },
        required: ["title", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_visual_probe",
      description:
        "Ask a clarifying question when the answer is visual (which car? which setting? which outfit?). Renders an image grid of 3-4 generated options plus an upload tile so the user can add their own moodboard images. ALWAYS prefer this over plain-text questions when the answer can be shown.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 3,
            maxItems: 4,
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string", description: "2-4 word label, e.g. 'Lamborghini Countach'." },
                description: { type: "string" },
                imagePrompt: { type: "string", description: "Vivid one-sentence visual prompt." },
              },
              required: ["id", "label", "imagePrompt"],
            },
          },
        },
        required: ["question", "options"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_vibe",
      description:
        "Ask the user about the visual vibe / aesthetic / style. YOU choose the best presentation format: 'image_grid' (visual-heavy), 'swatch_palette' (color-driven), or 'keyword_chips' (abstract/tone-heavy).",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
          presentation: { type: "string", enum: ["image_grid", "swatch_palette", "keyword_chips"] },
          options: {
            type: "array",
            minItems: 3,
            maxItems: 4,
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                description: { type: "string" },
                imagePrompt: { type: "string" },
                colors: { type: "array", items: { type: "string" } },
                keywords: { type: "array", items: { type: "string" } },
              },
              required: ["id", "label"],
            },
          },
        },
        required: ["question", "presentation", "options"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_aspect_ratio",
      description: "Show the two tilted aspect ratio cards (vertical 9:16 and horizontal 16:9).",
      parameters: {
        type: "object",
        properties: { question: { type: "string" } },
        required: ["question"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_references",
      description: "Ask the user to upload reference images or share links/inspiration. Always call this once during info gathering.",
      parameters: {
        type: "object",
        properties: { question: { type: "string" } },
        required: ["question"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_cast",
      description:
        "Confirm the SUBJECT(s) of the video — whoever/whatever the camera is on. For a music video that's the singer; for a car commercial that's the car; for an animal documentary that's the animal. ONLY call when the brief implies a specific subject. The UI requires the user to upload or generate a portrait for each before continuing.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
          suggested: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                role: { type: "string" },
                portraitPrompt: {
                  type: "string",
                  description: "A vivid one-sentence portrait prompt the user can hit 'generate' on.",
                },
              },
              required: ["name", "role", "portraitPrompt"],
            },
          },
        },
        required: ["question", "suggested"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_audio",
      description:
        "Ask the user how the video should sound. Tailor 2-4 options to the video type. For anything where music fits, ALWAYS include one option with kind 'ai_music' (a custom track generated by AI). The description should propose a genre / tempo / mood.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                kind: {
                  type: "string",
                  enum: ["music", "ai_music", "voiceover", "sfx", "silent", "mixed"],
                },
                label: { type: "string" },
                description: { type: "string" },
              },
              required: ["id", "kind", "label"],
            },
          },
        },
        required: ["question", "options"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_storyboard",
      description:
        "Generate a storyboard of 3-5 scenes. Call this once info gathering is complete AND every cast member has a portrait.",
      parameters: {
        type: "object",
        properties: {
          scenes: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                duration: { type: "number" },
                imagePrompt: {
                  type: "string",
                  description: "Detailed visual prompt. If a cast member appears, reference them by name + role so their portrait can anchor consistency.",
                },
                castIds: {
                  type: "array",
                  items: { type: "string" },
                  description: "ids of cast members that appear in this shot (subset of project.cast).",
                },
              },
              required: ["title", "description", "duration", "imagePrompt"],
            },
          },
        },
        required: ["scenes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "confirm",
      description: "Send the user a short confirmation or status message without asking for input.",
      parameters: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"],
      },
    },
  },
];
