# Data Engine

Document infrastructure for RAG: upload → parse → chunk/embed into a **hosted vector store**, then **query live via API** at retrieval time.

> **Primary delivery = API**, not a flat export file. JSONL export exists only for dev/backup.

## Delivery model

- Chunks and embeddings stay **inside the platform** (Postgres + pgvector)
- Apps retrieve ranked chunks **at query time** via `POST .../vector-store/search`
- Each result includes `content`, `score`, `file_id`, `parse_result_id`, `blocks`, and `metadata`
- Hybrid search, lexical search, and reranking are planned (MVP: **semantic only**)

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Postgres + [pgvector](https://github.com/pgvector/pgvector) via Docker
- Python **PyMuPDF** parse worker (FastAPI)
- OpenAI-compatible API for embeddings
- Prisma ORM, local file storage under `storage/`

## Pipeline

```text
Project (= vector store)
  → Upload PDF
  → Parse (PyMuPDF) → ParseResult
  → Chunk + Embed → pgvector index
  → Review (optional human QA)
  → Delivery API: semantic search
  → Optional: RAG JSONL export (dev only)
```

## Delivery API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/projects/{id}/vector-store` | Store info, counts, embedding model |
| `POST` | `/api/projects/{id}/vector-store/search` | **Primary delivery** — ranked chunks |

### Search request

```json
{
  "query": "What are the contract termination terms?",
  "top_k": 5,
  "query_type": "semantic",
  "file_id": "optional-file-id"
}
```

### Search response

```json
{
  "vector_store_id": "...",
  "project_id": "...",
  "query": "...",
  "query_type": "semantic",
  "top_k": 5,
  "chunks": [
    {
      "content": "...",
      "score": 0.87,
      "file_id": "...",
      "parse_result_id": "...",
      "metadata": { "chunk_id": "...", "page": 3, "filename": "..." },
      "blocks": [{ "type": "paragraph", "page_number": 3 }]
    }
  ]
}
```

Legacy alias: `POST /api/projects/{id}/search` (same engine, alternate shape).

## Setup

```bash
docker compose up -d --build
copy .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the project overview shows delivery API endpoints.

## Notes

- One project = one vector store (MVP simplification)
- Uploads live under `storage/`; exports under `storage/exports/`
- Parse worker: `PARSE_WORKER_URL=http://localhost:8090`

## Vercel deployment

**Live URL:** [https://dataengine-one.vercel.app](https://dataengine-one.vercel.app)

The Next.js app is deployed on Vercel, but **you still need cloud services** for a working production stack:

| Service | Local | Production |
|---------|-------|------------|
| Postgres + pgvector | Docker `db` | [Neon](https://neon.tech) or Supabase with pgvector |
| Parse worker | Docker `parse-worker` | [Railway](https://railway.app) / Render (deploy `worker/`) |
| PDF storage | `./storage` | Set `STORAGE_ROOT=/tmp/storage` (ephemeral) or add S3/Blob later |
| Embeddings | `.env` | Vercel → Settings → Environment Variables |

### Required Vercel env vars

```env
DATABASE_URL=postgresql://...   # cloud Postgres with pgvector extension
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
OPENAI_EMBEDDING_MODEL=...
PARSE_WORKER_URL=https://your-worker.railway.app
STORAGE_ROOT=/tmp/storage
```

After setting env vars, redeploy:

```bash
vercel --prod
```

Run migrations once against the cloud DB:

```bash
DATABASE_URL="..." npx prisma migrate deploy
```

> Do **not** rely on `localhost` in production. Set all secrets in the Vercel dashboard — never commit `.env`.
