import { probe } from "../media/ffmpeg";
import { Logger } from "../utils/logger";
import { ProbeInfo } from "../types";

export const runProbe = async (input: string, logger: Logger): Promise<ProbeInfo> => {
  logger.info("Probing input media");
  const info = await probe(input);
  if (!info.audioChannels || !info.audioSampleRate) {
    throw new Error("Audio stream missing or invalid");
  }
  return info;
};
