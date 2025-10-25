import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-backgroundAlt to-background dark:from-dark-backgroundAlt dark:to-dark-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex-1 space-y-6">
          <span className="pill bg-surface text-foreground dark:bg-dark-surface dark:text-dark-foreground">Login</span>
          <h1 className="display-title text-4xl text-accent md:text-5xl">Вход в MetaWallet</h1>
          <p className="max-w-xl text-base text-foregroundMuted dark:text-dark-foregroundMuted md:text-lg">
            Авторизация доступна через корпоративный SSO либо подключение MetaMask. В демо-версии вход
            выполняется по кнопке ниже и открывает интерфейсы без проверки прав.
          </p>
          <div className="flex flex-col gap-4 rounded-3xl border border-outline bg-surface p-6 shadow-card dark:border-dark-outline dark:bg-dark-surface">
            <Button size="lg" fullWidth>
              Подключить MetaMask
            </Button>
            <Button variant="outline" fullWidth disabled>
              Войти через корпоративный Email
            </Button>
            <p className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
              При входе вы соглашаетесь с внутренней политикой доступа и NDA. Все операции логируются.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
            <Link href="/requests" className="underline hover:text-accent">
              Заявки на вывод
            </Link>
            <Link href="/admin" className="underline hover:text-accent">
              Панель админа
            </Link>
            <Link href="/exchange" className="underline hover:text-accent">
              Telegram-обменник
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-[48px] border border-outline bg-surface shadow-2xl dark:border-dark-outline dark:bg-dark-surface">
            <div className="flex h-full w-full items-center justify-center p-8">
              <Image
                src="/metamask.png"
                alt="MetaMask Logo"
                width={200}
                height={200}
                className="object-contain"
                priority
              />
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-surfaceAlt/80 p-4 text-sm text-foreground dark:bg-dark-surfaceAlt/80 dark:text-dark-foreground">
              <p className="font-semibold">Demo access</p>
              <p className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">MetaWallet build 0.4 · internal preview</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
