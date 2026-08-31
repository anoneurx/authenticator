import { useEffect, useRef, useCallback } from "react";
import type { AutoLockDelay } from "@/lib/vault-types";

const DELAY_MS: Record<AutoLockDelay, number> = {
  immediate: 0,
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  never: -1,
};

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
];

export function useAutoLock(autoLock: AutoLockDelay, locked: boolean, lock: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    const ms = DELAY_MS[autoLock];
    if (ms <= 0) {
      // "immediate" mode: lock right away
      if (autoLock === "immediate") {
        lock();
      }
      return;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      lock();
    }, ms);
  }, [autoLock, lock, clearTimer]);

  // Reset timer on user activity (only when unlocked and timer-based)
  useEffect(() => {
    if (locked || autoLock === "immediate" || autoLock === "never") return;

    const onActivity = () => {
      if (!locked) startTimer();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
  }, [locked, autoLock, startTimer]);

  // Start/reset timer when dependency changes
  useEffect(() => {
    if (locked || autoLock === "immediate" || autoLock === "never") {
      clearTimer();
      return;
    }
    startTimer();
    return clearTimer;
  }, [autoLock, locked, startTimer, clearTimer]);

  // Lock on visibility change (tab hidden / app backgrounded)
  useEffect(() => {
    if (locked || autoLock === "never") return;

    const onVisibility = () => {
      if (document.hidden) {
        const ms = DELAY_MS[autoLock];
        if (ms <= 0) {
          // Immediate or immediate mode
          clearTimer();
          lock();
        } else {
          // Timer-based: start a short timer (min of configured delay, 10s cap for background)
          clearTimer();
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            lock();
          }, Math.min(ms, 10_000));
        }
      } else if (autoLock !== "immediate") {
        // App foreground again — restart the normal idle timer
        startTimer();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [locked, autoLock, lock, clearTimer, startTimer]);

  // Lock on window blur (for "immediate" mode)
  useEffect(() => {
    if (locked || autoLock !== "immediate") return;

    const onBlur = () => lock();
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [locked, autoLock, lock]);
}
