import { NextRequest, NextResponse } from "next/server";
import { getChatbotSessionByWallet, getChatbotMessagesBySession } from "@/lib/database/queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // Get session for this wallet
    const session = await getChatbotSessionByWallet(walletAddress);

    if (!session) {
      return NextResponse.json({
        sessionId: null,
        messages: [],
      });
    }

    // Get all messages for this session
    const dbMessages = await getChatbotMessagesBySession(session.id);
    const formattedMessages = dbMessages.map((msg) => ({
      id: msg.id,
      type: msg.type as "user" | "bot" | "admin",
      text: msg.text,
      timestamp: msg.created_at.toISOString(),
      translated: msg.translated_text || undefined,
      isTranslated: msg.is_translated,
    }));

    return NextResponse.json({
      sessionId: session.id,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}
