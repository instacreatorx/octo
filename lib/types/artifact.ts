export interface Artifact {
  id: string;
  title: string;
  description?: string;
  code: string; // React JSX/TSX code
  language?: string;
  status: "streaming" | "ready";
  timestamp: number;
  messageId?: string; // Link to the message that created this artifact
}

export type ArtifactViewMode = 'rendered' | 'code' | 'both';

