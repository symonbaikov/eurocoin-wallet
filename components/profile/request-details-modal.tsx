"use client";

import { Modal } from "@/components/ui/modal";
import { RequestStatusBadge, RequestStatus } from "./request-status-badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface RequestDetailsModalProps {
  open: boolean;
  onClose: () => void;
  request: RequestData | null;
}

export interface RequestData {
  id: string;
  type: "exchange" | "internal";
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  details: {
    [key: string]: unknown;
  };
}

export function RequestDetailsModal({ open, onClose, request }: RequestDetailsModalProps) {
  const t = useTranslation();
  if (!request) return null;

  const formattedCreatedAt = new Date(request.createdAt).toLocaleString("ru-RU");
  const formattedUpdatedAt = new Date(request.updatedAt).toLocaleString("ru-RU");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t("profile.requestDetails.title")} ${request.id}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              {t("profile.requestDetails.requestType")}
            </p>
            <p className="dark:text-dark-foreground font-semibold text-foreground">
              {request.type === "exchange"
                ? t("profile.requestDetails.exchangeType")
                : t("profile.requestDetails.internalType")}
            </p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>

        {/* Details */}
        <div className="space-y-3">
          {Object.entries(request.details).map(([key, value]) => {
            if (!value || value === "") return null;
            return (
              <div key={key} className="rounded-lg border p-3">
                <p className="dark:text-dark-foregroundMuted mb-1 text-xs font-semibold uppercase tracking-wide text-foregroundMuted">
                  {key}
                </p>
                <p className="dark:text-dark-foreground break-all text-sm text-foreground">
                  {String(value)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="dark:border-dark-outline border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="dark:text-dark-foregroundMuted text-foregroundMuted">Создана:</p>
              <p className="dark:text-dark-foreground font-semibold text-foreground">
                {formattedCreatedAt}
              </p>
            </div>
            <div>
              <p className="dark:text-dark-foregroundMuted text-foregroundMuted">Обновлена:</p>
              <p className="dark:text-dark-foreground font-semibold text-foreground">
                {formattedUpdatedAt}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
