"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Artifact } from "@/lib/types/artifact";

interface ArtifactContextType {
  artifacts: Artifact[];
  currentArtifact: Artifact | null;
  isPaneOpen: boolean;
  paneWidth: number;
  upsertArtifact: (artifact: Artifact, options?: { autoOpen?: boolean }) => boolean;
  openArtifact: (artifactId: string) => void;
  closePane: () => void;
  setPaneWidth: (width: number) => void;
  getArtifactsByMessageId: (messageId: string) => Artifact[];
}

const ArtifactContext = createContext<ArtifactContextType | undefined>(undefined);

export const ArtifactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [isPaneOpen, setIsPaneOpen] = useState(false);
  const [paneWidth, setPaneWidth] = useState(600);

  const upsertArtifact = useCallback(
    (incoming: Artifact, options?: { autoOpen?: boolean }) => {
      let nextArtifact: Artifact | null = null;
      let added = false;
      setArtifacts((prev) => {
        const existingIndex = prev.findIndex((a) => a.id === incoming.id);
        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          if (
            existing.code === incoming.code &&
            existing.status === incoming.status &&
            existing.title === incoming.title
          ) {
            nextArtifact = existing;
            return prev;
          }
          const updated: Artifact = {
            ...existing,
            ...incoming,
            timestamp: Date.now(),
          };
          const clone = [...prev];
          clone[existingIndex] = updated;
          nextArtifact = updated;
          return clone;
        }
        const created: Artifact = {
          ...incoming,
          timestamp: incoming.timestamp ?? Date.now(),
        };
        nextArtifact = created;
        added = true;
        return [...prev, created];
      });

      if (options?.autoOpen && added && nextArtifact) {
        setCurrentArtifact(nextArtifact);
        setIsPaneOpen(true);
      }
      return added;
    },
    [],
  );

  const openArtifact = useCallback(
    (artifactId: string) => {
      const artifact = artifacts.find((a) => a.id === artifactId);
      if (artifact) {
        setCurrentArtifact(artifact);
        setIsPaneOpen(true);
      }
    },
    [artifacts],
  );

  const closePane = useCallback(() => {
    setIsPaneOpen(false);
    // Keep currentArtifact so we can reopen it easily
  }, []);

  const getArtifactsByMessageId = useCallback((messageId: string) => {
    return artifacts.filter((a) => a.messageId === messageId);
  }, [artifacts]);

  useEffect(() => {
    if (!currentArtifact) return;
    const updated = artifacts.find((a) => a.id === currentArtifact.id);
    if (updated && updated !== currentArtifact) {
      setCurrentArtifact(updated);
    }
  }, [artifacts, currentArtifact]);

  return (
    <ArtifactContext.Provider
      value={{
        artifacts,
        currentArtifact,
        isPaneOpen,
        paneWidth,
        upsertArtifact,
        openArtifact,
        closePane,
        setPaneWidth,
        getArtifactsByMessageId,
      }}
    >
      {children}
    </ArtifactContext.Provider>
  );
};

export const useArtifacts = () => {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error("useArtifacts must be used within ArtifactProvider");
  }
  return context;
};

