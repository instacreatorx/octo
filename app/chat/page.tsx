"use client";

import { useCallback, useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Settings } from "lucide-react";
import { getToken } from "@/lib/auth/client";

import { StarterThread } from "@/components/assistant-ui/big-thread-migration/starter-thread";
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
import { Button } from "@/components/ui/button";
import { SearchModal } from "@/components/search-modal";
import { SettingsModal } from "@/components/settings-modal";

export const dynamic = "force-dynamic";

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Open settings when sidebar dropdown dispatches custom event
  useEffect(() => {
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

  const handleSubmit = useCallback(
    async (prompt: string) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const token = getToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch("/api/chat/create", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem("auth_token");
          router.push('/login');
          return;
        }
        
        if (!response.ok) {
          throw new Error("Failed to create chat");
        }
        const data = (await response.json()) as { chatId?: string };
        if (!data?.chatId) {
          throw new Error("Missing chat id");
        }

        const params = new URLSearchParams({ starter: prompt });
        router.push(`/chat/${data.chatId}?${params.toString()}`);
      } catch (error) {
        console.error("Failed to start chat", error);
        setSubmitError("Unable to start a new chat. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router],
  );

  const threadError = useMemo(() => submitError, [submitError]);

  return (
    <>
      <SidebarProvider>
        <div className="relative flex h-dvh w-full pr-0.5">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#"></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>New chat</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex items-center gap-2">
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
            </header>
            <div className="flex-1 overflow-hidden">
              <StarterThread
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={threadError}
              />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <SearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onChatSelect={(chatId) => {
          if (chatId === "new") return;
          router.push(`/chat/${chatId}`);
        }}
      />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">در حال بارگذاری...</div>}>
      <ChatPageInner />
    </Suspense>
  );
}
