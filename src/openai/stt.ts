import fs from "fs";
import { Segment } from "../types";

export const transcribe = async (audioPath: string): Promise<Segment[]> => {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(audioPath)]), "audio.wav");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`STT failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    segments?: Array<{ start: number; end: number; text: string }>;
  };

  if (!data.segments?.length) {
    return [];
  }

  return data.segments.map((segment, index) => ({
    id: `s${String(index + 1).padStart(4, "0")}`,
    start: segment.start,
    end: segment.end,
    text: segment.text.trim(),
  }));
};
