// Lightweight analytics tracker (simulated)
export function trackEvent(event: string, payload?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(`[analytics] ${event}`, payload ?? {});
  // gtag fallback if present
  const w = typeof window !== "undefined" ? (window as unknown as { gtag?: (...args: unknown[]) => void }) : undefined;
  if (w?.gtag) {
    w.gtag("event", event, payload ?? {});
  }
}
