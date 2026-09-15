/** Dex-inspired retrieval response shapes (MVP: semantic only). */

export type QueryType = "semantic" | "lexical" | "hybrid";

export type VectorStoreChunk = {
  content: string;
  score: number;
  file_id: string;
  parse_result_id: string;
  metadata: Record<string, unknown> | null;
  blocks: { type: string; page_number: number | null }[];
};

export type VectorStoreSearchResponse = {
  vector_store_id: string;
  project_id: string;
  query: string;
  query_type: QueryType;
  top_k: number;
  chunks: VectorStoreChunk[];
};

export type VectorStoreInfo = {
  vector_store_id: string;
  project_id: string;
  name: string;
  engine: "pgvector";
  embedding_model: string;
  embedding_dimensions: number;
  query_types: QueryType[];
  delivery: "api";
  indexed_files: number;
  active_chunks: number;
  embeddings: number;
  endpoints: {
    info: string;
    search: string;
    search_in_file: string;
  };
};
