"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { ChatMessageType } from "./types";
import { useLanguage } from "@/components/providers/language-provider";

interface TranslateButtonProps {
  message: ChatMessageType;
  onTranslate: (translated: string) => void;
}

export function TranslateButton({ message, onTranslate }: TranslateButtonProps) {
  const [isTranslated, setIsTranslated] = useState(message.isTranslated);
  const [isLoading, setIsLoading] = useState(false);
  const { locale } = useLanguage();

  const handleTranslate = async () => {
    if (message.isTranslated && message.translated) {
      // Already translated, just toggle
      setIsTranslated(!isTranslated);
      return;
    }

    setIsLoading(true);
    try {
      // Detect source language (assume RU if current locale is EN, and vice versa)
      const from = locale === "ru" ? "en" : "ru";
      const to = locale;

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message.text, from, to }),
      });

      if (response.ok) {
        const { translatedText } = await response.json();
        onTranslate(translatedText);
        setIsTranslated(true);
      } else {
        console.error("Translation failed");
      }
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTranslate}
      disabled={isLoading}
      className="dark:text-dark-foregroundMuted dark:hover:text-dark-foreground flex items-center gap-1 rounded px-2 py-0.5 text-xs text-foregroundMuted transition-colors hover:text-foreground disabled:opacity-50"
      title={isTranslated ? "Показать оригинал" : "Перевести"}
    >
      <Languages className="h-3 w-3" />
      <span>{isLoading ? "Перевожу..." : isTranslated ? "Оригинал" : "Перевести"}</span>
    </button>
  );
}
