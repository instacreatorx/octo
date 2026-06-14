"use server";

import { Config, configSchema, Result } from "@/lib/types";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { getEffectiveOpenAIConfig } from "@/lib/services/settings";
import { executeReadOnlySQL } from "@/lib/rdbms/sql";
import { executeReadOnlySQL as executeReadOnlySQLMssql } from "@/lib/rdbms/mssql/sql";
/**
 * Step 1: Generate SQL query from natural language prompt
 */
export const generateQuery = async (input: string, databaseType: "postgresql" | "mssql") => {
  "use server";
  try {
    const effective = await getEffectiveOpenAIConfig();
    const openai = createOpenAI({
      baseURL: effective.baseURL,
      apiKey: effective.apiKey,
    });

    // Get database schema information based on selected database type
    let schemaInfo = "";
    if (databaseType === "postgresql") {
      schemaInfo = `You are working with a PostgreSQL database. Use standard PostgreSQL syntax.`;
    } else {
      schemaInfo = `You are working with a Microsoft SQL Server (MSSQL) database. Use MSSQL syntax:
      - Use TOP instead of LIMIT
      - Use GETDATE() instead of NOW()
      - Use DATEDIFF instead of INTERVAL
      - Use square brackets for identifiers if needed: [schema].[table]
      - Use MONTH(), YEAR() functions for date extraction`;
    }

    const result = await generateObject({
      model: openai("gpt-oss-120b"),
      system: `You are a SQL and data visualization expert. Your job is to help the user write a SQL query to retrieve the data they need.

${schemaInfo}

Only retrieval queries (SELECT) are allowed. No INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, GRANT, or REVOKE statements.

For string fields, use the ILIKE operator (PostgreSQL) or LIKE with LOWER() (MSSQL) for case-insensitive searches.

EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART! There should always be at least two columns. If the user asks for a single column, return the column and the count of the column.

If the user asks for 'over time' data, return by year or month.

When searching for UK or USA, write out United Kingdom or United States respectively.

Generate clean, efficient SQL queries that return data suitable for visualization.`,
      prompt: `Generate the SQL query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string().describe("The SQL query to execute"),
      }),
    });
    return result.object.query;
  } catch (e) {
    console.error("Error generating query:", e);
    throw new Error("Failed to generate query");
  }
};

/**
 * Step 2: Execute the generated SQL query
 */
export const runGeneratedSQLQuery = async (
  query: string,
  databaseType: "postgresql" | "mssql"
): Promise<Result[]> => {
  "use server";

  const lowerQuery = query.trim().toLowerCase();

  // Security check: prevent dangerous operations
  if (
    lowerQuery.includes("drop") ||
    lowerQuery.includes("delete") ||
    lowerQuery.includes("insert") ||
    lowerQuery.includes("update") ||
    lowerQuery.includes("alter") ||
    lowerQuery.includes("truncate") ||
    lowerQuery.includes("create") ||
    lowerQuery.includes("grant") ||
    lowerQuery.includes("revoke")
  ) {
    throw new Error("Only SELECT queries are allowed");
  }

  try {
    if (databaseType === "postgresql") {
      const rows = await executeReadOnlySQL({ sql: query });
      // Convert to Result format (Record<string, string | number>)
      return rows.map((row) => {
        const result: Result = {};
        for (const [key, value] of Object.entries(row)) {
          // Convert Date objects to strings, keep numbers as numbers
          if (value instanceof Date) {
            result[key] = value.toISOString();
          } else if (value === null || value === undefined) {
            result[key] = "";
          } else {
            result[key] = value as string | number;
          }
        }
        return result;
      });
    } else {
      // MSSQL
      const rows = await executeReadOnlySQLMssql({ sql: query });
      // Convert to Result format
      return rows.map((row) => {
        const result: Result = {};
        for (const [key, value] of Object.entries(row)) {
          // Handle MSSQL specific types
          if (value instanceof Date) {
            result[key] = value.toISOString();
          } else if (value === null || value === undefined) {
            result[key] = "";
          } else {
            // MSSQL might return numbers as strings in some cases
            const numValue = Number(value);
            if (!isNaN(numValue) && typeof value !== "boolean") {
              result[key] = numValue;
            } else {
              result[key] = String(value);
            }
          }
        }
        return result;
      });
    }
  } catch (e: any) {
    console.error("Error executing query:", e);
    throw new Error(`Failed to execute query: ${e.message || "Unknown error"}`);
  }
};

/**
 * Step 3: Generate chart configuration from query results
 */
export const generateChartConfig = async (
  results: Result[],
  userQuery: string,
) => {
  "use server";
  
  if (!results || results.length === 0) {
    throw new Error("No data available to generate chart configuration");
  }

  try {
    const effective = await getEffectiveOpenAIConfig();
    const openai = createOpenAI({
      baseURL: effective.baseURL,
      apiKey: effective.apiKey,
    });

    const system = `You are a data visualization expert. Your job is to generate appropriate chart configurations based on the data structure and user's query.`;

    const prompt = `Given the following data from a SQL query result, generate the chart config that best visualizes the data and answers the user's query.

User Query: ${userQuery}

Data Sample (first 10 rows):
${JSON.stringify(results.slice(0, 10), null, 2)}

Total rows: ${results.length}

Available columns: ${Object.keys(results[0] || {}).join(", ")}

Generate a chart configuration that:
1. Chooses the most appropriate chart type (bar, line, area, or pie)
2. Identifies the x-axis/category column
3. Identifies the y-axis/value column(s)
4. Provides a descriptive title and description
5. Includes a meaningful takeaway

For pie charts: use the first column as nameKey and the first numeric column as valueKey.
For bar/line/area charts: use the first non-numeric column as xKey and numeric columns as yKeys.
For time series data, use line or area charts.
For categorical comparisons, use bar charts.
For proportions/percentages, use pie charts.`;

    const { object: config } = await generateObject({
      model: openai("gpt-oss-120b"),
      system,
      prompt,
      schema: configSchema,
    });

    // Assign colors to yKeys using CSS variables
    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      const colorIndex = (index % 5) + 1;
      colors[key] = `var(--chart-${colorIndex})`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e: any) {
    console.error("Error generating chart config:", e);
    throw new Error(`Failed to generate chart configuration: ${e.message || "Unknown error"}`);
  }
};

