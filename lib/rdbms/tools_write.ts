import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { executeUnsafeSQL } from "./sql";

const confirmSchema = z.object({ confirm: z.literal(true).describe("You must set confirm=true to execute this write operation.") });

export const rdbmsWriteTools = {
  createTable: tool({
    description: "ONLY FOR POSTGRESQL - Create a table with provided DDL in PostgreSQL. Requires confirm=true. DO NOT use this for MSSQL/SQL Server - use createTableMssql instead.",
    inputSchema: confirmSchema.extend({ ddl: z.string().describe("CREATE TABLE ... statement") }),
    execute: async ({ ddl }) => {
      await executeUnsafeSQL({ sql: ddl });
      return "Table created.";
    },
  }),
  createIndex: tool({
    description: "ONLY FOR POSTGRESQL - Create an index in PostgreSQL. Requires confirm=true. DO NOT use this for MSSQL/SQL Server - use createIndexMssql instead.",
    inputSchema: confirmSchema.extend({ ddl: z.string().describe("CREATE INDEX ... statement") }),
    execute: async ({ ddl }) => {
      await executeUnsafeSQL({ sql: ddl });
      return "Index created.";
    },
  }),
  createView: tool({
    description: "ONLY FOR POSTGRESQL - Create a view in PostgreSQL. Requires confirm=true. DO NOT use this for MSSQL/SQL Server - use createViewMssql instead.",
    inputSchema: confirmSchema.extend({ ddl: z.string().describe("CREATE VIEW ... AS SELECT ...") }),
    execute: async ({ ddl }) => {
      await executeUnsafeSQL({ sql: ddl });
      return "View created.";
    },
  }),
  dropObject: tool({
    description: "ONLY FOR POSTGRESQL - Drop a table/index/view/schema object in PostgreSQL. Requires confirm=true. DO NOT use this for MSSQL/SQL Server - use dropObjectMssql instead.",
    inputSchema: confirmSchema.extend({ ddl: z.string().describe("DROP TABLE/INDEX/VIEW ...") }),
    execute: async ({ ddl }) => {
      await executeUnsafeSQL({ sql: ddl });
      return "Object dropped.";
    },
  }),
  insertRows: tool({
    description: "ONLY FOR POSTGRESQL - Insert rows via explicit INSERT statement in PostgreSQL. Requires confirm=true. DO NOT use this for MSSQL/SQL Server - use insertRowsMssql instead.",
    inputSchema: confirmSchema.extend({ sql: z.string().describe("INSERT INTO ... VALUES ...") }),
    execute: async ({ sql }) => {
      const rows = await executeUnsafeSQL({ sql });
      return JSON.stringify(rows);
    },
  }),
  updateRows: tool({
    description: "ONLY FOR POSTGRESQL - Update rows via explicit UPDATE statement in PostgreSQL. Requires confirm=true. DO NOT use this for MSSQL/SQL Server - use updateRowsMssql instead.",
    inputSchema: confirmSchema.extend({ sql: z.string().describe("UPDATE ... SET ... WHERE ...") }),
    execute: async ({ sql }) => {
      const rows = await executeUnsafeSQL({ sql });
      return JSON.stringify(rows);
    },
  }),
  deleteRows: tool({
    description: "ONLY FOR POSTGRESQL - Delete rows via explicit DELETE statement in PostgreSQL. Requires confirm=true. DO NOT use this for MSSQL/SQL Server - use deleteRowsMssql instead.",
    inputSchema: confirmSchema.extend({ sql: z.string().describe("DELETE FROM ... WHERE ...") }),
    execute: async ({ sql }) => {
      const rows = await executeUnsafeSQL({ sql });
      return JSON.stringify(rows);
    },
  }),
} satisfies ToolSet;

export type RdbmsWriteTools = typeof rdbmsWriteTools;


