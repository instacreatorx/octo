"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";

export default function BIPageRoute() {
  const router = useRouter();
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
        router.push("/login");
        return;
      }

      const response = await fetch("/api/bi/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              parts: [{ type: "text", text: inputValue }],
            },
          ],
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate dashboard");
      }

      // Read the stream and look for saveBIConfig tool result with BI ID
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let biId: string | null = null;
      let fullStream = "";
      let saveBIConfigToolCallId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullStream += chunk;
          
          // Parse each line of the stream (format: data: {...})
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            try {
              const data = JSON.parse(line.slice(6)); // Remove "data: " prefix
              
              // Track toolCallId when saveBIConfig tool input starts
              if (data.type === 'tool-input-start' && data.toolName === 'saveBIConfig') {
                saveBIConfigToolCallId = data.toolCallId;
              }
              
              // Look for tool-output-available events matching the saveBIConfig toolCallId
              if (data.type === 'tool-output-available' && data.toolCallId === saveBIConfigToolCallId) {
                try {
                  // The output is a JSON string, parse it
                  const output = typeof data.output === 'string' 
                    ? JSON.parse(data.output) 
                    : data.output;
                  
                  if (output.biId) {
                    biId = output.biId;
                    break;
                  }
                } catch (e) {
                  // If parsing fails, try direct extraction from the output string
                  const biIdMatch = typeof data.output === 'string' 
                    ? data.output.match(/"biId"\s*:\s*"([^"]+)"/)
                    : null;
                  if (biIdMatch && biIdMatch[1]) {
                    biId = biIdMatch[1];
                    break;
                  }
                }
              }
            } catch (e) {
              // Not valid JSON, continue
            }
          }
          
          // Also try direct pattern matching in the full stream as fallback
          if (!biId) {
            const biIdMatch = fullStream.match(/"biId"\s*:\s*"([a-zA-Z0-9-]{20,})"/);
            if (biIdMatch && biIdMatch[1]) {
              biId = biIdMatch[1];
              break;
            }
          }
          
          if (biId) break;
        }
      }

      // Redirect if we found a BI ID
      if (biId) {
        router.push(`/bi/${biId}`);
        return;
      }

      // If no BI ID found, check the full stream one more time
      const finalMatch = fullStream.match(/"biId"\s*:\s*"([^"]+)"/);
      if (finalMatch && finalMatch[1]) {
        router.push(`/bi/${finalMatch[1]}`);
        return;
      }

      // If still no BI ID, we couldn't extract it from the stream
      setError("Dashboard generation completed, but we couldn't extract the BI ID from the response. The dashboard may have been created - please check the URL or try again.");

    } catch (error: any) {
      console.error("Failed to generate BI dashboard:", error);
      setError(error.message || "Failed to generate dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Business Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            Ask a question to generate your dashboard. The AI will explore your database and create visualizations.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                placeholder="Ask a question to generate charts... (e.g., 'Show sales by month', 'Display revenue by category')"
                className="flex-1 px-4 py-2 border border-border rounded-md bg-background"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </form>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p className="mb-2">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Enter your question about the data you want to visualize</li>
            <li>The AI will explore your database structure</li>
            <li>It will run SQL queries to retrieve the data</li>
            <li>A dashboard with charts will be generated automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
