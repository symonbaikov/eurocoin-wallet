'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

interface EmailSignInFormProps {
  callbackUrl?: string;
  disabled?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailSignInForm({ callbackUrl = '/', disabled = false }: EmailSignInFormProps) {
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmed)) {
      toast.error(t('login.email.invalid'));
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await signIn('email', {
        email: trimmed,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success(t('login.email.success'));
      setEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('login.email.error');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-outline/60 bg-surface/60 p-4 dark:border-dark-outline/60 dark:bg-dark-surface/60 sm:rounded-3xl sm:p-6"
    >
      <div className="space-y-2 text-left">
        <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground sm:text-base">
          {t('login.email.title')}
        </h3>
        <p className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted sm:text-sm">
          {t('login.email.description')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email-login-input"
          className="text-xs uppercase tracking-[0.3em] text-foregroundMuted dark:text-dark-foregroundMuted"
        >
          {t('login.email.label')}
        </label>
        <input
          id="email-login-input"
          type="email"
          autoComplete="email"
          placeholder={t('login.email.placeholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={disabled || isSubmitting}
          className="w-full rounded-full border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={disabled || isSubmitting}
        className="flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {isSubmitting ? t('login.email.loading') : t('login.email.button')}
      </Button>
    </form>
  );
}
