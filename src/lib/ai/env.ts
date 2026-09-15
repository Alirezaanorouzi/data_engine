import { readFileSync } from "node:fs";
import path from "node:path";

let fileEnv: Record<string, string> | null = null;

function loadEnvFile() {
  if (fileEnv) return fileEnv;
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    fileEnv = Object.fromEntries(
      raw
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const i = line.indexOf("=");
          return [
            line.slice(0, i),
            line.slice(i + 1).replace(/^["']|["']$/g, ""),
          ];
        }),
    );
  } catch {
    fileEnv = {};
  }
  return fileEnv;
}

/** In dev, prefer `.env` file over inherited shell env (avoids stale keys on Windows). */
export function aiEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (process.env.NODE_ENV === "production") return fromProcess;
  const fromFile = loadEnvFile()[name];
  return fromFile || fromProcess;
}
