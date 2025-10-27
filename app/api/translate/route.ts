import { NextRequest, NextResponse } from "next/server";

interface TranslationRequest {
  text: string;
  from: string;
  to: string;
}

export async function POST(request: NextRequest) {
  try {
    const { text, from, to }: TranslationRequest = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Skip translation if source and target languages are the same
    if (from === to) {
      return NextResponse.json({ translatedText: text });
    }

    // Use MyMemory API (free, no key required for basic usage)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Translation API failed");
    }

    const data = await response.json();

    if (data.responseStatus !== 200 || !data.responseData) {
      throw new Error("Translation failed");
    }

    return NextResponse.json({ translatedText: data.responseData.translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}

