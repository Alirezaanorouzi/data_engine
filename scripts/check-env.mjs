import fs from "fs";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
    }),
);

const raw = process.env.OPENAI_API_KEY || "";
const stripped = env.OPENAI_API_KEY || "";
console.log("process_env_has_quotes", raw.startsWith('"') || raw.endsWith('"'));
console.log("process_env_len", raw.length);
console.log("file_env_len", stripped.length);
console.log("match", raw === stripped);
