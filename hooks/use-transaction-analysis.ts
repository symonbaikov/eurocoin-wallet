"use client";

import { useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { formatUnits, parseUnits } from "viem";

export interface TransactionAnalysisResult {
  isSuspicious: boolean;
  suspiciousReasons: string[];
  transactionDetails: {
    from: string;
    to: string;
    value: string;
    gasUsed: string;
    status: "success" | "failed";
  };
  recommendations: string[];
}

interface UseTransactionAnalysisResult {
  analyzeTransaction: (txHash: `0x${string}`) => Promise<TransactionAnalysisResult | null>;
  loading: boolean;
  error: Error | null;
}

// Constants for suspicious patterns
const SUSPICIOUS_GAS_PRICE_THRESHOLD = parseUnits("100", "gwei");
const HIGH_VALUE_THRESHOLD = parseUnits("10", "ether");

export function useTransactionAnalysis(): UseTransactionAnalysisResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  const analyzeTransaction = useCallback(
    async (txHash: `0x${string}`): Promise<TransactionAnalysisResult | null> => {
      if (!publicClient) {
        setError(new Error("Public client not available"));
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch transaction receipt
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

        // Fetch transaction details
        const tx = await publicClient.getTransaction({ hash: txHash });

        const suspiciousReasons: string[] = [];
        const recommendations: string[] = [];

        // Check 1: High gas price (may indicate rush/urgency)
        if (tx.gasPrice && tx.gasPrice > SUSPICIOUS_GAS_PRICE_THRESHOLD) {
          suspiciousReasons.push("Unusually high gas price detected");
          recommendations.push(
            "Высокая комиссия может указывать на поспешность транзакции. Проверьте, не были ли вы под давлением при её отправке.",
          );
        }

        // Check 2: Very large value transfer
        if (tx.value && tx.value > HIGH_VALUE_THRESHOLD) {
          suspiciousReasons.push("Large value transfer detected");
          recommendations.push(
            "Обнаружена крупная сумма в транзакции. Убедитесь, что получатель - проверенный адрес.",
          );
        }

        // Check 3: Failed transaction
        if (receipt.status === "reverted") {
          suspiciousReasons.push("Transaction failed");
          recommendations.push(
            "Транзакция была отклонена. Возможно, адрес получателя некорректен или это мошенническая схема.",
          );
        }

        // Check 4: Transaction to contract
        const code = await publicClient.getBytecode({ address: receipt.to });
        if (code && code !== "0x") {
          suspiciousReasons.push("Transaction to smart contract");
          recommendations.push(
            "Транзакция направлена в смарт-контракт. Убедитесь, что вы понимаете, что делает этот контракт.",
          );
        }

        const result: TransactionAnalysisResult = {
          isSuspicious: suspiciousReasons.length > 0,
          suspiciousReasons,
          transactionDetails: {
            from: tx.from,
            to: receipt.to,
            value: formatUnits(tx.value, 18),
            gasUsed: receipt.gasUsed.toString(),
            status: receipt.status === "success" ? "success" : "failed",
          },
          recommendations,
        };

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to analyze transaction");
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicClient],
  );

  return {
    analyzeTransaction,
    loading,
    error,
  };
}
