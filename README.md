# Video Tranator

Video Tranator is a CLI pipeline that extracts audio from a video, transcribes it, translates the segments, synthesizes voice-over, and muxes the result back into a new video file.

## Requirements

- Node.js 18+ (for built-in `fetch`, `FormData`, and `Blob`)
- FFmpeg + FFprobe available in your `PATH`
- OpenAI API key (Whisper + TTS)

## Install

1. Clone the repository.
2. Copy the environment template and set your API key:

   ```bash
   cp .env.example .env
   # edit .env and set OPENAI_API_KEY=...
   ```

3. Install a TypeScript runner (one of the following):

   ```bash
   # ad-hoc run via npx
   npx tsx --version

   # or install locally
   npm install -D tsx typescript
   ```

## Usage

```bash
npx tsx src/cli.ts /path/to/input.mp4 --out /path/to/output.mp4
```

### Common options

- `--mode dual|replace` (default: `dual`)
  - `dual` keeps the original audio as track 1 and the synthesized track as track 2.
  - `replace` replaces the original audio.
- `--segmentMaxSec 6` Max duration (seconds) for each transcription segment.
- `--ttsVoice alloy` Voice for TTS.
- `--rateLimit 3` Maximum concurrent TTS requests.
- `--resume` Reuse cached artifacts from a previous run.
- `--workdir /tmp/video-tranator` Custom workspace folder.

Example with explicit settings:

```bash
npx tsx src/cli.ts input.mp4 --out output.mp4 --mode dual --ttsVoice alloy --rateLimit 2 --segmentMaxSec 6
```

## Logs and artifacts

Each run creates a workspace directory that includes:

- `run.log` – log output for each pipeline stage.
- `segments.en.json` / `segments.ru.json` – transcription and translation artifacts.
- `tts/` – synthesized audio clips.
- `tts.manifest.json`, `windows.json`, `audio_*.wav` – intermediate files.
- `report.json` – a summary report.

To follow the pipeline flow, tail the log file:

```bash
tail -f /path/to/workdir/run.log
```
