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
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchModal } from "@/components/search-modal";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { SettingsModal } from "@/components/settings-modal";
import { ArtifactProvider, useArtifacts } from "@/lib/contexts/artifact-context";
import { ArtifactPane } from "@/components/artifacts/artifact-pane";
import { ConversationThread } from "@/components/assistant-ui/big-thread-migration/conversation-thread";

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

  // Check authentication
  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Listen for global settings open event from sidebar dropdown
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
  
  // Update currentChatId when propChatId changes (but only if it's a new chatId)
  React.useEffect(() => {
    if (propChatId && propChatId !== currentChatId) {
      setCurrentChatId(propChatId);
    }
  }, [propChatId, currentChatId]);

  React.useEffect(() => {
    setPendingStarter(starterPrompt ?? null);
  }, [starterPrompt]);
  
  const runtime = useChatRuntime({
    id: currentChatId,
    messages: initialMessages,
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
  }, [pendingStarter, runtime, propChatId, router]);

  const handleChatSelect = (chatId: string) => {
    if (chatId === 'new') {
      // Handle new chat creation - redirect to /chat page
      router.push('/chat');
    } else {
      // Navigate to existing chat using Next.js router
      router.push(`/chat/${chatId}`);
    }
  };

  return (
    <ArtifactProvider>
      <AssistantInner 
        runtime={runtime}
        chatId={propChatId}
        searchModalOpen={searchModalOpen}
        setSearchModalOpen={setSearchModalOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        handleChatSelect={handleChatSelect}
      />
    </ArtifactProvider>
  );
};

const AssistantInner: React.FC<{
  runtime: ReturnType<typeof useChatRuntime>;
  chatId?: string;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  handleChatSelect: (chatId: string) => void;
}> = ({ runtime, chatId, searchModalOpen, setSearchModalOpen, settingsOpen, setSettingsOpen, handleChatSelect }) => {
  const { currentArtifact, isPaneOpen, closePane, paneWidth, setPaneWidth } = useArtifacts();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
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
          
          {/* Artifact Pane */}
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
