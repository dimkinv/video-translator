import path from "path";
import { translateSegments } from "../openai/translate";
import { SegmentsEn, SegmentsRu } from "../types";
import { Logger } from "../utils/logger";
import { writeJson } from "../cache/store";

export const runTranslate = async (
  segmentsEn: SegmentsEn,
  workdir: string,
  logger: Logger
): Promise<SegmentsRu> => {
  logger.info(`Translating ${segmentsEn.segments.length} segments`);
  const translated = await translateSegments(
    segmentsEn.segments.map((segment) => ({ id: segment.id, text: segment.text }))
  );
  const payload: SegmentsRu = { segments: translated };
  writeJson(path.join(workdir, "segments.ru.json"), payload);
  logger.info(`Saved segments.ru.json with ${translated.length} segments`);
  return payload;
};
