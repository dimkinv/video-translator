import fs from "fs";
import path from "path";
import { hashFile, hashObject } from "../utils/hash";
import { PipelineSettings } from "../types";

export type Workspace = {
  root: string;
  inputHash: string;
  settingsHash: string;
};

export const createWorkspace = (input: string, settings: PipelineSettings, baseDir?: string): Workspace => {
  const inputHash = hashFile(input).slice(0, 16);
  const settingsHash = hashObject(settings).slice(0, 16);
  const root = baseDir ? path.resolve(baseDir) : path.resolve("work", inputHash);
  fs.mkdirSync(root, { recursive: true });
  return { root, inputHash, settingsHash };
};

export const readJsonIfExists = <T>(filePath: string): T | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
};

export const writeJson = (filePath: string, data: unknown): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
