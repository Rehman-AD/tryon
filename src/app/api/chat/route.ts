import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.chat");
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function buildSystemPrompt(userContext?: {
  name?: string;
  bodyType?: string;
  skinTone?: string;
  faceShape?: string;
  gender?: string;
  sizePreference?: string;
  stylePreference?: string[];
}): string {
  let prompt = `You are GlamVerse's AI fashion stylist — a personal shopping assistant embedded in an AI-powered fashion e-commerce store. You help users with:
- Clothing and outfit recommendations
- Color coordination advice
- Body type and face shape styling tips
- Occasion-based outfit suggestions
- Fashion trends and styling guidance
- Product recommendations from our store

Keep responses concise, friendly, and fashion-focused. If asked about non-fashion topics, politely redirect to fashion advice. Never give medical or health advice.`;

  if (userContext?.name) {
    prompt += `\n\n## About This User`;
    prompt += `\n- Name: ${userContext.name}`;
    if (userContext.gender) prompt += `\n- Gender: ${userContext.gender}`;
    if (userContext.bodyType) prompt += `\n- Body Type: ${userContext.bodyType}`;
    if (userContext.skinTone) prompt += `\n- Skin Tone: ${userContext.skinTone}`;
    if (userContext.faceShape) prompt += `\n- Face Shape: ${userContext.faceShape}`;
    if (userContext.sizePreference) prompt += `\n- Size: ${userContext.sizePreference}`;
    if (userContext.stylePreference?.length) prompt += `\n- Style Preferences: ${userContext.stylePreference.join(", ")}`;
    prompt += `\n\nUse this information to give personalized advice. Address the user by name. Tailor color, style, and fit suggestions to their specific body type and skin tone.`;
  }

  return prompt;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = Math.random().toString(36).slice(2, 10);

  try {
    const { messages, userContext } = await req.json();
    const lastUserMsg = messages[messages.length - 1]?.content?.slice(0, 80) || "empty";

    log.info(`[${requestId}] Chat request`, {
      messageCount: messages.length,
      lastMessage: lastUserMsg,
      hasUserContext: !!userContext?.name,
    });

    if (!ANTHROPIC_API_KEY) {
      log.warn(`[${requestId}] ANTHROPIC_API_KEY not configured`);
      return NextResponse.json(
        { reply: "Chatbot is not configured. Please set ANTHROPIC_API_KEY in .env.local" },
        { status: 200 }
      );
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const systemPrompt = buildSystemPrompt(userContext);

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const reply =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "Sorry, I couldn't generate a response.";

    const elapsed = Date.now() - start;
    log.info(`[${requestId}] Chat response`, {
      elapsed: `${elapsed}ms`,
      replyLength: reply.length,
      model: response.model,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const elapsed = Date.now() - start;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    log.error(`[${requestId}] Chat failed`, { elapsed: `${elapsed}ms`, error: errorMessage });

    if (errorMessage.includes("rate_limit") || errorMessage.includes("429")) {
      return NextResponse.json({
        reply: "The AI stylist is currently busy. Please try again in a moment!",
      });
    }

    return NextResponse.json(
      { reply: `Sorry, something went wrong: ${errorMessage}` },
      { status: 200 }
    );
  }
}
