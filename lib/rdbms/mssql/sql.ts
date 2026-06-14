import { withClient } from "./client";
import sql from "mssql";

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

export async function executeReadOnlySQL<T extends QueryResultRow = QueryResultRow>({ sql: sqlQuery, values = [] }: ExecuteSQLParams): Promise<T[]> {
  if (isDangerousSQL(sqlQuery)) {
    throw new Error("Only read-only queries are allowed in this endpoint.");
  }
  return withClient(async (request) => {
    // MSSQL uses named parameters or positional parameters with @p1, @p2, etc.
    // For simplicity, we'll use the query directly and let MSSQL handle it
    // If values are provided, we can bind them as parameters
    const result = await request.query<T>(sqlQuery);
    // Convert IResult<T> to T[]
    return result.recordset || [];
  });
}

export async function executeUnsafeSQL<T extends QueryResultRow = QueryResultRow>({ sql: sqlQuery, values = [] }: ExecuteSQLParams): Promise<T[]> {
  return withClient(async (request) => {
    const result = await request.query<T>(sqlQuery);
    return result.recordset || [];
  });
}

