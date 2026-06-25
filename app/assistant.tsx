"use client";

import * as React from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { UIMessage } from "ai";
import { getToken } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SearchModal } from "@/components/search-modal";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { SettingsModal } from "@/components/settings-modal";
import { ArtifactProvider, useArtifacts } from "@/lib/contexts/artifact-context";
import { ArtifactPane } from "@/components/artifacts/artifact-pane";
import { ConversationThread } from "@/components/assistant-ui/big-thread-migration/conversation-thread";
import { ProviderErrorProvider, useProviderErrorStore } from "@/lib/provider-error-context";
import { ProviderErrorSync } from "@/components/assistant-ui/provider-error-sync";
import { getProviderErrorFromMetadata } from "@/lib/provider-error";
import { ThemeToggle } from "@/components/theme-toggle";

export const Assistant = ({
  chatId: propChatId,
  initialMessages = [],
  starterPrompt,
}: {
  chatId?: string;
  initialMessages?: UIMessage[];
  starterPrompt?: string | null;
}) => {
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [currentChatId, setCurrentChatId] = React.useState<string | undefined>(propChatId);
  const router = useRouter();
  const [pendingStarter, setPendingStarter] = React.useState<string | null>(starterPrompt ?? null);

  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  React.useEffect(() => {
    const handler = () => setSettingsOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("app-open-settings", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("app-open-settings", handler);
      }
    };
  }, []);

  React.useEffect(() => {
    if (propChatId && propChatId !== currentChatId) {
      setCurrentChatId(propChatId);
    }
  }, [propChatId, currentChatId]);

  React.useEffect(() => {
    setPendingStarter(starterPrompt ?? null);
  }, [starterPrompt]);

  const handleChatSelect = (chatId: string) => {
    if (chatId === "new") {
      router.push("/chat");
    } else {
      router.push(`/chat/${chatId}`);
    }
  };

  return (
    <ArtifactProvider>
      <ProviderErrorProvider initialMessages={initialMessages}>
        <AssistantRuntimeRoot
          currentChatId={currentChatId}
          initialMessages={initialMessages}
          pendingStarter={pendingStarter}
          propChatId={propChatId}
          router={router}
          setPendingStarter={setPendingStarter}
          searchModalOpen={searchModalOpen}
          setSearchModalOpen={setSearchModalOpen}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          handleChatSelect={handleChatSelect}
        />
      </ProviderErrorProvider>
    </ArtifactProvider>
  );
};

const AssistantRuntimeRoot: React.FC<{
  currentChatId?: string;
  initialMessages: UIMessage[];
  pendingStarter: string | null;
  propChatId?: string;
  router: ReturnType<typeof useRouter>;
  setPendingStarter: (value: string | null) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  handleChatSelect: (chatId: string) => void;
}> = ({
  currentChatId,
  initialMessages,
  pendingStarter,
  propChatId,
  router,
  setPendingStarter,
  searchModalOpen,
  setSearchModalOpen,
  settingsOpen,
  setSettingsOpen,
  handleChatSelect,
}) => {
  const { setPendingError, setError, clearPendingError } = useProviderErrorStore();

  const runtime = useChatRuntime({
    id: currentChatId,
    messages: initialMessages,
    onError: (error) => {
      setPendingError(error.message);
    },
    onFinish: ({ message }) => {
      if (message.role !== "assistant") return;
      const metadataError = getProviderErrorFromMetadata(message.metadata);
      if (metadataError) {
        setError(message.id, metadataError);
        clearPendingError();
      }
    },
  });

  React.useEffect(() => {
    if (!pendingStarter) return;
    const state = runtime.thread.getState();

    if (state.messages.length > 0) {
      setPendingStarter(null);
      if (propChatId) {
        router.replace(`/chat/${propChatId}`);
      }
      return;
    }

    runtime.thread.composer.setText(pendingStarter);
    runtime.thread.composer.send();
    setPendingStarter(null);
    if (propChatId) {
      router.replace(`/chat/${propChatId}`);
    }
  }, [pendingStarter, runtime, propChatId, router, setPendingStarter]);

  return (
    <AssistantInner
      runtime={runtime}
      searchModalOpen={searchModalOpen}
      setSearchModalOpen={setSearchModalOpen}
      settingsOpen={settingsOpen}
      setSettingsOpen={setSettingsOpen}
      handleChatSelect={handleChatSelect}
    />
  );
};

const AssistantInner: React.FC<{
  runtime: ReturnType<typeof useChatRuntime>;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  handleChatSelect: (chatId: string) => void;
}> = ({
  runtime,
  searchModalOpen,
  setSearchModalOpen,
  settingsOpen,
  setSettingsOpen,
  handleChatSelect,
}) => {
  const { currentArtifact, isPaneOpen, closePane, paneWidth, setPaneWidth } = useArtifacts();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ProviderErrorSync />
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5 relative">
          <AppSidebar />
          <SidebarInset className={`${isPaneOpen ? "lg:mr-0 " : ""}relative`}>
            <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2">
              <SidebarTrigger className="pointer-events-auto" />
            </div>
            <div className="pointer-events-none absolute right-4 top-4 z-10">
              <div className="pointer-events-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchModalOpen(true)}
                  className="h-8 w-8"
                >
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search chats</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  className="h-8 w-8"
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
                <ThemeToggle />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <ConversationThread />
            </div>
          </SidebarInset>

          <ArtifactPane
            artifact={currentArtifact}
            isOpen={isPaneOpen}
            onClose={closePane}
            onResize={setPaneWidth}
            paneWidth={paneWidth}
          />
        </div>
      </SidebarProvider>
      <SearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onChatSelect={handleChatSelect}
      />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </AssistantRuntimeProvider>
  );
};

