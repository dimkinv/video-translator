import path from "path";
import fs from "fs";
import { Logger } from "../utils/logger";
import { SegmentsEn, TtsManifest } from "../types";
import { concatAudio, createSilence, getAudioDuration } from "../media/ffmpeg";

export type TimelineResult = {
  voPath: string;
};

export const runTimeline = async (
  segmentsEn: SegmentsEn,
  ttsManifest: TtsManifest,
  workdir: string,
  logger: Logger
): Promise<TimelineResult> => {
  logger.info(`Building VO timeline from ${segmentsEn.segments.length} segments`);
  const timelineFiles: string[] = [];
  let cursor = 0;

  for (const segment of segmentsEn.segments) {
    const tts = ttsManifest.segments.find((entry) => entry.id === segment.id);
    if (!tts || tts.skipped || !fs.existsSync(tts.file)) {
      continue;
    }
    if (segment.start > cursor) {
      const silencePath = path.join(workdir, `silence_${segment.id}.wav`);
      await createSilence(segment.start - cursor, silencePath);
      timelineFiles.push(silencePath);
      cursor = segment.start;
    }
    timelineFiles.push(tts.file);
    const duration = await getAudioDuration(tts.file);
    cursor += duration;
  }

  const voPath = path.join(workdir, "vo.wav");
  if (timelineFiles.length === 0) {
    await createSilence(0.1, voPath);
    logger.warn("No TTS clips found, generated short silence track");
    return { voPath };
  }
  await concatAudio(timelineFiles, voPath);
  logger.info(`VO timeline assembled with ${timelineFiles.length} clips`);
  logger.info(`VO track written to ${voPath}`);
  return { voPath };
};
