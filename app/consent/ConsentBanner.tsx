"use client";

import React from "react";

// Minimal consent banner that controls whether analytics are allowed.
// Stores decision in localStorage under key 'cookie_consent_analytics'.
// Values: 'granted' | 'denied'. Default: no key => banner shown and analytics blocked.
const CONSENT_KEY = "cookie_consent_analytics";

type ConsentValue = "granted" | "denied";

function getStoredConsent(): ConsentValue | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {}
  return undefined;
}

function setStoredConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
    // Notify listeners (e.g., GATracker) that consent changed
    window.dispatchEvent(new CustomEvent("consent-changed", { detail: { value } }));
  } catch {}
}

export default function ConsentBanner() {
  const [decision, setDecision] = React.useState<ConsentValue | undefined>(undefined);

  React.useEffect(() => {
    setDecision(getStoredConsent());
  }, []);

  if (decision !== undefined) return null; // Already decided

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-[1000] max-w-[720px] mx-auto bg-card text-foreground border border-border rounded-[8px] shadow-lg p-4 flex gap-3 items-center justify-between text-sm"
    >
      <p className="m-0 leading-[1.4]">
        Usamos cookies analíticas (Google Analytics) para entender el uso del sitio. Puedes aceptar o rechazar estas cookies.
      </p>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => {
            setStoredConsent("denied");
            setDecision("denied");
          }}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none transition-colors border border-border bg-card text-foreground hover:bg-primary"
        >
          Rechazar
        </button>
        <button
          onClick={() => {
            setStoredConsent("granted");
            setDecision("granted");
          }}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none transition-colors btn-entradas-theme"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === "granted";
}
