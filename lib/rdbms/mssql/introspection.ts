import { withClient } from "./client";
import sql from "mssql";

export interface TableInfo {
  schema: string;
  name: string;
}

export interface ColumnInfo {
  tableSchema: string;
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

export async function listSchemas(): Promise<string[]> {
  return withClient(async (request) => {
    const result = await request.query<{ SCHEMA_NAME: string }>(
      `SELECT DISTINCT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA ORDER BY SCHEMA_NAME`
    );
    return result.recordset.map((r) => r.SCHEMA_NAME);
  });
}

export async function listTables(schema?: string): Promise<TableInfo[]> {
  return withClient(async (request) => {
    let query: string;
    if (schema) {
      query = `
        SELECT TABLE_SCHEMA, TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = @schema
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `;
      request.input('schema', sql.NVarChar, schema);
    } else {
      query = `
        SELECT TABLE_SCHEMA, TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `;
    }
    const result = await request.query<{ TABLE_SCHEMA: string; TABLE_NAME: string }>(query);
    return result.recordset.map((r) => ({ schema: r.TABLE_SCHEMA, name: r.TABLE_NAME }));
  });
}

export async function listColumns(schema: string, table: string): Promise<ColumnInfo[]> {
  return withClient(async (request) => {
    request.input('schema', sql.NVarChar, schema);
    request.input('table', sql.NVarChar, table);
    
    const result = await request.query<{
      TABLE_SCHEMA: string;
      TABLE_NAME: string;
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
      IS_PRIMARY_KEY: number;
    }>(
      `
      SELECT 
        c.TABLE_SCHEMA,
        c.TABLE_NAME,
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.IS_NULLABLE,
        CASE 
          WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 
          ELSE 0 
        END AS IS_PRIMARY_KEY
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN (
        SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
          AND tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
          AND tc.TABLE_NAME = ku.TABLE_NAME
      ) pk
        ON c.TABLE_SCHEMA = pk.TABLE_SCHEMA
        AND c.TABLE_NAME = pk.TABLE_NAME
        AND c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE c.TABLE_SCHEMA = @schema
        AND c.TABLE_NAME = @table
      ORDER BY c.ORDINAL_POSITION
      `
    );
    
    return result.recordset.map((r) => ({
      tableSchema: r.TABLE_SCHEMA,
      tableName: r.TABLE_NAME,
      columnName: r.COLUMN_NAME,
      dataType: r.DATA_TYPE,
      isNullable: r.IS_NULLABLE === 'YES',
      isPrimaryKey: r.IS_PRIMARY_KEY === 1,
    }));
  });
}

