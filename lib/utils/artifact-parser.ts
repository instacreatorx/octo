import type { Artifact } from "@/lib/types/artifact";

type ParsedArtifact = Artifact;

const ARTIFACT_LANGS = ["tsx", "jsx"];

export function parseArtifactsFromMessage(
  content: string,
  messageId?: string,
): ParsedArtifact[] {
  if (!content) return [];

  const artifacts: ParsedArtifact[] = [];
  const fenceRegex = /```([a-zA-Z]+)\s*\n([\s\S]*?)(```|$)/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = fenceRegex.exec(content)) !== null) {
    const language = match[1]?.toLowerCase();
    if (!language || !ARTIFACT_LANGS.includes(language)) continue;

    const body = match[2] ?? "";
    const closingFence = match[3] === "```";
    const code = body.replace(/```$/, "").trim();

    if (!looksLikeReactComponent(code)) continue;

    artifacts.push({
      id: `${messageId ?? "temp"}-${index}`,
      title: deriveTitle(code) ?? `Interactive artifact ${index + 1}`,
      code,
      language,
      status: closingFence ? "ready" : "streaming",
      timestamp: Date.now(),
      messageId,
    });

    index += 1;
  }

  return artifacts;
}

function looksLikeReactComponent(code: string) {
  if (!code) return false;
  return (
    /return\s+\(/.test(code) ||
    /=>\s*\(/.test(code) ||
    /React\.createElement/.test(code)
  );
}

function deriveTitle(code: string): string | null {
  const functionMatch = code.match(/function\s+([A-Z]\w*)/);
  if (functionMatch) return beautifyTitle(functionMatch[1]);

  const constMatch = code.match(/const\s+([A-Z]\w*)\s*=\s*\(/);
  if (constMatch) return beautifyTitle(constMatch[1]);

  const exportDefaultMatch = code.match(/export\s+default\s+([A-Z]\w*)/);
  if (exportDefaultMatch) return beautifyTitle(exportDefaultMatch[1]);

  return null;
}

function beautifyTitle(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
}

