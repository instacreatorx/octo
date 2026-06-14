"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileCode2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/lib/types/artifact";

interface ArtifactTriggerProps {
  artifact: Artifact;
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

export const ArtifactTrigger: React.FC<ArtifactTriggerProps> = ({
  artifact,
  onClick,
  isOpen = false,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("inline-block", className)}
    >
      <button
        onClick={onClick}
        className={cn(
          "group relative flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 transition-all",
          "bg-background hover:bg-accent border-border hover:border-primary",
          "text-foreground hover:text-primary",
          isOpen && "border-primary bg-accent"
        )}
      >
        <FileCode2 className="h-4 w-4" />
        <span className="text-sm font-medium">{artifact.title}</span>
        {artifact.status === "streaming" ? (
          <span className="flex items-center gap-1 text-xs text-amber-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Streaming...
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Interactive artifact</span>
        )}
      </button>
    </motion.div>
  );
};

