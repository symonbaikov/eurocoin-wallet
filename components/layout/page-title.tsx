"use client";

import { useEffect, useMemo } from "react";
import { useActiveSection } from "@/hooks/use-active-section";

interface PageTitleProps {
  title: string;
  description?: string;
  enableSectionTracking?: boolean;
}

const SECTION_TITLES: Record<string, string> = {
  home: "Dashboard",
  exchange: "Exchange",
  contact: "Contact",
  wallet: "Wallet",
  investigation: "Investigation",
  "token-balance": "Token",
  faq: "FAQ",
};

export function PageTitle({ title, enableSectionTracking = false }: PageTitleProps) {
  const activeSection = useActiveSection();

  const resolvedTitle = useMemo(() => {
    if (!enableSectionTracking) {
      return `${title} - EuroCoin`;
    }

    const sectionTitle = SECTION_TITLES[activeSection] ?? SECTION_TITLES.home;
    return `${sectionTitle} - EuroCoin`;
  }, [title, enableSectionTracking, activeSection]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = resolvedTitle;

    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) {
      metaTitle.setAttribute("content", resolvedTitle);
    }
  }, [resolvedTitle]);

  return null;
}
