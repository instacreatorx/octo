import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { executeReadOnlySQL } from "./sql";
import { listSchemas, listTables, listColumns } from "./introspection";

export const mssqlTools = {
  listSchemasMssql: tool({
    description: "MSSQL ONLY. Use when user says: mssql, SQL Server, Microsoft SQL. Tool name: listSchemasMssql. NEVER use listSchemas (PostgreSQL) for MSSQL. List schemas in Microsoft SQL Server database.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const schemas = await listSchemas();
        return schemas.join("\n");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to list MSSQL schemas: ${errorMessage}. Please verify your MSSQL_URL connection string is correct and the database is accessible.`);
      }
    },
  }),
  listTablesMssql: tool({
    description: "MSSQL ONLY. Use when user says: mssql, SQL Server, Microsoft SQL. Tool name: listTablesMssql. NEVER use listTables (PostgreSQL) for MSSQL. List tables in MSSQL. If schema omitted, list all schemas' tables.",
    inputSchema: z.object({ schema: z.string().optional() }),
    execute: async ({ schema }) => {
      try {
        const tables = await listTables(schema);
        if (!tables.length) return "No tables found.";
        return tables.map((t) => `${t.schema}.${t.name}`).join("\n");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to list MSSQL tables: ${errorMessage}. Please verify your MSSQL_URL connection string is correct and the database is accessible.`);
      }
    },
  }),
  listColumnsMssql: tool({
    description: "MSSQL ONLY. Use when user says: mssql, SQL Server, Microsoft SQL. Tool name: listColumnsMssql. NEVER use listColumns (PostgreSQL) for MSSQL. List columns for a table in MSSQL schema.",
    inputSchema: z.object({ schema: z.string(), table: z.string() }),
    execute: async ({ schema, table }) => {
      try {
        const cols = await listColumns(schema, table);
        if (!cols.length) return "No columns found.";
        return cols
          .map((c) => `${c.tableSchema}.${c.tableName}.${c.columnName} ${c.dataType} ${c.isNullable ? "nullable" : "not null"}${c.isPrimaryKey ? " pk" : ""}`)
          .join("\n");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to list MSSQL columns: ${errorMessage}. Please verify your MSSQL_URL connection string is correct and the database is accessible.`);
      }
    },
  }),
  runReadOnlySQLMssql: tool({
    description: "MSSQL ONLY. Use when user says: mssql, SQL Server, Microsoft SQL. Tool name: runReadOnlySQLMssql. NEVER use runReadOnlySQL (PostgreSQL) for MSSQL. Execute SELECT/CTE query on MSSQL. Returns JSON rows.",
    inputSchema: z.object({ sql: z.string().describe("Read-only SQL to execute") }),
    execute: async ({ sql }) => {
      try {
        const rows = await executeReadOnlySQL({ sql });
        return JSON.stringify(rows);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to execute MSSQL query: ${errorMessage}. Please verify your MSSQL_URL connection string is correct and the database is accessible.`);
      }
    },
  }),
} satisfies ToolSet;

export type MssqlTools = typeof mssqlTools;

