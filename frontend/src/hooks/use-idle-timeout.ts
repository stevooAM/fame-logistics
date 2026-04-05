"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseIdleTimeoutOptions {
  /** Total idle duration before logout (default: 30 minutes) */
  timeoutMs?: number;
  /** How far before timeout to show the warning (default: 2 minutes) */
  warningMs?: number;
  /** Called when the idle timeout fires — redirect to logout */
  onTimeout: () => void;
  /** Called when the warning threshold is reached */
  onWarning: () => void;
  /** Optional callback whenever activity is detected */
  onActivity?: () => void;
}

interface UseIdleTimeoutReturn {
  /** Manually reset both timers (e.g. after a "Stay logged in" click) */
  resetTimers: () => void;
  /** True when the warning threshold has been crossed and timeout hasn't fired yet */
  isWarning: boolean;
}

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

/**
 * Tracks user inactivity and fires warning/timeout callbacks.
 *
 * Flow:
 *  1. At (timeoutMs - warningMs) of inactivity → onWarning() fires, isWarning = true
 *  2. At timeoutMs of inactivity              → onTimeout() fires
 *  3. Any activity detected                  → timers reset, isWarning = false
 *
 * Activity events are throttled to once per 30 seconds to avoid excessive
 * re-scheduling while the user is actively working.
 */
export function useIdleTimeout({
  timeoutMs = 30 * 60 * 1000,
  warningMs = 2 * 60 * 1000,
  onTimeout,
  onWarning,
  onActivity,
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
  const [isWarning, setIsWarning] = useState(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Keep callback refs stable so the timers below do not need to be
  // recreated each render when the parent passes inline functions.
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current !== null) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (timeoutTimerRef.current !== null) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    setIsWarning(false);

    const warningDelay = timeoutMs - warningMs;

    warningTimerRef.current = setTimeout(() => {
      setIsWarning(true);
      onWarningRef.current();
    }, warningDelay);

    timeoutTimerRef.current = setTimeout(() => {
      setIsWarning(false);
      onTimeoutRef.current();
    }, timeoutMs);
  }, [clearTimers, timeoutMs, warningMs]);

  const resetTimers = useCallback(() => {
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    // Throttle: only reset timers if 30+ seconds have passed since last activity
    const THROTTLE_MS = 30_000;

    function handleActivity() {
      const now = Date.now();
      if (now - lastActivityRef.current < THROTTLE_MS) return;

      lastActivityRef.current = now;
      startTimers();
      onActivityRef.current?.();
    }

    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start timers immediately on mount
    startTimers();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
    // startTimers / clearTimers are stable (useCallback with no changing deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTimers, clearTimers]);

  return { resetTimers, isWarning };
}
