import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge, RequestStatus } from "./request-status-badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface RequestCardProps {
  id: string;
  type: "exchange" | "internal";
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  details: {
    title: string;
    subtitle: string;
    amount?: string;
  };
  onDetailsClick: () => void;
  className?: string;
}

export function RequestCard({
  id,
  type,
  status,
  createdAt,
  updatedAt,
  details,
  onDetailsClick,
  className,
}: RequestCardProps) {
  const t = useTranslation();
  const formattedDate = new Date(createdAt).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-4">
        {/* Mobile: Stack vertically */}
        <div className="flex flex-col gap-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="dark:text-dark-foreground break-all font-mono text-xs font-semibold text-foreground">
              {id}
            </span>
            <span className="dark:bg-dark-surfaceAlt shrink-0 rounded-full bg-surfaceAlt px-2 py-0.5 text-xs">
              {type === "exchange" ? t("profile.requestCard.exchange") : t("profile.requestCard.internal")}
            </span>
            <RequestStatusBadge status={status} />
          </div>

          <h3 className="dark:text-dark-foreground text-base font-semibold text-foreground">
            {details.title}
          </h3>

          <p className="dark:text-dark-foregroundMuted break-words text-sm text-foregroundMuted">
            {details.subtitle}
          </p>

          {details.amount && (
            <p className="dark:text-dark-foreground text-lg font-medium text-foreground">
              {details.amount}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
              📅 {formattedDate}
            </span>
            <Button onClick={onDetailsClick} variant="outline" size="sm" className="shrink-0">
              {t("profile.requestDetails.viewDetails")}
            </Button>
          </div>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden items-start justify-between gap-4 md:flex">
          {/* Left side - Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="dark:text-dark-foreground font-mono text-sm font-semibold text-foreground">
                {id}
              </span>
              <span className="dark:bg-dark-surfaceAlt rounded-full bg-surfaceAlt px-2 py-0.5 text-xs">
                {type === "exchange" ? t("profile.requestCard.exchange") : t("profile.requestCard.internal")}
              </span>
            </div>

            <h3 className="dark:text-dark-foreground text-base font-semibold text-foreground">
              {details.title}
            </h3>

            <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              {details.subtitle}
            </p>

            {details.amount && (
              <p className="dark:text-dark-foreground text-lg font-medium text-foreground">
                {details.amount}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-foregroundMuted">
              <span>📅 {formattedDate}</span>
            </div>
          </div>

          {/* Right side - Status and Action */}
          <div className="flex flex-col items-end gap-3">
            <RequestStatusBadge status={status} />
            <Button onClick={onDetailsClick} variant="outline" size="sm">
              {t("profile.requestDetails.viewDetails")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
