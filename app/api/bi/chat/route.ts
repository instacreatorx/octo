import {
  streamText,
  UIMessage,
  convertToModelMessages,
  validateUIMessages,
  TypeValidationError,
} from "ai";
import { createOpenAI } from '@ai-sdk/openai';
import {
  type InferUITools,
  type UIDataTypes,
  stepCountIs,
} from 'ai';
import { requireAuth } from '@/lib/auth/auth';
import { getEffectiveOpenAIConfig } from '@/lib/services/settings';
import { mssqlTools } from '@/lib/rdbms/mssql/tools';
import { tool } from 'ai';
import { z } from 'zod';
import { biConfigSchema } from '@/lib/types/bi';

// Tools will be created with user context below

export type BITools = InferUITools<typeof mssqlTools & { saveBIConfig: any }>;
export type BIMessage = UIMessage<never, UIDataTypes, BITools>;

export const POST = requireAuth(async (req, user) => {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as BIMessage[];

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return Response.json({ error: "User message is required" }, { status: 400 });
    }

    // Create tools with user context first (needed for validation)
    const toolsWithContext = {
      ...mssqlTools,
      saveBIConfig: tool({
        description: "Save a BI dashboard configuration to the database. Call this AFTER you have generated a complete BI config JSON object. You must generate the BI config JSON yourself based on the query results you received from runReadOnlySQLMssql. The config should include widgets with chart types (BarChart, PieChart, LineChart, AreaChart), titles, dataSource URLs, and chart configurations. Once you have the complete config object, call this tool to save it.",
        inputSchema: z.object({
          title: z.string().describe("Title for the BI dashboard"),
          config: z.string().describe("The complete BI configuration JSON object as a string (must be valid JSON matching the BI config schema)"),
        }),
        execute: async (args: any) => {
          // Set userId in request context before calling tool
          const { setCurrentRequestUserId } = await import("@/lib/bi/query-store");
          setCurrentRequestUserId(user.id);
          // Import and call the tool
          const { biTools } = await import("@/lib/bi/tools");
          return (biTools.saveBIConfig.execute as any)(args);
        },
      }),
    };

    // Validate messages
    let validatedMessages: UIMessage[];
    try {
      validatedMessages = await validateUIMessages({
        messages,
        tools: toolsWithContext as any,
      });
    } catch (error) {
      if (error instanceof TypeValidationError) {
        validatedMessages = messages;
      } else {
        throw error;
      }
    }

    const effective = await getEffectiveOpenAIConfig();
    
    // Track the last SQL query result and BI ID
    let lastQueryResult: any[] | null = null;
    let savedBiId: string | null = null;
    const { setCurrentRequestQueryData, clearCurrentRequestQueryData } = await import("@/lib/bi/query-store");

    const result = streamText({
      model: createOpenAI({ baseURL: effective.baseURL, apiKey: effective.apiKey }).chat("gpt-oss-120b"),
      messages: convertToModelMessages(validatedMessages),
      stopWhen: stepCountIs(10), // Allow more steps for database exploration
      tools: toolsWithContext,
      system: `You are OrangeAi 🍊, an expert Business Intelligence (BI) dashboard assistant for Microsoft SQL Server (MSSQL).

🚨 CRITICAL RULE - NO EXCEPTIONS: 
After runReadOnlySQLMssql returns data, you MUST call saveBIConfig tool in the VERY NEXT ACTION. 
- DO NOT write any text
- DO NOT explain what you will do
- DO NOT show JSON examples
- DO NOT describe the tool call
- DO NOT write "We need to..." or "Let's..." or "Now call..."
- JUST CALL THE TOOL DIRECTLY - use the tool calling mechanism, not text descriptions

Your goal is to help users create BI dashboards by:
1. Understanding what data they want to visualize
2. Exploring the database using MSSQL tools to find the right tables and columns
3. Running SQL queries to retrieve the data
4. Generating a BI dashboard configuration (in your internal reasoning, not in text output)
5. IMMEDIATELY calling saveBIConfig tool to save the dashboard (no text output before this)

Available MSSQL tools (all end with "Mssql"):
- listSchemasMssql: List all schemas in the database
- listTablesMssql: List tables (optionally in a specific schema)
- listColumnsMssql: List columns for a specific table
- runReadOnlySQLMssql: Execute a SELECT/CTE query and get results as JSON

Available BI tools:
- saveBIConfig: Save the final BI dashboard configuration that YOU generate

CRITICAL - BI Config Generation:
After you receive data from runReadOnlySQLMssql, YOU must generate a complete BI dashboard configuration JSON yourself. 

The BI config structure:
{
  "title": "Dashboard Title",
  "layout": {
    "columns": 2,
    "gap": "gap-6",
    "maxWidth": "max-w-7xl",
    "centered": true
  },
  "widgets": [
    {
      "id": "unique-id-1",
      "type": "BarChart" | "PieChart" | "LineChart" | "AreaChart",
      "title": "Chart Title",
      "description": "Optional description",
      "className": "col-span-2 lg:col-span-1",
      "options": {
        "showCard": true,
        "cardClassName": "bg-white dark:bg-neutral-800 shadow-sm rounded-xl p-4 border border-border",
        "showLegend": true
      },
      "dataSource": {
        "type": "json",
        "data": [{"column1": "value1", "column2": 100}, ...]
      },
      "chart": {
        "xKey": "column_name_for_x_axis",
        "yKey": "column_name_for_y_axis",
        "yKeys": ["col1", "col2"], // for multiple series
        "nameKey": "column_name", // for pie charts
        "valueKey": "column_name", // for pie charts
        "color": "#4f46e5", // single color
        "colors": ["#f97316", "#22c55e", "#0ea5e9"] // array of colors
      }
    }
  ]
}

For dataSource, use the data you received from runReadOnlySQLMssql directly:
- Set type to "json"
- Set data to the array of results from runReadOnlySQLMssql
- Example: if runReadOnlySQLMssql returned [{"month": 1, "sales": 1000}, {"month": 2, "sales": 1500}], use that exact array in dataSource.data

Workflow:
1. Explore database: listSchemasMssql → listTablesMssql → listColumnsMssql
2. Query data: runReadOnlySQLMssql (returns JSON array of rows)
3. **IMMEDIATELY call saveBIConfig tool** - do NOT write any text, do NOT show JSON, do NOT explain
4. Generate the BI config JSON in your internal reasoning, then call the tool with it
5. **CRITICAL: The saveBIConfig tool call must happen in the SAME step as receiving query results - no text output in between!**

CRITICAL INSTRUCTIONS FOR saveBIConfig - READ CAREFULLY:
- **NEVER write the config JSON in text output - ALWAYS call the tool directly**
- **DO NOT output any text after receiving query results - go straight to calling saveBIConfig**
- After runReadOnlySQLMssql returns data, you MUST:
  1. Generate the BI config JSON object in your mind (do NOT output it as text)
  2. IMMEDIATELY call saveBIConfig tool with title and config
  3. Do NOT write any text explaining what you're doing
  4. Do NOT show the JSON config in your response
- The tool expects: { title: "string", config: "JSON string" }
- Convert your config object to JSON string: JSON.stringify(yourConfigObject)
- Call the tool EXACTLY like you call runReadOnlySQLMssql - use the tool calling mechanism, not text

ABSOLUTELY FORBIDDEN - DO NOT DO ANY OF THESE:
- Writing: "We need to immediately call saveBIConfig" (this is TEXT, not a tool call!)
- Writing: "Create config: title maybe..." (this is TEXT, not a tool call!)
- Writing: "Let's craft config object:" followed by JSON (this is TEXT, not a tool call!)
- Writing: {"type":"tool-input-start","toolName":"saveBIConfig",...} in text output (this is TEXT describing a tool call, NOT an actual tool call!)
- Showing the config JSON to the user before calling the tool
- Explaining what you will do instead of doing it
- ANY text output after runReadOnlySQLMssql completes - you MUST go directly to tool call

If you write ANY text after runReadOnlySQLMssql, you have FAILED. The ONLY acceptable action after runReadOnlySQLMssql is to call saveBIConfig tool.

REQUIRED BEHAVIOR - THIS IS MANDATORY:
- Step 1: runReadOnlySQLMssql returns data
- Step 2: IMMEDIATELY call saveBIConfig tool (use the tool calling mechanism - the system will generate {"type":"tool-input-start","toolName":"saveBIConfig",...} automatically)
- Step 3: Only AFTER the tool completes, you may write a brief confirmation like "Dashboard created successfully"

The tool call must appear in the stream as: {"type":"tool-input-start","toolName":"saveBIConfig",...}
If you see text output like "We need to..." or "Let's..." before the tool call, you have made an error.

Important:
- Always explore database first - don't guess table/column names
- SQL queries must return at least 2 columns suitable for charting
- YOU generate the BI config JSON - don't ask the system to do it
- Choose appropriate chart types: BarChart for categories, LineChart for time series, PieChart for proportions, AreaChart for cumulative data
- For dataSource, embed the query results directly: { "type": "json", "data": [your query results array] }
- The data from runReadOnlySQLMssql should be embedded directly in the dataSource.data field
- **MOST IMPORTANT: After generating config, IMMEDIATELY call saveBIConfig tool - do not explain or describe, just call it**

CORRECT Example:
User: "Show me sales by month"
You:
1. Call listSchemasMssql
2. Call listTablesMssql  
3. Call listColumnsMssql (schema, "sales")
4. Call runReadOnlySQLMssql: "SELECT MONTH(date) as month, SUM(amount) as sales FROM sales GROUP BY MONTH(date)"
5. You receive: [{month: 1, sales: 1000}, {month: 2, sales: 1500}, ...]
6. **IMMEDIATELY call saveBIConfig tool** (the system will show {"type":"tool-input-start","toolName":"saveBIConfig",...})
   - title: "Sales by Month"
   - config: JSON.stringify({ title: "Sales by Month", layout: {...}, widgets: [{ dataSource: { type: "json", data: [the array from step 5] }, ... }] })
7. Only AFTER the tool completes, you may write: "Dashboard created successfully"

WRONG Example (DO NOT DO THIS):
User: "piechart for showing unicorns by count per country"
You:
1. Call runReadOnlySQLMssql: "SELECT country, COUNT(*) AS unicorn_count FROM dbo.unicorns GROUP BY country"
2. You receive: [{"country":"Australia","unicorn_count":1}, ...]
3. ❌ WRONG: You write text: "We need to immediately call saveBIConfig with appropriate config..."
4. ❌ WRONG: You write text: "Create config: title maybe \"Unicorns by Country\"..."
5. ❌ WRONG: You write text: "Let's craft config object: {...}"
6. ❌ WRONG: You write text: {"type":"tool-input-start","toolName":"saveBIConfig",...} (this is TEXT, not a tool call!)

CORRECT for same example:
User: "piechart for showing unicorns by count per country"
You:
1. Call runReadOnlySQLMssql: "SELECT country, COUNT(*) AS unicorn_count FROM dbo.unicorns GROUP BY country"
2. You receive: [{"country":"Australia","unicorn_count":1}, ...]
3. ✅ CORRECT: IMMEDIATELY call saveBIConfig tool (system shows {"type":"tool-input-start","toolName":"saveBIConfig",...})
   - title: "Unicorns by Country"
   - config: JSON.stringify({...with dataSource: {type: "json", data: [the array from step 2]}})
4. Only AFTER tool completes: "Dashboard created successfully"`,
      onStepFinish: async ({ toolCalls, toolResults }) => {
        // Intercept runReadOnlySQLMssql results and store for tool access
        if (toolResults) {
          for (const toolResult of toolResults) {
            if (toolResult.toolName === 'runReadOnlySQLMssql' && 'result' in toolResult) {
              try {
                const result = (toolResult as any).result;
                const parsed = typeof result === 'string' 
                  ? JSON.parse(result) 
                  : result;
                if (Array.isArray(parsed)) {
                  lastQueryResult = parsed;
                  setCurrentRequestQueryData(parsed);
                }
              } catch (e) {
                console.error("Failed to parse query result:", e);
              }
            }
            // Intercept saveBIConfig to get BI ID
            if (toolResult.toolName === 'saveBIConfig' && 'result' in toolResult) {
              try {
                const result = (toolResult as any).result;
                const parsed = typeof result === 'string' ? JSON.parse(result) : result;
                if (parsed.biId) {
                  savedBiId = parsed.biId;
                }
              } catch (e) {
                console.error("Failed to parse saveBIConfig result:", e);
              }
            }
          }
        }
      },
    });

    // Ensure stream runs to completion
    result.consumeStream();

    // Get the response stream
    const response = result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      generateMessageId: () => crypto.randomUUID(),
      onFinish: async () => {
        // Clean up request context
        clearCurrentRequestQueryData();
        
        if (savedBiId) {
          console.log('✅ BI Dashboard created with ID:', savedBiId);
        }
      },
    });

    // Store savedBiId in response metadata for client to access
    // We'll check for it in the stream by intercepting saveBIConfig tool results
    // The client will parse the stream to find the BI ID
    
    return response;
  } catch (error: any) {
    console.error("BI Chat API Error:", error);
    return Response.json(
      { error: error.message || "Failed to process BI request" },
      { status: 500 }
    );
  }
});
