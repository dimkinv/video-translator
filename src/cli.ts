import path from "path";
import fs from "fs";
import { createLogger } from "./utils/logger";
import { loadEnv } from "./utils/env";
import { createWorkspace, readJsonIfExists, writeJson } from "./cache/store";
import { runProbe } from "./pipeline/stage0_probe";
import { runExtract } from "./pipeline/stage1_extract";
import { runTranscribe } from "./pipeline/stage2_transcribe";
import { runTranslate } from "./pipeline/stage3_translate";
import { runTts } from "./pipeline/stage4_tts";
import { runTimeline } from "./pipeline/stage5_timeline";
import { runDucking } from "./pipeline/stage6_duck";
import { runMix } from "./pipeline/stage7_mix";
import { runMux } from "./pipeline/stage8_mux";
import { PipelineSettings, RunReport, SegmentsEn, SegmentsRu, TtsManifest } from "./types";

const parseArgs = (argv: string[]): { input: string; output: string; settings: PipelineSettings } => {
  const defaults: PipelineSettings = {
    mode: "dual",
    duckDb: -18,
    duckAttack: 0.05,
    duckRelease: 0.25,
    padStart: 0.15,
    padEnd: 0.25,
    segmentMaxSec: 6,
    ttsVoice: "alloy",
    rateLimit: 3,
    resume: false,
    workdir: undefined,
    maxStretch: 1.12,
  };

  const args = [...argv];
  const input = args.shift();
  if (!input) {
    throw new Error("Input video is required");
  }
  let output = "";
  while (args.length) {
    const arg = args.shift();
    if (!arg) {
      continue;
    }
    switch (arg) {
      case "--out":
        output = args.shift() ?? "";
        break;
      case "--mode":
        defaults.mode = (args.shift() as PipelineSettings["mode"]) ?? defaults.mode;
        break;
      case "--duckDb":
        defaults.duckDb = Number(args.shift() ?? defaults.duckDb);
        break;
      case "--duckAttack":
        defaults.duckAttack = Number(args.shift() ?? defaults.duckAttack);
        break;
      case "--duckRelease":
        defaults.duckRelease = Number(args.shift() ?? defaults.duckRelease);
        break;
      case "--padStart":
        defaults.padStart = Number(args.shift() ?? defaults.padStart);
        break;
      case "--padEnd":
        defaults.padEnd = Number(args.shift() ?? defaults.padEnd);
        break;
      case "--segmentMaxSec":
        defaults.segmentMaxSec = Number(args.shift() ?? defaults.segmentMaxSec);
        break;
      case "--ttsVoice":
        defaults.ttsVoice = args.shift() ?? defaults.ttsVoice;
        break;
      case "--rateLimit":
        defaults.rateLimit = Number(args.shift() ?? defaults.rateLimit);
        break;
      case "--resume":
        defaults.resume = true;
        break;
      case "--workdir":
        defaults.workdir = args.shift() ?? defaults.workdir;
        break;
      default:
        break;
    }
  }

  if (!output) {
    throw new Error("--out is required");
  }

  return { input, output, settings: defaults };
};

const main = async () => {
  loadEnv();
  const { input, output, settings } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(input)) {
    throw new Error(`Input file not found: ${input}`);
  }

  const workspace = createWorkspace(input, settings, settings.workdir);
  const logFile = path.join(workspace.root, "run.log");
  const logger = createLogger(logFile);

  const report: RunReport = {
    input,
    output,
    workdir: workspace.root,
    settings,
    warnings: [],
    stats: {},
  };

  await runProbe(input, logger);

  const { sttPath, srcPath } = await runExtract(input, workspace.root, logger);

  const segmentsEn =
    (settings.resume && readJsonIfExists<SegmentsEn>(path.join(workspace.root, "segments.en.json"))) ??
    (await runTranscribe(input, sttPath, workspace.root, settings.segmentMaxSec, logger));

  const segmentsRu =
    (settings.resume && readJsonIfExists<SegmentsRu>(path.join(workspace.root, "segments.ru.json"))) ??
    (await runTranslate(segmentsEn, workspace.root, logger));

  const ttsManifest =
    (settings.resume && readJsonIfExists<TtsManifest>(path.join(workspace.root, "tts.manifest.json"))) ??
    (await runTts(segmentsRu, workspace.root, settings.ttsVoice, settings.rateLimit, logger));

  const { voPath } = await runTimeline(segmentsEn, ttsManifest, workspace.root, logger);

  const duckedAudio = await runDucking(
    segmentsEn.segments,
    srcPath,
    workspace.root,
    settings.duckDb,
    settings.padStart,
    settings.padEnd,
    logger
  );

  const mixedAudio = await runMix(duckedAudio, voPath, workspace.root, logger);

  await runMux(input, mixedAudio, output, settings.mode, settings.mode === "dual" ? srcPath : undefined, logger);

  writeJson(path.join(workspace.root, "report.json"), report);
  logger.info(`Completed: ${output}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
