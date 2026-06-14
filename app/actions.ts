"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import { createOpenAI } from "@ai-sdk/openai"; 
import { generateObject } from "ai";
import { z } from "zod";



import "dotenv/config";
import { executeReadOnlySQL } from "@/lib/rdbms/sql";
import { getEffectiveOpenAIConfig } from "@/lib/services/settings";

const openai = createOpenAI({
  // values will be overridden at call time via function wrapper
});



export const generateQuery = async (input: string) => {
  "use server";
  try {
    const effective = await getEffectiveOpenAIConfig();
    const result = await generateObject({
      model: createOpenAI({ baseURL: effective.baseURL, apiKey: effective.apiKey })("Llama-4-Maverick-17B-128E-Instruct"),
      system: `You are a PostgreSQL SQL expert and data visualization-minded assistant. Your job is to translate a natural language question into a safe, read-only SQL query (SELECT/CTE only) against the connected database. Guidelines:
    - Prefer returning at least two columns suitable for charting when possible.
    - Use ILIKE for case-insensitive fuzzy matching.
    - Qualify tables with schema if ambiguity is likely.
    - Use CTEs for clarity on multi-step logic.
    - Never include mutating statements (INSERT/UPDATE/DELETE/ALTER/TRUNCATE/CREATE/DROP/GRANT/REVOKE).
    - If schema is ambiguous, choose a reasonable convention and keep the query readable.
    `,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });
    return result.object.query;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

/**
 * Executes a SQL query and returns the result data
 * @param {string} query - The SQL query to execute
 * @returns {Promise<Result[]>} Array of query results
 * @throws {Error} If query is not a SELECT statement or table doesn't exist
 */
export const runGeneratedSQLQuery = async (query: string): Promise<Result[]> => {
  "use server";
  try {
    const rows = await executeReadOnlySQL<Result>({ sql: query });
    return rows as Result[];
  } catch (e: any) {
    throw e;
  }
};
 

export const explainQuery = async (input: string, sqlQuery: string) => {
  "use server";
  try {
    const effective = await getEffectiveOpenAIConfig();
    const result = await generateObject({
      model: createOpenAI({ baseURL: effective.baseURL, apiKey: effective.apiKey })("Llama-4-Maverick-17B-128E-Instruct"),
      schema: z.object({
        explanations: explanationsSchema,
      }),
      system: `You are a PostgreSQL expert. Explain the provided read-only SQL query in concise, user-friendly sections. Break the query into meaningful parts (e.g., CTEs, SELECT list, FROM/JOINs, WHERE filters, GROUP BY/HAVING, ORDER BY/LIMIT) and briefly describe the purpose of each. If a part is trivial, include it with a short or empty explanation.`,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

      User Query:
      ${input}

      Generated SQL Query:
      ${sqlQuery}`,
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const generateChartConfig = async (
  results: Result[],
  userQuery: string,
) => {
  "use server";
  const system = `You are a data visualization expert. `;

  const prompt = `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.
      For multiple groups use multi-lines.

      Here is an example complete config:
      export const chartConfig = {
        type: "pie",
        xKey: "month",
        yKeys: ["sales", "profit", "expenses"],
        colors: {
          sales: "#4CAF50",    // Green for sales
          profit: "#2196F3",   // Blue for profit
          expenses: "#F44336"  // Red for expenses
        },
        legend: true
      }

      User Query:
      ${userQuery}

      Data:
      ${JSON.stringify(results, null, 2)}`

  // console.log("promps", prompt)
  // console.log("schema", configSchema)

  try {
    const { object: config } = await generateObject({
      model: openai("Llama-4-Maverick-17B-128E-Instruct"),
      system,
      prompt,
      schema: configSchema,
    });

    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      colors[key] = `hsl(var(--chart-${index + 1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e : any) { 
    console.error(e.message);
    throw new Error("Failed to generate chart suggestion");
  }
};
