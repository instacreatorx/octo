import { loadChat } from "@/lib/db";
import { Assistant } from "@/app/assistant";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type ChatPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ starter?: string }>;
};

export default async function ChatPage({
  params,
  searchParams,
}: ChatPageProps) {
  const { id } = await params;
  const { starter } = (await searchParams) ?? {};

  // Note: Authentication is checked client-side in the Assistant component
  // Server-side we just verify the chat exists
  // Client-side will redirect to /login if no token
  
  try {
    // Verify chat exists
    const chat = await prisma.chat.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!chat) {
      notFound();
    }

    const messages = await loadChat(id);
    return (
      <Assistant chatId={id} initialMessages={messages} starterPrompt={starter} />
    );
  } catch (error) {
    console.error(error);
    notFound();
  }
}
