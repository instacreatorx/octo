"use client";

import { ToolCallContentPartComponent, useMessage } from "@assistant-ui/react";
import {
  AlertCircleIcon,
  CheckIcon,
  DatabaseIcon,
  Loader2Icon,
  TableIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { parseToolResult } from "@/lib/tool-result";

const TOOL_LABELS: Record<string, string> = {
  runReadOnlySQLMssql: "Run query",
  runReadOnlySQL: "Run query",
  listSchemasMssql: "List schemas",
  listSchemas: "List schemas",
  listTablesMssql: "List tables",
  listTables: "List tables",
  listColumnsMssql: "List columns",
  listColumns: "List columns",
  saveBIConfig: "Save dashboard",
  createTableMssql: "Create table",
  createIndexMssql: "Create index",
  createViewMssql: "Create view",
  dropObjectMssql: "Drop object",
  insertRowsMssql: "Insert rows",
  updateRowsMssql: "Update rows",
  deleteRowsMssql: "Delete rows",
};

function formatToolLabel(toolName: string): string {
  if (TOOL_LABELS[toolName]) return TOOL_LABELS[toolName];
  return toolName
    .replace(/Mssql$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function parseArgsText(argsText: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(argsText);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function getQueryPreview(
  argsText: string,
  args?: Readonly<Record<string, unknown>>,
): string | null {
  const parsed = args ?? parseArgsText(argsText);
  if (!parsed) return null;
  if (typeof parsed.sql === "string") return parsed.sql;
  if (typeof parsed.ddl === "string") return parsed.ddl;
  if (typeof parsed.schema === "string" && typeof parsed.table === "string") {
    return `${parsed.schema}.${parsed.table}`;
  }
  if (typeof parsed.schema === "string") return parsed.schema;
  return null;
}

function getToolIcon(toolName: string) {
  if (toolName.toLowerCase().includes("sql")) {
    return DatabaseIcon;
  }
  if (
    toolName.toLowerCase().includes("table") ||
    toolName.toLowerCase().includes("column") ||
    toolName.toLowerCase().includes("schema")
  ) {
    return TableIcon;
  }
  return DatabaseIcon;
}

function truncate(text: string, max = 72): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

function summarizeResult(
  normalized: ReturnType<typeof parseToolResult> | null,
): string {
  if (!normalized) return "";
  if (normalized.status === "failed") {
    return truncate(normalized.error ?? normalized.msg ?? "Failed", 80);
  }
  if (normalized.msg) return truncate(normalized.msg, 80);
  const { data } = normalized;
  if (Array.isArray(data)) {
    return `${data.length} row${data.length === 1 ? "" : "s"} returned`;
  }
  if (typeof data === "string") return truncate(data, 80);
  if (data !== undefined) return "Completed";
  return "Completed";
}

function formatResultBody(
  normalized: ReturnType<typeof parseToolResult>,
): string {
  if (normalized.status === "failed") {
    return normalized.error ?? normalized.msg ?? "Unknown error";
  }
  const payload = normalized.data ?? normalized.raw;
  if (typeof payload === "string") {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  }
  return JSON.stringify(payload, null, 2);
}

export const ToolFallback: ToolCallContentPartComponent = ({
  toolName,
  argsText,
  args,
  result,
  status,
  toolCallId,
  isError,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const message = useMessage();
  const { chainIndex, chainLength } = useMemo(() => {
    const toolCalls = message.content.filter((part) => part.type === "tool-call");
    const index = toolCalls.findIndex(
      (part) => part.type === "tool-call" && part.toolCallId === toolCallId,
    );
    return { chainIndex: index, chainLength: toolCalls.length };
  }, [message.content, toolCallId]);

  const isRunning = status.type === "running";
  const hasResult = result !== undefined && !isRunning;
  const normalized = useMemo(
    () => (hasResult ? parseToolResult(result, isError) : null),
    [hasResult, result, isError],
  );

  const queryPreview = getQueryPreview(argsText, args);
  const label = formatToolLabel(toolName);
  const Icon = getToolIcon(toolName);
  const isFailed = normalized?.status === "failed" || isError;
  const isSuccess = hasResult && !isFailed;
  const isFirst = chainIndex <= 0;
  const isLast = chainIndex < 0 || chainIndex === chainLength - 1;
  const showConnector = chainLength > 1 && !isLast;

  const openDetails = () => {
    if (isRunning) return;
    setDialogOpen(true);
  };

  return (
    <>
      <div className="my-0.5 flex w-full gap-2 text-xs leading-snug">
        <div className="flex w-4 shrink-0 flex-col items-center">
          {!isFirst && (
            <div className="border-muted-foreground/30 h-2 w-px border-l border-dashed" />
          )}
          <div
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-full",
              isRunning && "bg-muted",
              isSuccess && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
              isFailed && "bg-destructive/15 text-destructive",
              !isRunning && !hasResult && "bg-muted text-muted-foreground",
            )}
          >
            {isRunning ? (
              <Loader2Icon className="size-2.5 animate-spin" />
            ) : isFailed ? (
              <AlertCircleIcon className="size-2.5" />
            ) : isSuccess ? (
              <CheckIcon className="size-2.5" />
            ) : (
              <Icon className="size-2.5 opacity-60" />
            )}
          </div>
          {showConnector && (
            <div className="border-muted-foreground/30 min-h-3 w-px flex-1 border-l border-dashed" />
          )}
        </div>

        <button
          type="button"
          onClick={openDetails}
          disabled={isRunning}
          className={cn(
            "group mb-1 min-w-0 flex-1 rounded-md px-2 py-1.5 text-left transition-colors",
            !isRunning && "hover:bg-muted/60 cursor-pointer",
            isRunning && "cursor-default",
          )}
        >
          <div className="text-muted-foreground flex items-center gap-1.5">
            <span className="text-foreground/80 font-medium">{label}</span>
            {isRunning && (
              <span className="animate-pulse">Running…</span>
            )}
            {isSuccess && (
              <span className="text-emerald-600 dark:text-emerald-400">
                {summarizeResult(normalized)}
              </span>
            )}
            {isFailed && (
              <span className="text-destructive">
                {summarizeResult(normalized)}
              </span>
            )}
          </div>

          {queryPreview && (
            <pre
              className={cn(
                "mt-1 overflow-hidden font-mono text-[11px] leading-relaxed whitespace-pre-wrap",
                "text-muted-foreground group-hover:text-foreground/80",
                isFailed && "text-destructive/80",
              )}
            >
              {truncate(queryPreview, 120)}
            </pre>
          )}

          {!queryPreview && !isRunning && argsText && (
            <pre className="text-muted-foreground mt-1 overflow-hidden font-mono text-[11px] whitespace-pre-wrap">
              {truncate(argsText, 100)}
            </pre>
          )}
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              <Icon className="text-muted-foreground size-3.5" />
              {label}
              {normalized && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    normalized.status === "ok"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {normalized.status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[calc(85vh-4rem)] space-y-4 overflow-y-auto p-4">
            {queryPreview && (
              <section>
                <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wide uppercase">
                  Query
                </p>
                <pre className="bg-muted/50 overflow-x-auto rounded-md border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {queryPreview}
                </pre>
              </section>
            )}

            {!queryPreview && argsText && (
              <section>
                <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wide uppercase">
                  Input
                </p>
                <pre className="bg-muted/50 overflow-x-auto rounded-md border p-3 font-mono text-[11px] whitespace-pre-wrap">
                  {argsText}
                </pre>
              </section>
            )}

            {normalized && (
              <section>
                <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wide uppercase">
                  Result
                </p>
                {normalized.msg && normalized.status === "ok" && (
                  <p className="text-muted-foreground mb-2 text-xs">
                    {normalized.msg}
                  </p>
                )}
                <pre
                  className={cn(
                    "overflow-x-auto rounded-md border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap",
                    normalized.status === "failed"
                      ? "bg-destructive/5 text-destructive border-destructive/20"
                      : "bg-muted/50",
                  )}
                >
                  {formatResultBody(normalized)}
                </pre>
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
