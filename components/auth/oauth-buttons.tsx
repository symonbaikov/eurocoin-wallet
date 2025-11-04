"use client";

/**
 * OAuth Buttons Component
 * Displays OAuth provider buttons (Google)
 */

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

// Lucide icons
import { Chrome } from "lucide-react";

interface OAuthButtonsProps {
  /** Callback URL after successful sign in */
  callbackUrl?: string;
  /** Disable all buttons */
  disabled?: boolean;
}

export function OAuthButtons({ callbackUrl = "/", disabled = false }: OAuthButtonsProps) {
  const t = useTranslation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(true);

  // Check if Google OAuth provider is available
  async function checkGoogleAvailability() {
    try {
      console.log("[OAuth] Checking Google provider availability...");
      const response = await fetch("/api/auth/providers");

      // Log response details
      console.log("[OAuth] Providers endpoint response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[OAuth] Providers endpoint returned error:", {
          status: response.status,
          statusText: response.statusText,
          body: text.substring(0, 500),
        });
        setIsGoogleAvailable(false);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        console.error("[OAuth] Providers endpoint returned non-JSON:", {
          contentType,
          body: text.substring(0, 500),
        });
        setIsGoogleAvailable(false);
        return;
      }

      const providers = await response.json();
      console.log("[OAuth] Available providers:", Object.keys(providers || {}));
      console.log("[OAuth] Google provider available:", !!providers?.google);

      setIsGoogleAvailable(!!providers?.google);
    } catch (error) {
      console.error("[OAuth] Failed to check providers availability:", {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      setIsGoogleAvailable(false);
    }
  }

  // Check if Google OAuth is available on mount
  useEffect(() => {
    checkGoogleAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      console.log("[OAuth] Starting Google sign-in with NextAuth signIn:", {
        callbackUrl,
        provider: "google",
      });

      // Use NextAuth signIn function directly (recommended approach)
      // signIn redirects automatically, so we don't need to handle the result
      await signIn("google", {
        callbackUrl: callbackUrl || "/",
        redirect: true, // Let NextAuth handle the redirect
      });

      // Note: If redirect is true, signIn will redirect and this code won't execute
      // If there's an error, it will be caught in the catch block below
    } catch (error) {
      console.error("[OAuth] Google sign-in error:", error);

      const message = error instanceof Error ? error.message : t("login.oauth.googleError");

      toast.error(message);
      setIsGoogleLoading(false);
    }
  };

  // Don't render Google button if provider is not available
  if (!isGoogleAvailable) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleGoogleSignIn}
        disabled={disabled || isGoogleLoading}
        className="flex items-center justify-center gap-2"
      >
        {isGoogleLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Chrome className="h-5 w-5" />
        )}
        {isGoogleLoading ? t("login.oauth.googleLoading") : t("login.oauth.google")}
      </Button>
    </div>
  );
}
