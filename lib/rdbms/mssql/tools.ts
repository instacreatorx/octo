import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { toolFail, toolOk } from "@/lib/tool-result";
import { executeReadOnlySQL } from "./sql";
import { listSchemas, listTables, listColumns } from "./introspection";

export const mssqlTools = {
  listSchemasMssql: tool({
    description: "MSSQL ONLY. Use when user says: mssql, SQL Server, Microsoft SQL. Tool name: listSchemasMssql. NEVER use listSchemas (PostgreSQL) for MSSQL. List schemas in Microsoft SQL Server database.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const schemas = await listSchemas();
        return toolOk(schemas, `Found ${schemas.length} schema${schemas.length === 1 ? "" : "s"}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toolFail(
          `Failed to list MSSQL schemas: ${errorMessage}. Please verify your MSSQL_URL connection string is correct and the database is accessible.`,
          "Could not list schemas",
        );
      }
    },
  }),
  listTablesMssql: tool({
    description: "MSSQL ONLY. Use when user says: mssql, SQL Server, Microsoft SQL. Tool name: listTablesMssql. NEVER use listTables (PostgreSQL) for MSSQL. List tables in MSSQL. If schema omitted, list all schemas' tables.",
    inputSchema: z.object({
      schema: z
        .string()
        .nullish()
        .describe("Optional schema name. Omit or leave empty to list all tables."),
    }),
    execute: async ({ schema }) => {
      try {
        const tables = await listTables(schema ?? undefined);
        const names = tables.map((t) => `${t.schema}.${t.name}`);
        return toolOk(
          names,
          names.length
            ? `Found ${names.length} table${names.length === 1 ? "" : "s"}`
            : "No tables found",
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toolFail(
          `Failed to list MSSQL tables: ${errorMessage}. Please verify your MSSQL_URL connection string is correct and the database is accessible.`,
          "Could not list tables",
        );
      }
    },
  }),
  listColumnsMssql: tool({
    description: "MSSQL ONLY. Use when user says: mssql, SQL Server, Microsoft SQL. Tool name: listColumnsMssql. NEVER use listColumns (PostgreSQL) for MSSQL. List columns for a table in MSSQL schema.",
    inputSchema: z.object({ schema: z.string(), table: z.string() }),
    execute: async ({ schema, table }) => {
      try {
        const cols = await listColumns(schema, table);
        const lines = cols.map(
          (c) =>
            `${c.tableSchema}.${c.tableName}.${c.columnName} ${c.dataType} ${c.isNullable ? "nullable" : "not null"}${c.isPrimaryKey ? " pk" : ""}`,
        );
        return toolOk(
          lines,
          lines.length
            ? `Found ${lines.length} column${lines.length === 1 ? "" : "s"}`
            : "No columns found",
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toolFail(
          `Failed to list MSSQL columns: ${errorMessage}. Please verify your MSSQL_URL connection string is correct and the database is accessible.`,
          "Could not list columns",
        );
      }
    },
  }),
  runReadOnlySQLMssql: tool({
    description: "MSSQL ONLY. Use when user says: mssql, SQL Server, Microsoft SQL. Tool name: runReadOnlySQLMssql. NEVER use runReadOnlySQL (PostgreSQL) for MSSQL. Execute SELECT/CTE query on MSSQL. Returns JSON rows.",
    inputSchema: z.object({ sql: z.string().describe("Read-only SQL to execute") }),
    execute: async ({ sql }) => {
      try {
        const rows = await executeReadOnlySQL({ sql });
        const count = Array.isArray(rows) ? rows.length : 0;
        return toolOk(
          rows,
          `Query returned ${count} row${count === 1 ? "" : "s"}`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toolFail(
          `Failed to execute MSSQL query: ${errorMessage}. Please verify your MSSQL_URL connection string is correct and the database is accessible.`,
          "Query failed",
        );
      }
    },
  }),
} satisfies ToolSet;

export type MssqlTools = typeof mssqlTools;

