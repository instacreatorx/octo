"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BIConfig } from "@/lib/types/bi";
import { Send, Loader2 } from "lucide-react";
import { getToken } from "@/lib/auth/client";
import clsx from "clsx";

interface Props {
  onConfigGenerated: (config: BIConfig) => void;
  currentConfig?: BIConfig | null;
  compact?: boolean;
}

export function BIChatInput({
  onConfigGenerated,
  currentConfig,
  compact = false,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError("Please log in to continue");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/bi/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: inputValue,
          previousConfig: currentConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate dashboard");
      }

      const data = await response.json();
      onConfigGenerated(data.config);
      setInputValue("");
      setError(null);
    } catch (error: any) {
      console.error("Failed to generate BI config:", error);
      setError(error.message || "Failed to generate dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative w-64">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(null);
              }}
              placeholder="Ask a question to update charts..."
              className="w-full pr-10"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !inputValue.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
        {error && (
          <div className="absolute top-full mt-2 left-0 w-64 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            placeholder="Ask a question to generate charts... (e.g., 'Show sales by month', 'Display revenue by category')"
            className="w-full"
            disabled={loading}
          />
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
        <Button type="submit" disabled={loading || !inputValue.trim()}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Generate
            </>
          )}
        </Button>
      </form>
      {currentConfig && !error && (
        <p className="text-xs text-muted-foreground mt-2">
          Tip: Ask questions to modify or add new charts to your dashboard
        </p>
      )}
    </div>
  );
}

