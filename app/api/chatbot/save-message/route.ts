import { NextRequest, NextResponse } from "next/server";
import { createChatbotMessage } from "@/lib/database/queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, type, text, translated, isTranslated } = body;

    if (!sessionId || !type || !text) {
      return NextResponse.json(
        { error: "sessionId, type, and text are required" },
        { status: 400 },
      );
    }

    await createChatbotMessage({
      sessionId,
      type,
      text,
      translatedText: translated,
      isTranslated: isTranslated || false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}
