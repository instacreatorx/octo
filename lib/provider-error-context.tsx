"use client";

import type { UIMessage } from "ai";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";

type ProviderErrorContextValue = {
  getError: (messageId: string) => string | undefined;
  setError: (messageId: string, error: string) => void;
  setPendingError: (error: string) => void;
  clearPendingError: () => void;
  version: number;
};

const ProviderErrorContext = createContext<ProviderErrorContextValue | null>(
  null,
);

export const ProviderErrorProvider: FC<{
  children: ReactNode;
  initialMessages?: UIMessage[];
}> = ({ children, initialMessages = [] }) => {
  const errorsRef = useRef(new Map<string, string>());
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const setError = useCallback(
    (messageId: string, error: string) => {
      errorsRef.current.set(messageId, error);
      bump();
    },
    [bump],
  );

  const setPendingError = useCallback(
    (error: string) => {
      errorsRef.current.set("__pending__", error);
      bump();
    },
    [bump],
  );

  const clearPendingError = useCallback(() => {
    errorsRef.current.delete("__pending__");
    bump();
  }, [bump]);

  const getError = useCallback((messageId: string) => {
    return errorsRef.current.get(messageId);
  }, []);

  useEffect(() => {
    for (const message of initialMessages) {
      const metadata = message.metadata as { providerError?: string } | undefined;
      if (message.role === "assistant" && metadata?.providerError) {
        errorsRef.current.set(message.id, metadata.providerError);
      }
    }
    bump();
  }, [initialMessages, bump]);

  const value = useMemo(
    () => ({
      getError,
      setError,
      setPendingError,
      clearPendingError,
      version,
    }),
    [getError, setError, setPendingError, clearPendingError, version],
  );

  return (
    <ProviderErrorContext.Provider value={value}>
      {children}
    </ProviderErrorContext.Provider>
  );
};

export function useProviderErrorStore() {
  const context = useContext(ProviderErrorContext);
  if (!context) {
    throw new Error("useProviderErrorStore must be used within ProviderErrorProvider");
  }
  return context;
}

export function useProviderErrorForMessage(
  messageId: string,
  options: {
    hasNoRealText: boolean;
    isRunning: boolean;
    isLastAssistant: boolean;
    fallbackText?: string;
    metadataError?: string;
  },
): string | undefined {
  const { getError, version } = useProviderErrorStore();
  void version;

  const stored = getError(messageId);
  if (stored) return stored;

  if (options.metadataError) return options.metadataError;

  if (options.fallbackText) return options.fallbackText;

  if (options.isLastAssistant) {
    const pending = getError("__pending__");
    if (pending && options.hasNoRealText && !options.isRunning) {
      return pending;
    }
  }

  return undefined;
}
