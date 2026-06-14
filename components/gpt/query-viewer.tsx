"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QueryViewerProps {
  activeQuery: string;
  inputValue: string;
}

export function QueryViewer({ activeQuery, inputValue }: QueryViewerProps) {
  return (
    <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">
            Generated SQL Query:
          </p>
          <pre className="text-xs font-mono bg-background p-3 rounded border overflow-x-auto">
            <code>{activeQuery}</code>
          </pre>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              This SQL query was generated from your question: "{inputValue}"
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

