import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { executeReadOnlySQL } from "./sql";
import { listSchemas, listTables, listColumns } from "./introspection";

export const rdbmsTools = {
  listSchemas: tool({
    description: "POSTGRESQL ONLY. Use when user says: postgres, PostgreSQL, pg. Tool name: listSchemas (NO Mssql suffix). NEVER use for MSSQL - use listSchemasMssql instead. List schemas in PostgreSQL database.",
    inputSchema: z.object({}),
    execute: async () => {
      const schemas = await listSchemas();
      return schemas.join("\n");
    },
  }),
  listTables: tool({
    description: "ONLY FOR POSTGRESQL - List tables in PostgreSQL. If schema is omitted, list all schemas' tables. DO NOT use this for MSSQL/SQL Server - use listTablesMssql instead.",
    inputSchema: z.object({ schema: z.string().optional() }),
    execute: async ({ schema }) => {
      const tables = await listTables(schema);
      if (!tables.length) return "No tables found.";
      return tables.map((t) => `${t.schema}.${t.name}`).join("\n");
    },
  }),
  listColumns: tool({
    description: "ONLY FOR POSTGRESQL - List columns for a given table in a schema in PostgreSQL. DO NOT use this for MSSQL/SQL Server - use listColumnsMssql instead.",
    inputSchema: z.object({ schema: z.string(), table: z.string() }),
    execute: async ({ schema, table }) => {
      const cols = await listColumns(schema, table);
      if (!cols.length) return "No columns found.";
      return cols
        .map((c) => `${c.tableSchema}.${c.tableName}.${c.columnName} ${c.dataType} ${c.isNullable ? "nullable" : "not null"}${c.isPrimaryKey ? " pk" : ""}`)
        .join("\n");
    },
  }),
  runReadOnlySQL: tool({
    description: "ONLY FOR POSTGRESQL - Execute a read-only SQL query (SELECT/CTE) on PostgreSQL. Returns JSON rows. DO NOT use this for MSSQL/SQL Server - use runReadOnlySQLMssql instead.",
    inputSchema: z.object({ sql: z.string().describe("Read-only SQL to execute") }),
    execute: async ({ sql }) => {
      const rows = await executeReadOnlySQL({ sql });
      return JSON.stringify(rows);
    },
  }),
} satisfies ToolSet;

export type RdbmsTools = typeof rdbmsTools;


