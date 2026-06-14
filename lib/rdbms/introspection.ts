import { withClient } from "./client";

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
  return withClient(async (client) => {
    const { rows } = await client.query<{ schema_name: string }>(
      `select schema_name from information_schema.schemata order by schema_name`
    );
    return rows.map((r) => r.schema_name);
  });
}

export async function listTables(schema?: string): Promise<TableInfo[]> {
  return withClient(async (client) => {
    const params: any[] = [];
    const where = schema ? (params.push(schema), `where table_schema = $1`) : ``;
    const { rows } = await client.query<{ table_schema: string; table_name: string }>(
      `select table_schema, table_name from information_schema.tables ${where} order by table_schema, table_name`,
      params
    );
    return rows.map((r) => ({ schema: r.table_schema, name: r.table_name }));
  });
}

export async function listColumns(schema: string, table: string): Promise<ColumnInfo[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<{
      table_schema: string;
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      is_primary_key: boolean;
    }>(
      `
      select c.table_schema,
             c.table_name,
             c.column_name,
             c.data_type,
             c.is_nullable,
             exists (
               select 1
               from information_schema.table_constraints tc
               join information_schema.key_column_usage kcu
                 on tc.constraint_name = kcu.constraint_name
                and tc.table_schema = kcu.table_schema
                and tc.table_name = kcu.table_name
              where tc.constraint_type = 'PRIMARY KEY'
                and tc.table_schema = c.table_schema
                and tc.table_name = c.table_name
                and kcu.column_name = c.column_name
             ) as is_primary_key
        from information_schema.columns c
       where c.table_schema = $1
         and c.table_name = $2
       order by c.ordinal_position
      `,
      [schema, table]
    );
    return rows.map((r) => ({
      tableSchema: r.table_schema,
      tableName: r.table_name,
      columnName: r.column_name,
      dataType: r.data_type,
      isNullable: r.is_nullable === 'YES',
      isPrimaryKey: r.is_primary_key,
    }));
  });
}


