"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Mail } from "lucide-react";

interface EmailSignInFormProps {
  callbackUrl?: string;
  disabled?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailSignInForm({ callbackUrl = "/", disabled = false }: EmailSignInFormProps) {
  const t = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmed)) {
      toast.error(t("login.email.invalid"));
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await signIn("email", {
        email: trimmed,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Show success message with email instructions
      toast.success(t("login.email.success"), {
        autoClose: 5000,
      });
      setEmail("");

      // Optionally collapse the form after successful submission
      setTimeout(() => {
        setIsExpanded(false);
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("login.email.error");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Button to expand email form */}
      {!isExpanded && (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleToggle}
          disabled={disabled}
          className="flex items-center justify-center gap-2"
        >
          <Mail className="h-5 w-5" />
          {t("login.email.title")}
        </Button>
      )}

      {/* Expandable email form with animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-dashed border-outline/60 bg-surface/60 p-4 dark:border-dark-outline/60 dark:bg-dark-surface/60 sm:rounded-3xl sm:p-6"
        >
          <div className="space-y-2 text-left">
            <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground sm:text-base">
              {t("login.email.title")}
            </h3>
            <p className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted sm:text-sm">
              {t("login.email.description")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email-login-input"
              className="text-xs uppercase tracking-[0.3em] text-foregroundMuted dark:text-dark-foregroundMuted"
            >
              {t("login.email.label")}
            </label>
            <input
              id="email-login-input"
              type="email"
              autoComplete="email"
              placeholder={t("login.email.placeholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={disabled || isSubmitting}
              className="w-full rounded-full border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              size="lg"
              className="flex flex-1 items-center justify-center gap-2"
              disabled={disabled || isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              {isSubmitting ? t("login.email.loading") : t("login.email.button")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleToggle}
              disabled={disabled || isSubmitting}
              className="px-4"
            >
              ✕
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
