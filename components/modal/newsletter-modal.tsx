"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface NewsletterModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewsletterModal({ open, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/newsletter/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Код отправлен на вашу почту!");
        setStep("verify");
      } else {
        toast.error(data.error || "Ошибка при отправке кода");
      }
    } catch (error) {
      console.error("Error sending code:", error);
      toast.error("Ошибка при отправке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast.error("Введите 6-значный код");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/newsletter/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Спасибо за подписку!");
        onClose();
        setEmail("");
        setCode("");
        setStep("email");
      } else {
        toast.error(data.error || "Неверный код");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error("Ошибка при проверке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setCode("");
    setStep("email");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Подписка на рассылку">
      <div className="space-y-6">
        {step === "email" ? (
          <>
            <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              Введите ваш email для подписки на новости и обновления EuroCoin
            </p>
            <div>
              <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground w-full rounded-lg border border-outline bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <Button onClick={handleSendCode} disabled={loading} className="w-full">
              {loading ? "Отправка..." : "Отправить код"}
            </Button>
          </>
        ) : (
          <>
            <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              Мы отправили код подтверждения на {email}
            </p>
            <div>
              <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
                Код подтверждения
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground w-full rounded-lg border border-outline bg-surface px-4 py-3 text-center text-2xl tracking-widest text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleVerifyCode} disabled={loading} className="flex-1">
                {loading ? "Проверка..." : "Подтвердить"}
              </Button>
              <Button onClick={() => setStep("email")} variant="outline" className="flex-1">
                Изменить email
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
