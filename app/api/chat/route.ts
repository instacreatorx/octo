import {
  streamText,
  UIMessage,
  convertToModelMessages,
  validateUIMessages,
  TypeValidationError,
} from "ai";
import { createOpenAI } from '@ai-sdk/openai';
import {
  type InferUITools,
  type UIDataTypes,
  stepCountIs,
} from 'ai';
import { loadChat, saveChat, createChat } from '@/lib/db';
import { mssqlTools } from '@/lib/rdbms/mssql/tools';
import { mssqlWriteTools } from '@/lib/rdbms/mssql/tools_write';
import { requireAuth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';

const tools = { ...mssqlTools, ...mssqlWriteTools } as const;

export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

import { getEffectiveOpenAIConfig } from '@/lib/services/settings';

const openai = createOpenAI();

// GET handler for resuming streams
export const GET = requireAuth(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  try {
    // Verify chat belongs to user
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.userId && chat.userId !== user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    const messages = await loadChat(chatId);
    return Response.json({ messages });
  } catch (error) {
    console.error('❌ API GET: Failed to load chat:', error);
    return new Response('Chat not found', { status: 404 });
  }
});

export const POST = requireAuth(async (req, user) => {
  const body = await req.json();
  const messages = (body?.messages ?? []) as ChatMessage[];
  const chatId = (body?.id ?? body?.chatId) as string | undefined;

  console.log('🔍 API: Received request with chatId:', chatId, 'and', messages.length, 'messages');

  // Determine the chatId to use
  let currentChatId: string;
  let isNewChat = false;
  
  if (!chatId) {
    // No chatId provided - create a new chat
    try {
      currentChatId = await createChat(user.id);
      isNewChat = true;
      console.log('📝 API: Created new chat with ID:', currentChatId);
    } catch (error) {
      console.error('❌ API: Failed to create new chat:', error);
      return new Response('Failed to create chat', { status: 500 });
    }
  } else {
    // ChatId provided - verify it exists and belongs to user
    try {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { userId: true },
      });

      if (!chat) {
        // ChatId provided but doesn't exist - create a new chat instead
        console.log('⚠️ API: Provided chatId does not exist, creating new chat');
        try {
          currentChatId = await createChat(user.id);
          isNewChat = true;
          console.log('📝 API: Created new chat with ID:', currentChatId);
        } catch (createError) {
          console.error('❌ API: Failed to create new chat:', createError);
          return new Response('Failed to create chat', { status: 500 });
        }
      } else {
        // Verify ownership
        if (chat.userId && chat.userId !== user.id) {
          return new Response('Forbidden', { status: 403 });
        }
        await loadChat(chatId);
        currentChatId = chatId;
        console.log('📝 API: Using existing chat with ID:', currentChatId);
      }
    } catch (error) {
      console.error('❌ API: Error verifying chat:', error);
      return new Response('Failed to verify chat', { status: 500 });
    }
  }

  // Load previous messages from database
  let previousMessages: UIMessage[] = [];
  if (!isNewChat) {
    try {
      previousMessages = await loadChat(currentChatId);
      console.log('📚 API: Loaded', previousMessages.length, 'previous messages from database');
    } catch (error) {
      console.error('❌ API: Failed to load chat:', error);
      // If chat doesn't exist, start with empty history
      previousMessages = [];
    }
  } else {
    console.log('📚 API: New chat, starting with empty message history');
  }

  // Append new message to previous messages
  const allMessages = [...previousMessages, ...messages];
  console.log('📝 API: Total messages to process:', allMessages.length);

  // Validate loaded messages against tools
  let validatedMessages: UIMessage[];
  try {
    validatedMessages = await validateUIMessages({
      messages: allMessages,
      tools: tools as any,
    });
  } catch (error) {
    if (error instanceof TypeValidationError) {
      console.error('⚠️ API: Database messages validation failed:', error);
      // Start with empty history if validation fails
      validatedMessages = messages;
    } else {
      throw error;
    }
  }

  const effective = await getEffectiveOpenAIConfig();
  const result = streamText({
    model: createOpenAI({ baseURL: effective.baseURL, apiKey: effective.apiKey }).chat("gpt-oss-120b"),
    messages: convertToModelMessages(validatedMessages),
    stopWhen: stepCountIs(5),
    tools,
    system: `You are OrangeAi 🍊, an expert Microsoft SQL Server (MSSQL) assistant. PostgreSQL tools are NOT available. Use only MSSQL tools.

Available MSSQL tools (all end with "Mssql"):
- listSchemasMssql
- listTablesMssql
- listColumnsMssql
- runReadOnlySQLMssql
- createTableMssql, createIndexMssql, createViewMssql, dropObjectMssql
- insertRowsMssql, updateRowsMssql, deleteRowsMssql

Rules:
- If the user mentions "mssql", "SQL Server", "Microsoft SQL", or names a tool ending in "Mssql", you MUST use the corresponding MSSQL tool above.
- Do NOT call any PostgreSQL tools (listSchemas, listTables, listColumns, runReadOnlySQL, etc.) — they are disabled.
- If the user is unclear about the database, assume MSSQL (only MSSQL tools exist).

Behavior:
- Prefer safe analytics (SELECT/CTE). Before any write, explain what you will change and require confirm=true.
- When asked, decide whether to:
  1) Inspect metadata: listSchemasMssql / listTablesMssql / listColumnsMssql
  2) Run a read-only query: runReadOnlySQLMssql
  3) Propose a write tool call with confirm=false and ask the user to resubmit with confirm=true.
- Write clear, efficient SQL for MSSQL; use LIKE (or COLLATE for case-insensitive), qualify tables with schema when ambiguous.
- Return results that are easy to visualize (include at least two columns when possible). If something is missing, ask a concise clarifying question.

Charting and Data Visualization:
CRITICAL: When users request charts, diagrams, or visualizations (pie charts, bar charts, area charts, line charts, etc.), you MUST create ONLY ONE React component with a default export. The component will be automatically rendered in the Artifact Pane - the user does NOT need to install anything or use it in code.

STRICT RULES:
1. Create ONLY the chart component itself - NEVER create a separate App wrapper component or any second file.
2. The component MUST use "export default" (not named export).
3. The component is automatically displayed in the Artifact Pane - do NOT provide installation instructions (no "npm install recharts", no "save as file", no "import and render").
4. Do NOT include "How to use" sections or any instructions about using the component in a project.
5. Simply create the chart component wrapped in a tsx code block - that's all. The system handles the rest automatically.
6. React and Recharts are already available in the artifact environment - no installation needed.
7. Create beautiful, well-styled components using divs and TSX with proper styling.
8. Users are industrial engineers familiar with diagrams - no need to explain TSX, Recharts, or technical details.

Example CORRECT structure:
\`\`\`tsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const CountryShareChart = () => {
  const data = [...];
  return (
    <div style={{ padding: "20px" }}>
      <PieChart width={400} height={400}>
        ...
      </PieChart>
    </div>
  );
};

export default CountryShareChart;
\`\`\`

Example WRONG (DO NOT DO THIS):
- Creating an App.tsx file that imports the chart component
- Providing "npm install" instructions
- Including "How to use" sections
- Creating two separate files`,
  });

  // ensure stream runs to completion even if client aborts
  result.consumeStream();

  const response = result.toUIMessageStreamResponse({
    originalMessages: validatedMessages,
    // generate a stable server-side id when missing/blank (AI SDK v5)
    generateMessageId: () => crypto.randomUUID(),
    onFinish: async ({ messages }) => {
      // normalize empty string ids to undefined so generateMessageId kicks in next round
      const normalized = messages.map((m: any) => ({
        ...m,
        id: m?.id && String(m.id).length > 0 ? m.id : crypto.randomUUID(),
      }));

      // de-duplicate by id while preserving order (keeps last occurrence)
      const seen = new Set<string>();
      const deduped: any[] = [];
      for (let i = normalized.length - 1; i >= 0; i--) {
        const msg = normalized[i];
        if (!seen.has(msg.id)) {
          seen.add(msg.id);
          deduped.unshift(msg);
        }
      }

      console.log('💾 API: onFinish called with', messages.length, 'messages (deduped to', deduped.length, '), saving to chatId:', currentChatId);
      try {
        await saveChat(currentChatId, deduped as any);
        console.log('✅ API: Successfully saved chat to database');
      } catch (error) {
        console.error('❌ API: Failed to save chat:', error);
      }
    },
  });

  // Add chatId to response headers if it was newly created (for client-side redirect)
  // This includes cases where chatId was provided but didn't exist
  if (isNewChat) {
    response.headers.set('X-Chat-Id', currentChatId);
  }

  return response;
});