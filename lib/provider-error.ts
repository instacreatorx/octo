export const PROVIDER_ERROR_FALLBACK =
  "The AI provider did not return a valid response. Please retry in a few seconds.";

type UIMessageChunkLike = {
  type: string;
  delta?: string;
  errorText?: string;
  messageMetadata?: unknown;
};

export function getProviderErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return PROVIDER_ERROR_FALLBACK;
}

export function isProviderErrorFallbackText(text: string): boolean {
  return text.trim() === PROVIDER_ERROR_FALLBACK;
}

export function hasRealAssistantText(
  content: ReadonlyArray<{ type: string; text?: string }>,
): boolean {
  return content.some((part) => {
    if (part.type === "text" || part.type === "reasoning") {
      const text = typeof part.text === "string" ? part.text.trim() : "";
      if (!text) return false;
      return !isProviderErrorFallbackText(text);
    }
    return false;
  });
}

export function getProviderErrorFromMetadata(
  metadata: unknown,
): string | undefined {
  if (typeof metadata !== "object" || metadata === null) return undefined;
  const providerError = (metadata as { providerError?: unknown }).providerError;
  return typeof providerError === "string" && providerError.trim()
    ? providerError
    : undefined;
}

export async function pipeUIMessageStreamWithProviderError(
  stream: ReadableStream<unknown>,
  write: (part: unknown) => void,
  onProviderError?: (errorText: string) => void,
): Promise<void> {
  const reader = stream.getReader();
  let sawText = false;
  let finished = false;
  let lastErrorText: string | undefined;

  const writeProviderError = (errorText: string) => {
    lastErrorText = errorText;
    onProviderError?.(errorText);
    write({
      type: "message-metadata",
      messageMetadata: { providerError: errorText },
    });
    write({ type: "error", errorText });
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = value as UIMessageChunkLike;

      if (chunk.type === "text-delta" && typeof chunk.delta === "string" && chunk.delta.trim()) {
        sawText = true;
      }

      if (chunk.type === "error") {
        const errorText = chunk.errorText?.trim() || PROVIDER_ERROR_FALLBACK;
        writeProviderError(errorText);
        if (!finished) {
          write({ type: "finish" });
          finished = true;
        }
        return;
      }

      if (chunk.type === "finish") {
        if (!sawText) {
          writeProviderError(lastErrorText ?? PROVIDER_ERROR_FALLBACK);
        }
        write(chunk);
        finished = true;
        continue;
      }

      write(chunk);
    }

    if (!sawText && !finished) {
      writeProviderError(lastErrorText ?? PROVIDER_ERROR_FALLBACK);
      write({ type: "finish" });
    }
  } catch (error) {
    writeProviderError(getProviderErrorMessage(error));
    if (!finished) {
      write({ type: "finish" });
    }
  }
}
