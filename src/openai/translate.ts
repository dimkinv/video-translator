import { SegmentTranslation } from "../types";

export const translateSegments = async (segments: { id: string; text: string }[]): Promise<SegmentTranslation[]> => {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Translate English speech segments into natural spoken Russian. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({ segments }, null, 2),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Translation returned empty content");
  }
  const parsed = JSON.parse(content) as { segments: SegmentTranslation[] };
  return parsed.segments ?? [];
};
