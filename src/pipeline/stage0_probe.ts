import { probe } from "../media/ffmpeg";
import { Logger } from "../utils/logger";
import { ProbeInfo } from "../types";

export const runProbe = async (input: string, logger: Logger): Promise<ProbeInfo> => {
  logger.info(`Probing input media: ${input}`);
  const info = await probe(input);
  if (!info.audioChannels || !info.audioSampleRate) {
    throw new Error("Audio stream missing or invalid");
  }
  logger.info(`Audio channels: ${info.audioChannels}, sample rate: ${info.audioSampleRate}, duration: ${info.duration}s`);
  return info;
};
