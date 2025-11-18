'use client';

/**
 * Sign Out Button Component
 * Handles signing out from OAuth providers
 */

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { LogOut } from 'lucide-react';
import { toast } from "react-toastify";

interface SignOutButtonProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Show icon */
  showIcon?: boolean;
  /** Callback URL after sign out */
  callbackUrl?: string;
}

export function SignOutButton({
  variant = 'ghost',
  size = 'md',
  fullWidth = false,
  showIcon = true,
  callbackUrl = '/login',
}: SignOutButtonProps) {
  const t = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);

      // Sign out from NextAuth
      await signOut({
        callbackUrl,
        redirect: true,
      });

      toast.success(t('auth.signOutSuccess'));
    } catch (error) {
      console.error('[Auth] Sign out error:', error);

      const message = error instanceof Error ? error.message : t('auth.signOutError');
      toast.error(message);

      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        showIcon && <LogOut className="h-4 w-4" />
      )}
      {isLoading ? t('auth.signingOut') : t('auth.signOut')}
    </Button>
  );
}
