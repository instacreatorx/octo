import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { executeUnsafeSQL } from "./sql";

const confirmSchema = z.object({ confirm: z.literal(true).describe("You must set confirm=true to execute this write operation.") });

export const mssqlWriteTools = {
  createTableMssql: tool({
    description: "ONLY FOR MSSQL/SQL SERVER - Create a table with provided DDL in Microsoft SQL Server (MSSQL). Requires confirm=true. Use this when the user mentions MSSQL, SQL Server, or Microsoft SQL. NEVER use createTable (PostgreSQL tool) for MSSQL requests.",
    inputSchema: confirmSchema.extend({ ddl: z.string().describe("CREATE TABLE ... statement") }),
    execute: async ({ ddl }) => {
      await executeUnsafeSQL({ sql: ddl });
      return "Table created.";
    },
  }),
  createIndexMssql: tool({
    description: "ONLY FOR MSSQL/SQL SERVER - Create an index in Microsoft SQL Server (MSSQL). Requires confirm=true. Use this when the user mentions MSSQL, SQL Server, or Microsoft SQL. NEVER use createIndex (PostgreSQL tool) for MSSQL requests.",
    inputSchema: confirmSchema.extend({ ddl: z.string().describe("CREATE INDEX ... statement") }),
    execute: async ({ ddl }) => {
      await executeUnsafeSQL({ sql: ddl });
      return "Index created.";
    },
  }),
  createViewMssql: tool({
    description: "ONLY FOR MSSQL/SQL SERVER - Create a view in Microsoft SQL Server (MSSQL). Requires confirm=true. Use this when the user mentions MSSQL, SQL Server, or Microsoft SQL. NEVER use createView (PostgreSQL tool) for MSSQL requests.",
    inputSchema: confirmSchema.extend({ ddl: z.string().describe("CREATE VIEW ... AS SELECT ...") }),
    execute: async ({ ddl }) => {
      await executeUnsafeSQL({ sql: ddl });
      return "View created.";
    },
  }),
  dropObjectMssql: tool({
    description: "ONLY FOR MSSQL/SQL SERVER - Drop a table/index/view/schema object in Microsoft SQL Server (MSSQL). Requires confirm=true. Use this when the user mentions MSSQL, SQL Server, or Microsoft SQL. NEVER use dropObject (PostgreSQL tool) for MSSQL requests.",
    inputSchema: confirmSchema.extend({ ddl: z.string().describe("DROP TABLE/INDEX/VIEW ...") }),
    execute: async ({ ddl }) => {
      await executeUnsafeSQL({ sql: ddl });
      return "Object dropped.";
    },
  }),
  insertRowsMssql: tool({
    description: "ONLY FOR MSSQL/SQL SERVER - Insert rows via explicit INSERT statement in Microsoft SQL Server (MSSQL). Requires confirm=true. Use this when the user mentions MSSQL, SQL Server, or Microsoft SQL. NEVER use insertRows (PostgreSQL tool) for MSSQL requests.",
    inputSchema: confirmSchema.extend({ sql: z.string().describe("INSERT INTO ... VALUES ...") }),
    execute: async ({ sql }) => {
      const rows = await executeUnsafeSQL({ sql });
      return JSON.stringify(rows);
    },
  }),
  updateRowsMssql: tool({
    description: "ONLY FOR MSSQL/SQL SERVER - Update rows via explicit UPDATE statement in Microsoft SQL Server (MSSQL). Requires confirm=true. Use this when the user mentions MSSQL, SQL Server, or Microsoft SQL. NEVER use updateRows (PostgreSQL tool) for MSSQL requests.",
    inputSchema: confirmSchema.extend({ sql: z.string().describe("UPDATE ... SET ... WHERE ...") }),
    execute: async ({ sql }) => {
      const rows = await executeUnsafeSQL({ sql });
      return JSON.stringify(rows);
    },
  }),
  deleteRowsMssql: tool({
    description: "ONLY FOR MSSQL/SQL SERVER - Delete rows via explicit DELETE statement in Microsoft SQL Server (MSSQL). Requires confirm=true. Use this when the user mentions MSSQL, SQL Server, or Microsoft SQL. NEVER use deleteRows (PostgreSQL tool) for MSSQL requests.",
    inputSchema: confirmSchema.extend({ sql: z.string().describe("DELETE FROM ... WHERE ...") }),
    execute: async ({ sql }) => {
      const rows = await executeUnsafeSQL({ sql });
      return JSON.stringify(rows);
    },
  }),
} satisfies ToolSet;

export type MssqlWriteTools = typeof mssqlWriteTools;

