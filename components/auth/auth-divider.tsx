'use client';

/**
 * Auth Divider Component
 * Visual separator between MetaMask and OAuth authentication methods
 * Displays "OR" text with horizontal lines
 */

import { useTranslation } from '@/hooks/use-translation';

export function AuthDivider() {
  const t = useTranslation();

  return (
    <div className="relative my-4">
      {/* Horizontal line */}
      <div className="absolute inset-0 flex items-center">
        <div className="dark:border-dark-outline w-full border-t border-outline" />
      </div>

      {/* OR text */}
      <div className="relative flex justify-center text-xs uppercase">
        <span className="dark:bg-dark-surface dark:text-dark-foregroundMuted bg-surface px-2 text-foregroundMuted">
          {t('login.divider.or')}
        </span>
      </div>
    </div>
  );
}
