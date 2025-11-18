"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useTranslation } from "@/hooks/use-translation";

export function ConnectButton() {
  const { isConnected, isConnecting, connect, canConnect, connectorName, connectError } =
    useWalletConnection();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    setIsMounted(true);
    // This is a standard pattern to prevent hydration mismatch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isConnected) {
    return null;
  }

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex flex-col gap-3">
        <Button fullWidth disabled>
          {t("wallet.connect")}
        </Button>
      </div>
    );
  }

  const handleConnect = async () => {
    try {
      setLocalError(null);
      await connect();
      toast.success("Кошелёк успешно подключён!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось подключить кошелёк.";
      setLocalError(message);
      toast.error(message);
    }
  };

  const errorMessage = localError ?? connectError?.message ?? null;

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleConnect} disabled={!canConnect || isConnecting} fullWidth>
        {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
      </Button>
      <div className="dark:text-dark-foregroundMuted flex flex-col gap-2 text-sm text-foregroundMuted">
        <span>{t("wallet.connector", { connector: connectorName ?? "—" })}</span>
        {!canConnect ? <span className="text-accentAlt">{t("wallet.install")}</span> : null}
        {errorMessage ? <span className="text-accentAlt">{errorMessage}</span> : null}
      </div>
    </div>
  );
}
