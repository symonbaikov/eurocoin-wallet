'use client';

/**
 * OAuth Buttons Component
 * Displays OAuth provider buttons (Google, GitHub)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import toast from 'react-hot-toast';

// Lucide icons
import { Chrome, Github } from 'lucide-react';

interface OAuthButtonsProps {
  /** Callback URL after successful sign in */
  callbackUrl?: string;
  /** Disable all buttons */
  disabled?: boolean;
}

export function OAuthButtons({ callbackUrl = '/', disabled = false }: OAuthButtonsProps) {
  const t = useTranslation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      // Redirect to NextAuth Google OAuth endpoint
      window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    } catch (error) {
      console.error('[OAuth] Google sign-in error:', error);

      const message =
        error instanceof Error ? error.message : t('login.oauth.googleError');

      toast.error(message);
      setIsGoogleLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      setIsGitHubLoading(true);

      // Redirect to NextAuth GitHub OAuth endpoint
      window.location.href = `/api/auth/signin/github?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    } catch (error) {
      console.error('[OAuth] GitHub sign-in error:', error);

      const message =
        error instanceof Error ? error.message : t('login.oauth.githubError');

      toast.error(message);
      setIsGitHubLoading(false);
    }
  };

  const isAnyLoading = isGoogleLoading || isGitHubLoading;

  return (
    <div className="flex flex-col gap-3">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleGoogleSignIn}
        disabled={disabled || isAnyLoading}
        className="flex items-center justify-center gap-2"
      >
        {isGoogleLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Chrome className="h-5 w-5" />
        )}
        {isGoogleLoading ? t('login.oauth.googleLoading') : t('login.oauth.google')}
      </Button>

      {/* GitHub OAuth Button */}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleGitHubSignIn}
        disabled={disabled || isAnyLoading}
        className="flex items-center justify-center gap-2"
      >
        {isGitHubLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Github className="h-5 w-5" />
        )}
        {isGitHubLoading ? t('login.oauth.githubLoading') : t('login.oauth.github')}
      </Button>
    </div>
  );
}
