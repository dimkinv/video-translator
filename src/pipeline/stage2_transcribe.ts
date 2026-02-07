import path from "path";
import { transcribe } from "../openai/stt";
import { SegmentsEn, Segment } from "../types";
import { Logger } from "../utils/logger";
import { writeJson } from "../cache/store";

const normalizeSegments = (segments: Segment[], maxDuration: number): Segment[] => {
  const normalized: Segment[] = [];
  for (const segment of segments) {
    if (!segment.text.trim()) {
      continue;
    }
    const duration = segment.end - segment.start;
    if (duration <= maxDuration) {
      normalized.push({ ...segment, text: segment.text.trim() });
      continue;
    }
    const parts = Math.ceil(duration / maxDuration);
    const step = duration / parts;
    for (let i = 0; i < parts; i += 1) {
      normalized.push({
        id: `${segment.id}_p${i + 1}`,
        start: segment.start + step * i,
        end: segment.start + step * (i + 1),
        text: segment.text.trim(),
      });
    }
  }
  return normalized;
};

export const runTranscribe = async (
  inputVideo: string,
  audioPath: string,
  workdir: string,
  maxDuration: number,
  logger: Logger
): Promise<SegmentsEn> => {
  logger.info("Transcribing audio");
  const segments = await transcribe(audioPath);
  const normalized = normalizeSegments(segments, maxDuration);
  if (normalized.length === 0) {
    throw new Error("No speech segments detected");
  }
  const payload: SegmentsEn = {
    video: inputVideo,
    audio: audioPath,
    segments: normalized,
  };
  writeJson(path.join(workdir, "segments.en.json"), payload);
  return payload;
};
