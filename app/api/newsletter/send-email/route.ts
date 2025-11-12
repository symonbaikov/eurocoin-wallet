import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { NewsletterEmail } from "@/emails/NewsletterEmail";

// Настройка Nodemailer
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// Get photo URL from Telegram file_id
async function getTelegramPhotoUrl(fileId: string): Promise<string | null> {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_API_KEY;
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_API_KEY not configured");
      return null;
    }

    // Get file path from Telegram
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`,
    );

    if (!fileResponse.ok) {
      console.error("Failed to get file info from Telegram");
      return null;
    }

    const fileData = await fileResponse.json();
    if (!fileData.ok || !fileData.result?.file_path) {
      console.error("Invalid file data from Telegram");
      return null;
    }

    // Return direct URL to file
    return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
  } catch (error) {
    console.error("Error getting Telegram photo URL:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, photoFileId, authToken } = await request.json();

    // Проверка токена
    if (authToken !== process.env.NEWSLETTER_AUTH_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if we have at least some content
    if (!message && !photoFileId) {
      return NextResponse.json({ error: "Message or photo is required" }, { status: 400 });
    }

    // Получаем всех верифицированных подписчиков
    const subscribers = await query(
      "SELECT email FROM newsletter_subscribers WHERE verified = true AND is_active = true AND email IS NOT NULL",
    );

    if (subscribers.rows.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0 });
    }

    const transporter = createTransporter();
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get photo URL if photoFileId is provided
    let photoUrl: string | null = null;
    if (photoFileId) {
      photoUrl = await getTelegramPhotoUrl(photoFileId);
      if (!photoUrl) {
        console.warn("Failed to get photo URL, continuing without image");
      }
    }

    // Render email using React Email
    const unsubscribeUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe`
      : undefined;
    const emailHtml = await render(
      React.createElement(NewsletterEmail, {
        message: message || "",
        photoUrl,
        unsubscribeUrl,
      }),
    );

    // Send emails
    for (const subscriber of subscribers.rows) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: subscriber.email,
          subject: "EuroCoin Newsletter",
          html: emailHtml,
          text: message || "EuroCoin Newsletter",
          attachments: photoUrl
            ? [
                {
                  filename: "newsletter-image.jpg",
                  path: photoUrl,
                  cid: "newsletter-image", // Content ID for embedding in HTML
                },
              ]
            : undefined,
        });
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${subscriber.email}: ${error}`);
        console.error(`Error sending to ${subscriber.email}:`, error);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      total: subscribers.rows.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Limit errors
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 });
  }
}
