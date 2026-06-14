import { z } from "zod";

// BI Widget Types
export const biWidgetTypeSchema = z.enum(["BarChart", "PieChart", "LineChart", "AreaChart"]);

// Chart configuration schema
export const biChartConfigSchema = z.object({
  xKey: z.string().describe("Key for x-axis or category"),
  yKey: z.string().optional().describe("Key for y-axis value (for single value charts)"),
  yKeys: z.array(z.string()).optional().describe("Keys for y-axis values (for multi-value charts)"),
  nameKey: z.string().optional().describe("Key for name/label (for pie charts)"),
  valueKey: z.string().optional().describe("Key for value (for pie charts)"),
  color: z.string().optional().describe("Single color for chart"),
  colors: z.array(z.string()).optional().describe("Array of colors for chart elements"),
});

// Data source schema - supports both API endpoints and embedded JSON data
export const biDataSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("api"),
    url: z.string(),
  }),
  z.object({
    type: z.literal("json"),
    data: z.array(z.any()),
  }),
]);

// Widget options schema
export const biWidgetOptionsSchema = z.object({
  showCard: z.boolean().optional(),
  cardClassName: z.string().optional(),
  showLegend: z.boolean().optional(),
  fullWidth: z.boolean().optional(),
  highlight: z.boolean().optional(),
});

// Widget schema
export const biWidgetSchema = z.object({
  id: z.string(),
  type: biWidgetTypeSchema,
  title: z.string().optional(),
  description: z.string().optional(),
  className: z.string().optional(),
  options: biWidgetOptionsSchema.optional(),
  dataSource: biDataSourceSchema,
  chart: biChartConfigSchema,
});

// Layout schema
export const biLayoutSchema = z.object({
  columns: z.number().min(1).max(4),
  gap: z.string().optional(),
  maxWidth: z.string().optional(),
  centered: z.boolean().optional(),
});

// BI Config schema
export const biConfigSchema = z.object({
  title: z.string(),
  layout: biLayoutSchema,
  widgets: z.array(biWidgetSchema),
});

// Type exports
export type BIWidgetType = z.infer<typeof biWidgetTypeSchema>;
export type BIChartConfig = z.infer<typeof biChartConfigSchema>;
export type BIDataSource = z.infer<typeof biDataSourceSchema>;
export type BIWidgetOptions = z.infer<typeof biWidgetOptionsSchema>;
export type BIWidget = z.infer<typeof biWidgetSchema>;
export type BILayout = z.infer<typeof biLayoutSchema>;
export type BIConfig = z.infer<typeof biConfigSchema>;

