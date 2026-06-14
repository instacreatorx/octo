import { createChat } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";

export const POST = requireAuth(async (request, user) => {
  try {
    const chatId = await createChat(user.id);
    return Response.json({ chatId });
  } catch (error) {
    console.error("❌ API: Failed to create chat via /api/chat/create:", error);
    return new Response("Failed to create chat", { status: 500 });
  }
});


