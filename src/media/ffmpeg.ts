import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { DuckWindow, ProbeInfo } from "../types";

const runProcess = (command: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
};

export const probe = async (input: string): Promise<ProbeInfo> => {
  const args = [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "stream=sample_rate,channels,duration",
    "-of",
    "json",
    input,
  ];
  const outputFile = `${input}.probe.json`;
  const proc = spawn("ffprobe", [...args, "-o", outputFile]);
  const code = await new Promise<number>((resolve, reject) => {
    proc.on("error", reject);
    proc.on("close", (status) => resolve(status ?? 1));
  });
  if (code !== 0) {
    throw new Error("ffprobe failed");
  }
  const raw = JSON.parse(fs.readFileSync(outputFile, "utf-8")) as {
    streams?: Array<{ sample_rate?: string; channels?: number; duration?: string }>;
  };
  if (!raw.streams?.length) {
    throw new Error("No audio stream found");
  }
  const stream = raw.streams[0];
  return {
    duration: Number(stream.duration ?? 0),
    audioSampleRate: Number(stream.sample_rate ?? 0),
    audioChannels: Number(stream.channels ?? 0),
  };
};

export const extractAudio = async (input: string, sttPath: string, srcPath: string): Promise<void> => {
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    input,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    sttPath,
  ]);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    input,
    "-vn",
    "-ac",
    "2",
    "-ar",
    "48000",
    srcPath,
  ]);
};

export const buildVolumeExpression = (windows: DuckWindow[], duckDb: number): string => {
  if (windows.length === 0) {
    return "1";
  }
  const duckGain = Math.pow(10, duckDb / 20);
  const conditions = windows
    .map((window) => `between(t,${window.start.toFixed(3)},${window.end.toFixed(3)})`)
    .join("+");
  return `if(${conditions},${duckGain.toFixed(6)},1)`;
};

export const applyDucking = async (
  input: string,
  output: string,
  windows: DuckWindow[],
  duckDb: number
): Promise<void> => {
  const expr = buildVolumeExpression(windows, duckDb);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    input,
    "-af",
    `volume='${expr}':eval=frame`,
    output,
  ]);
};

export const concatAudio = async (inputs: string[], output: string): Promise<void> => {
  const listPath = `${output}.txt`;
  fs.writeFileSync(listPath, inputs.map((file) => `file '${path.resolve(file)}'`).join("\n"));
  await runProcess("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", output]);
};

export const mixAudio = async (background: string, voice: string, output: string): Promise<void> => {
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    background,
    "-i",
    voice,
    "-filter_complex",
    "[0:a][1:a]amix=inputs=2:duration=longest",
    output,
  ]);
};

export const createSilence = async (duration: number, output: string): Promise<void> => {
  await runProcess("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-t",
    duration.toFixed(3),
    "-i",
    "anullsrc=channel_layout=stereo:sample_rate=48000",
    output,
  ]);
};

export const getAudioDuration = async (input: string): Promise<number> => {
  const outputFile = `${input}.duration.json`;
  const args = [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "stream=duration",
    "-of",
    "json",
    input,
    "-o",
    outputFile,
  ];
  const proc = spawn("ffprobe", args);
  const code = await new Promise<number>((resolve, reject) => {
    proc.on("error", reject);
    proc.on("close", (status) => resolve(status ?? 1));
  });
  if (code !== 0) {
    throw new Error(`ffprobe failed for ${input}`);
  }
  const raw = JSON.parse(fs.readFileSync(outputFile, "utf-8")) as {
    streams?: Array<{ duration?: string }>;
  };
  return Number(raw.streams?.[0]?.duration ?? 0);
};

export const muxVideo = async (
  video: string,
  audioMix: string,
  output: string,
  mode: "replace" | "dual",
  originalAudio?: string
): Promise<void> => {
  const args = ["-y", "-i", video, "-i", audioMix];
  if (mode === "dual" && originalAudio) {
    args.push("-i", originalAudio);
  }
  if (mode === "dual" && originalAudio) {
    args.push(
      "-map",
      "0:v",
      "-map",
      "2:a",
      "-map",
      "1:a",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      output
    );
  } else {
    args.push("-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", output);
  }
  await runProcess("ffmpeg", args);
};
