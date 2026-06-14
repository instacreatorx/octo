"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useMessage } from "@assistant-ui/react";
import { useArtifacts } from "@/lib/contexts/artifact-context";
import { ArtifactTrigger } from "@/components/artifacts/artifact-trigger";
import { parseArtifactsFromMessage } from "@/lib/utils/artifact-parser";

export const ArtifactDetector: React.FC = () => {
  const {
    upsertArtifact,
    openArtifact,
    currentArtifact,
    isPaneOpen,
    getArtifactsByMessageId,
  } = useArtifacts();
  const hostRef = useRef<HTMLDivElement>(null);
  const message = useMessage();

  const textContent = useMemo(() => {
    if (!message || message.role !== "assistant") return "";
    if (!message.content) return "";

    return message.content
      .map((part: any) => {
        if (part.type === "text" && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("\n");
  }, [message]);

  useEffect(() => {
    if (!message || message.role !== "assistant") return;
    if (!message.id) return;
    if (!textContent.trim()) return;

    const parsed = parseArtifactsFromMessage(textContent, message.id);
    parsed.forEach((artifact) => {
      upsertArtifact(artifact, { autoOpen: artifact.status === "streaming" });
    });
  }, [message?.id, message?.role, textContent, upsertArtifact]);

  const artifacts = message?.id ? getArtifactsByMessageId(message.id) : [];
  const artifactsSignature = artifacts
    .map((artifact) => `${artifact.id}:${artifact.status}:${artifact.code.length}`)
    .join("|");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const messageRoot = host.closest("[data-message-id]");
    if (!messageRoot) return;
    const hiddenNodes: HTMLElement[] = [];

    const hideArtifactCodeBlocks = () => {
      // Remove previous hiding
      hiddenNodes.forEach((node) => node.classList.remove("aui-artifact-hidden"));
      hiddenNodes.length = 0;

      if (artifacts.length > 0) {
        messageRoot.querySelectorAll("pre").forEach((pre) => {
          const codeElement = pre.querySelector("code");
          if (!codeElement) return;
          const langClass = codeElement.className || "";
          // Match language-tsx, language-jsx, or just tsx/jsx in class name
          if (/language-(tsx|jsx)|^tsx$|^jsx$/.test(langClass)) {
            pre.classList.add("aui-artifact-hidden");
            hiddenNodes.push(pre as HTMLElement);
          }
        });
      }
    };

    // Hide immediately
    hideArtifactCodeBlocks();

    // Watch for new code blocks being added during streaming
    const observer = new MutationObserver(() => {
      hideArtifactCodeBlocks();
    });

    observer.observe(messageRoot, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      hiddenNodes.forEach((node) => node.classList.remove("aui-artifact-hidden"));
    };
  }, [artifactsSignature, message?.id, artifacts.length]);

  if (artifacts.length === 0) return null;

  return (
    <div ref={hostRef} className="mt-4 flex flex-wrap gap-2">
      {artifacts.map((artifact) => (
        <ArtifactTrigger
          key={artifact.id}
          artifact={artifact}
          onClick={() => openArtifact(artifact.id)}
          isOpen={isPaneOpen && currentArtifact?.id === artifact.id}
        />
      ))}
    </div>
  );
};

