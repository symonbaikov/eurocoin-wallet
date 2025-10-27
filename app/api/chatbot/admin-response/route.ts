import { NextRequest, NextResponse } from "next/server";
import { createChatbotMessage, getChatbotSessionById } from "@/lib/database/queries";

interface AdminResponseRequest {
  sessionId: string;
  text: string;
  adminId: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: AdminResponseRequest = await request.json();

    console.log("[admin-response] Received request:", {
      sessionId: body.sessionId,
      text: body.text,
      adminId: body.adminId,
    });

    if (!body.sessionId || !body.text) {
      return NextResponse.json({ error: "sessionId and text are required" }, { status: 400 });
    }

    // Verify session exists
    const session = await getChatbotSessionById(body.sessionId);
    if (!session) {
      console.log("[admin-response] Session not found:", body.sessionId);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log("[admin-response] Session found:", session);

    // TODO: Verify admin permissions (check adminId against authorized admin IDs)

    // Save admin message to database
    const adminMessage = await createChatbotMessage({
      sessionId: body.sessionId,
      type: "admin",
      text: body.text,
      isAdminResponse: true,
    });

    console.log("[admin-response] Admin response saved:", {
      sessionId: body.sessionId,
      adminId: body.adminId,
      messageId: adminMessage.id,
      timestamp: new Date().toISOString(),
    });

    // TODO: Broadcast to user via SSE/WebSocket
    // For now, we rely on periodic polling on the client side

    return NextResponse.json({
      success: true,
      messageId: adminMessage.id,
      text: adminMessage.text,
    });
  } catch (error) {
    console.error("[admin-response] Error processing admin response:", error);
    return NextResponse.json({ error: "Failed to process response" }, { status: 500 });
  }
}
