import { Logger } from "../utils/logger";
import { muxVideo } from "../media/ffmpeg";

export const runMux = async (
  inputVideo: string,
  audioMix: string,
  output: string,
  mode: "replace" | "dual",
  originalAudio: string | undefined,
  logger: Logger
): Promise<void> => {
  logger.info(`Muxing output video (${mode} mode) to ${output}`);
  await muxVideo(inputVideo, audioMix, output, mode, originalAudio);
  logger.info(`Muxed video written to ${output}`);
};
