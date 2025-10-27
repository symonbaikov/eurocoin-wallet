export interface ChatMessageType {
  id: string;
  type: "user" | "bot" | "admin";
  text: string;
  timestamp: Date;
  translated?: string; // Translated version
  isTranslated: boolean;
}

export interface ChatSession {
  id: string;
  userWalletAddress?: `0x${string}`;
  locale: "ru" | "en";
  createdAt: Date;
  updatedAt: Date;
}
