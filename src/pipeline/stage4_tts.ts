import path from "path";
import { Logger } from "../utils/logger";
import { SegmentsRu, TtsManifest, TtsManifestEntry } from "../types";
import { synthesizeSpeech } from "../openai/tts";
import { retry } from "../utils/retry";
import { runLimited } from "../utils/concurrency";
import { writeJson } from "../cache/store";

export const runTts = async (
  segmentsRu: SegmentsRu,
  workdir: string,
  voice: string,
  rateLimit: number,
  logger: Logger
): Promise<TtsManifest> => {
  logger.info(`Generating TTS audio with voice "${voice}" for ${segmentsRu.segments.length} segments`);
  const ttsDir = path.join(workdir, "tts");

  const entries = await runLimited(
    segmentsRu.segments,
    rateLimit,
    async (segment): Promise<TtsManifestEntry> => {
      const outputPath = path.join(ttsDir, `${segment.id}.mp3`);
      try {
        await retry(() => synthesizeSpeech(segment.ru, voice, outputPath), {
          retries: 2,
          baseDelayMs: 500,
          factor: 2,
        });
        return { id: segment.id, file: outputPath, duration: 0 };
      } catch (error) {
        logger.warn(`TTS failed for ${segment.id}: ${String(error)}`);
        return { id: segment.id, file: outputPath, duration: 0, skipped: true };
      }
    }
  );

  const skipped = entries.filter((entry) => entry.skipped).length;
  logger.info(`TTS complete: ${entries.length - skipped} succeeded, ${skipped} skipped`);
  const manifest: TtsManifest = { segments: entries };
  writeJson(path.join(workdir, "tts.manifest.json"), manifest);
  logger.info("Saved tts.manifest.json");
  return manifest;
};
