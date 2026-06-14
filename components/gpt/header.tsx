"use client";

import { Sparkles } from "lucide-react";

interface HeaderProps {
  handleClear: () => void;
}

export function Header({ handleClear }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">GPT SQL</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">AGI</span>
        <div className="h-4 w-4 rounded-full bg-yellow-500" />
      </div>
    </div>
  );
}

