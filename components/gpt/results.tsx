"use client";

import { Config, Result } from "@/lib/types";
import { DynamicChart } from "./dynamic-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Results = ({
  results,
  columns,
  chartConfig,
}: {
  results: Result[];
  columns: string[];
  chartConfig: Config | null;
}) => {
  const formatColumnTitle = (title: string) => {
    return title
      .split("_")
      .map((word, index) =>
        index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
      )
      .join(" ");
  };

  const formatCellValue = (column: string, value: any) => {
    if (column.toLowerCase().includes("valuation")) {
      const parsedValue = parseFloat(String(value));
      if (isNaN(parsedValue)) {
        return "";
      }
      const formattedValue = parsedValue.toFixed(2);
      const trimmedValue = formattedValue.replace(/\.?0+$/, "");
      return `$${trimmedValue}B`;
    }
    if (column.toLowerCase().includes("rate")) {
      const parsedValue = parseFloat(String(value));
      if (isNaN(parsedValue)) {
        return "";
      }
      const percentage = (parsedValue * 100).toFixed(2);
      return `${percentage}%`;
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  const canShowChart = results.length > 0 && 
    Object.keys(results[0] || {}).length > 1 && 
    results.length >= 2 &&
    chartConfig !== null;

  return (
    <div className="flex-grow flex flex-col">
      <Tabs defaultValue="table" className="w-full flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="charts" disabled={!canShowChart}>
            Chart
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="flex-grow">
          <div className="sm:min-h-[10px] relative overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary sticky top-0 shadow-sm">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {formatColumnTitle(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {results.map((row, index) => (
                  <tr key={index} className="hover:bg-muted">
                    {columns.map((column, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                      >
                        {formatCellValue(column, row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="charts" className="flex-grow overflow-auto">
          <div className="mt-4">
            {chartConfig && results.length > 0 ? (
              <DynamicChart chartData={results} chartConfig={chartConfig} />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Chart configuration not available
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

