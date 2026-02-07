export type Segment = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type SegmentTranslation = {
  id: string;
  ru: string;
};

export type TtsManifestEntry = {
  id: string;
  file: string;
  duration: number;
  skipped?: boolean;
};

export type SegmentsEn = {
  video: string;
  audio: string;
  segments: Segment[];
};

export type SegmentsRu = {
  segments: SegmentTranslation[];
};

export type TtsManifest = {
  segments: TtsManifestEntry[];
};

export type DuckWindow = {
  start: number;
  end: number;
};

export type DuckWindows = {
  windows: DuckWindow[];
};

export type PipelineSettings = {
  mode: "replace" | "dual";
  duckDb: number;
  duckAttack: number;
  duckRelease: number;
  padStart: number;
  padEnd: number;
  segmentMaxSec: number;
  ttsVoice: string;
  rateLimit: number;
  resume: boolean;
  workdir?: string;
  maxStretch: number;
};

export type ProbeInfo = {
  duration: number;
  audioSampleRate: number;
  audioChannels: number;
};

export type RunReport = {
  input: string;
  output: string;
  workdir: string;
  settings: PipelineSettings;
  warnings: string[];
  stats: Record<string, number | string>;
};
