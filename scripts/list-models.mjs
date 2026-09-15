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

async function main() {
  const env = loadEnv();
  const client = new OpenAI({
    apiKey: normalizeKey(env.OPENAI_API_KEY),
    baseURL: normalizeBaseUrl(env.OPENAI_BASE_URL),
  });

  const models = await client.models.list();
  const ids = models.data.map((m) => m.id).sort();
  console.log("MODEL_COUNT", ids.length);

  const preferred = ids.filter((id) =>
    /claude-opus|claude-sonnet|claude|opus-5|gpt-5|gpt-4o|gemini|deepseek|qwen|embed/i.test(
      id,
    ),
  );
  console.log("PREFERRED", preferred.join("\n"));

  const chatOrder = [
    "t-claude-opus-5",
    "t-claude-sonnet-5",
    "t-claude-opus-4-8",
    "t-gpt-5.6-sol",
    "t-gpt-5.5",
    "claude-opus-5",
    "gpt-4o",
  ];
  const chatModel =
    chatOrder.find((m) => ids.includes(m)) ||
    preferred.find(
      (id) =>
        /claude|gpt|gemini|qwen|deepseek/i.test(id) &&
        !/embed|whisper|tts|dall|moderation|vision-only/i.test(id),
    );

  const embModel =
    ids.find((id) => /text-embedding-3-small|embedding-3-small|embed/i.test(id)) ||
    preferred.find((id) => /embed/i.test(id));

  if (chatModel) {
    const r = await client.chat.completions.create({
      model: chatModel,
      messages: [{ role: "user", content: "Reply with exactly: pong" }],
      max_tokens: 8,
    });
    console.log("CHAT_OK", chatModel, "->", r.choices[0]?.message?.content);
  }

  if (embModel) {
    const r = await client.embeddings.create({ model: embModel, input: "hello" });
    console.log("EMB_OK", embModel, "dims=", r.data[0].embedding.length);
  }

  console.log(
    "RECOMMENDED_ENV",
    JSON.stringify(
      {
        OPENAI_BASE_URL: normalizeBaseUrl(env.OPENAI_BASE_URL),
        OPENAI_CHAT_MODEL: chatModel,
        OPENAI_EMBEDDING_MODEL: embModel,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("FATAL", e.status || "", e.message);
  process.exit(1);
});
