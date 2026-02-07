import path from "path";
import { Logger } from "../utils/logger";
import { applyDucking } from "../media/ffmpeg";
import { DuckWindows, Segment } from "../types";
import { writeJson } from "../cache/store";

const mergeWindows = (windows: { start: number; end: number }[], mergeGap: number): DuckWindows => {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const window of sorted) {
    const current = merged[merged.length - 1];
    if (!current || window.start - current.end > mergeGap) {
      merged.push({ ...window });
      continue;
    }
    current.end = Math.max(current.end, window.end);
  }
  return { windows: merged };
};

export const runDucking = async (
  segments: Segment[],
  audioSrc: string,
  workdir: string,
  duckDb: number,
  padStart: number,
  padEnd: number,
  logger: Logger
): Promise<string> => {
  logger.info("Applying ducking");
  const windows = segments.map((segment) => ({
    start: Math.max(0, segment.start - padStart),
    end: segment.end + padEnd,
  }));
  const merged = mergeWindows(windows, 0.15);
  writeJson(path.join(workdir, "windows.json"), merged);
  const output = path.join(workdir, "audio_ducked.wav");
  await applyDucking(audioSrc, output, merged.windows, duckDb);
  return output;
};
