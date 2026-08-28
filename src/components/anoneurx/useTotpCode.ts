import { useEffect, useState } from "react";
import { generateCodeAsync } from "@/lib/totp";

/**
 * Computes the real RFC-6238 TOTP code for an account using WebCrypto.
 * Recomputes only when the time-step (counter) changes, not every tick.
 */
export function useTotpCode(
  secret: string | undefined,
  digits: number,
  period: number,
  algorithm: string,
  now: number,
): string {
  const [code, setCode] = useState("");
  const counter = Math.floor(now / 1000 / period);

  useEffect(() => {
    if (!secret) return;
    let cancelled = false;
    generateCodeAsync(secret, {
      digits,
      period,
      algorithm,
      at: counter * period * 1000,
    })
      .then((c) => {
        if (!cancelled) setCode(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [secret, digits, period, algorithm, counter]);

  return code;
}
