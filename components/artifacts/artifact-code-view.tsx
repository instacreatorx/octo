"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ArtifactCodeViewProps {
  code: string;
  className?: string;
}

export const ArtifactCodeView: React.FC<ArtifactCodeViewProps> = ({ code, className }) => {
  return (
    <div className={cn("relative w-full h-full", className)}>
      <pre className="bg-[#1e1e1e] dark:bg-[#0d1117] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

