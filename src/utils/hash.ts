import crypto from "crypto";
import fs from "fs";

export const hashFile = (filePath: string): string => {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
};

export const hashObject = (value: unknown): string => {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify(value));
  return hash.digest("hex");
};
