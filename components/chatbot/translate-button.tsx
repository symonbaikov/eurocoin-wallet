"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { ChatMessageType } from "./types";

interface TranslateButtonProps {
  message: ChatMessageType;
  onTranslate: () => void;
}

export function TranslateButton({ message, onTranslate }: TranslateButtonProps) {
  const [isTranslated, setIsTranslated] = useState(message.isTranslated);

  const handleTranslate = () => {
    onTranslate();
    setIsTranslated(!isTranslated);
  };

  return (
    <button
      onClick={handleTranslate}
      className="dark:text-dark-foregroundMuted dark:hover:text-dark-foreground flex items-center gap-1 rounded px-2 py-0.5 text-xs text-foregroundMuted transition-colors hover:text-foreground"
      title={isTranslated ? "Показать оригинал" : "Перевести"}
    >
      <Languages className="h-3 w-3" />
      <span>{isTranslated ? "Оригинал" : "Перевести"}</span>
    </button>
  );
}
