// Lightweight analytics tracker (simulated)
export function trackEvent(event: string, payload?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(`[analytics] ${event}`, payload ?? {});
  // gtag fallback if present
  const w = typeof window !== "undefined" ? (window as unknown as { gtag?: (...args: unknown[]) => void }) : undefined;
  if (w?.gtag) {
    if (event === 'click_testar_gratis') {
      w.gtag('event', 'conversion', {
        'send_to': 'AW-18271601198/M-B4CJ7ftMUcEK6EyohE',
        'value': 1.0,
        'currency': 'BRL'
      });
    }
    w.gtag("event", event, payload ?? {});
  }
}
