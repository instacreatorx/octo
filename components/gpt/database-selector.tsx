"use client";

import { ChevronDown, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DatabaseType = "postgresql" | "mssql";

interface DatabaseSelectorProps {
  value: DatabaseType;
  onChange: (value: DatabaseType) => void;
  disabled?: boolean;
}

const databaseOptions: { value: DatabaseType; label: string }[] = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mssql", label: "MSSQL" },
];

export function DatabaseSelector({
  value,
  onChange,
  disabled,
}: DatabaseSelectorProps) {
  const selectedOption = databaseOptions.find((opt) => opt.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12 min-w-[140px] justify-between gap-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">
              {selectedOption?.label || "Select Database"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        {databaseOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              value === option.value && "bg-accent"
            )}
          >
            <Database className="h-4 w-4" />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

