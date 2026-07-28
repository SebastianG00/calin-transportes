export type QueryRow = (string | number | null)[];
export interface QueryResult { columns: string[]; rows: QueryRow[]; summary: string; }
export interface QueryTool {
  name: string;                 // snake_case id, unique
  description: string;          // Spanish; what it answers + its params
  schema: import("zod/v4").ZodType; // validates the params object (all string-valued at the LLM boundary)
  run(params: any, db: Db): Promise<QueryResult>;
}
export interface AssistantAnswer {
  answer: string;                                             // Spanish sentence (or clarify / "no puedo")
  table: { columns: string[]; rows: QueryRow[] } | null;      // null when no query ran
  tool: string | null;                                        // the chosen tool name, or null
}
export class ClarifyError extends Error {}                    // .message is the Spanish clarify text
export type Db = ReturnType<typeof import("../../db/client.js").getServiceClient>;
