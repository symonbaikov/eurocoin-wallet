"use client";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

export function SiteFooter() {
  const t = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="dark:border-dark-outline dark:bg-dark-surface/95 border-t border-outline bg-surface/95">
      <div className="dark:text-dark-foregroundMuted mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-foregroundMuted md:flex-row md:items-center md:justify-between md:px-10">
        <span>{t("common.footer.copyright", { year })}</span>
        <div className="flex flex-wrap gap-3">
          <span>{t("common.footer.contact")}</span>
          <Link href="/info/security" className="underline hover:text-accent">
            {t("common.footer.policy")}
          </Link>
          <span>{t("common.footer.version")}</span>
        </div>
      </div>
    </footer>
  );
}
