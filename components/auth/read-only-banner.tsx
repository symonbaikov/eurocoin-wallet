'use client';

/**
 * Read-Only Banner Component
 * Displays information for email users about limited access
 * Suggests connecting MetaMask for full functionality
 */

import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useState } from 'react';
import { toast } from "react-toastify";

interface ReadOnlyBannerProps {
  /** Show connect wallet button */
  showConnectButton?: boolean;
  /** Compact mode (smaller padding) */
  compact?: boolean;
}

export function ReadOnlyBanner({ showConnectButton = true, compact = false }: ReadOnlyBannerProps) {
  const t = useTranslation();
  const { connect, isConnecting } = useWalletConnection();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      await connect();
      toast.success(t('auth.upgradeSuccess'));
    } catch (error) {
      console.error('[ReadOnlyBanner] Upgrade error:', error);
      const message = error instanceof Error ? error.message : t('auth.upgradeError');
      toast.error(message);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div
      className={`
        dark:border-dark-accent/20 dark:bg-dark-accent/5
        flex flex-col gap-3 rounded-lg border border-accent/20 bg-accent/5
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="dark:text-dark-accent mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
        <div className="flex-1 space-y-1">
          <h3 className="dark:text-dark-foreground text-sm font-semibold text-foreground">
            {t('auth.readOnly.title')}
          </h3>
          <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
            {t('auth.readOnly.description')}
          </p>

          {showConnectButton && (
            <div className="pt-2">
              <Button
                size="sm"
                onClick={handleUpgrade}
                disabled={isConnecting || isUpgrading}
                className="flex items-center gap-2"
              >
                {isUpgrading || isConnecting
                  ? t('auth.readOnly.upgrading')
                  : t('auth.readOnly.upgradeButton')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
