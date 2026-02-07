import path from "path";
import { extractAudio } from "../media/ffmpeg";
import { Logger } from "../utils/logger";

export type ExtractResult = {
  sttPath: string;
  srcPath: string;
};

export const runExtract = async (input: string, workdir: string, logger: Logger): Promise<ExtractResult> => {
  logger.info(`Extracting audio from ${input}`);
  const sttPath = path.join(workdir, "audio_stt.wav");
  const srcPath = path.join(workdir, "audio_src.wav");
  await extractAudio(input, sttPath, srcPath);
  logger.info(`Extracted STT audio: ${sttPath}`);
  logger.info(`Extracted source audio: ${srcPath}`);
  return { sttPath, srcPath };
};
