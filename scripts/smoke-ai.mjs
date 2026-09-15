import fs from "fs";
import OpenAI from "openai";

function loadEnv() {
  const envPath = new URL("../.env", import.meta.url);
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
      }),
  );
}

function normalizeKey(key) {
  if (!key) return key;
  if (key.startsWith("SK-")) return "sk-" + key.slice(3);
  return key;
}

function normalizeBaseUrl(url) {
  if (!url) return "https://sinoxapi.com/v1";
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

async function tryChat(client, model) {
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Reply with exactly: pong" }],
      max_tokens: 8,
    });
    console.log("CHAT_OK", model, "->", r.choices[0]?.message?.content?.trim());
    return true;
  } catch (e) {
    console.log("CHAT_FAIL", model, e.status, e.message);
    return false;
  }
}

async function main() {
  const env = loadEnv();
  const client = new OpenAI({
    apiKey: normalizeKey(env.OPENAI_API_KEY),
    baseURL: normalizeBaseUrl(env.OPENAI_BASE_URL),
  });

  const chatModel = env.OPENAI_CHAT_MODEL || "t-claude-opus-5";
  const embModel = env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  console.log("chatModel:", chatModel);
  console.log("embModel:", embModel);
  console.log("baseURL:", normalizeBaseUrl(env.OPENAI_BASE_URL));

  await tryChat(client, chatModel);

  try {
    const r = await client.embeddings.create({ model: embModel, input: "hello" });
    console.log("EMB_OK", embModel, "dims=", r.data[0].embedding.length);
  } catch (e) {
    console.log("EMB_FAIL", embModel, e.status, e.message);
  }
}

main().catch((e) => {
  console.error("FATAL", e.status || "", e.message);
  process.exit(1);
});
