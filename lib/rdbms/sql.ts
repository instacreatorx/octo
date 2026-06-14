import { withClient } from "./client";

export interface QueryResultRow {
  [column: string]: unknown;
}

export interface ExecuteSQLParams {
  sql: string;
  values?: unknown[];
}

const MUTATING_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "alter",
  "truncate",
  "create",
  "drop",
  "grant",
  "revoke",
];

export function isDangerousSQL(sql: string): boolean {
  const normalized = sql.trim().toLowerCase();
  return MUTATING_KEYWORDS.some((kw) => normalized.startsWith(kw) || normalized.includes(` ${kw} `));
}

export async function executeReadOnlySQL<T extends QueryResultRow = QueryResultRow>({ sql, values = [] }: ExecuteSQLParams): Promise<T[]> {
  if (isDangerousSQL(sql)) {
    throw new Error("Only read-only queries are allowed in this endpoint.");
  }
  return withClient(async (client) => {
    const { rows } = await client.query<T>(sql, values as any[]);
    return rows;
  });
}

export async function executeUnsafeSQL<T extends QueryResultRow = QueryResultRow>({ sql, values = [] }: ExecuteSQLParams): Promise<T[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<T>(sql, values as any[]);
    return rows;
  });
}


