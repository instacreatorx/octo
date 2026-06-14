"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatabaseSelector, DatabaseType } from "./database-selector";

interface SearchProps {
  handleClear: () => void;
  handleSubmit: (suggestion?: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  submitted: boolean;
  databaseType: DatabaseType;
  setDatabaseType: (value: DatabaseType) => void;
}

export function Search({
  handleClear,
  handleSubmit,
  inputValue,
  setInputValue,
  submitted,
  databaseType,
  setDatabaseType,
}: SearchProps) {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} className="mb-6">
      <div className="flex gap-2">
        <DatabaseSelector
          value={databaseType}
          onChange={setDatabaseType}
          disabled={submitted}
        />
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ask a question about your data..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-10 pr-4 h-12"
            disabled={submitted}
          />
        </div>
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-12 w-12"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="submit"
          disabled={!inputValue.trim() || submitted}
          className="h-12 px-6"
        >
          <SearchIcon className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </form>
  );
}

