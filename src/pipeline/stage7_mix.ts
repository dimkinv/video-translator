import path from "path";
import { Logger } from "../utils/logger";
import { mixAudio } from "../media/ffmpeg";

export const runMix = async (duckedAudio: string, voPath: string, workdir: string, logger: Logger): Promise<string> => {
  logger.info(`Mixing VO (${voPath}) with ducked audio (${duckedAudio})`);
  const output = path.join(workdir, "audio_mix.wav");
  await mixAudio(duckedAudio, voPath, output);
  logger.info(`Mixed audio written to ${output}`);
  return output;
};
