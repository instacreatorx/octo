import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { biConfigSchema } from "@/lib/types/bi";
import { prisma } from "@/lib/db";

export const biTools = {
  saveBIConfig: tool({
    description: "🚨 CRITICAL: Call this IMMEDIATELY after runReadOnlySQLMssql returns data. DO NOT write any text first - call this tool directly. Save a BI dashboard configuration to the database. You must generate the complete BI config JSON yourself based on the query results from runReadOnlySQLMssql. The config should include widgets with chart types (BarChart, PieChart, LineChart, AreaChart), titles, dataSource with type 'json' and embedded data array, and chart configurations. Call this tool IMMEDIATELY after receiving query results - no text output before calling.",
    inputSchema: z.object({
      title: z.string().describe("Title for the BI dashboard"),
      config: z.string().describe("The complete BI configuration JSON object as a string (must be valid JSON matching the BI config schema)"),
    }) as any,
    execute: async ({ title, config }: { title: string; config: string }) => {
      // Parse and validate config
      let configObj: any;
      try {
        configObj = typeof config === 'string' ? JSON.parse(config) : config;
      } catch (e) {
        throw new Error("Config must be valid JSON");
      }
      const validatedConfig = biConfigSchema.parse(configObj);
      try {
        // Get query data and userId from request context
        const { getStoredQueryData, getCurrentRequestUserId } = await import("@/lib/bi/query-store");
        const queryData = getStoredQueryData();
        const userId = getCurrentRequestUserId();

        // Embed query data directly in widgets as JSON dataSource
        const updatedConfig = {
          ...validatedConfig,
          widgets: validatedConfig.widgets.map((widget: any) => {
            // If we have query data, embed it directly as JSON
            if (queryData && Array.isArray(queryData) && queryData.length > 0) {
              return {
                ...widget,
                dataSource: {
                  type: "json" as const,
                  data: queryData,
                },
              };
            }
            // Fallback: if no query data, keep existing dataSource (for backward compatibility)
            return widget;
          }),
        };

        const biDashboard = await (prisma as any).bIDashboard.create({
          data: {
            title,
            config: JSON.stringify(updatedConfig),
            userId: userId || null,
          },
        });

        return JSON.stringify({
          success: true,
          biId: biDashboard.id,
          message: `BI dashboard saved successfully with ID: ${biDashboard.id}. The dashboard is now available at /bi/${biDashboard.id}`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to save BI config: ${errorMessage}`);
      }
    },
  }),
} satisfies ToolSet;

export type BITools = typeof biTools;

