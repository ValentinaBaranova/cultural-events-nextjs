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
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 1000,
        maxWidth: 720,
        margin: "0 auto",
        background: "#ffffff",
        color: "#333",
        border: "1px solid #ddd",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        padding: 16,
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 14,
      }}
    >
      <p style={{ margin: 0, lineHeight: 1.4 }}>
        Usamos cookies analíticas (Google Analytics) para entender el uso del sitio. Puedes aceptar o rechazar estas cookies.
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => {
            setStoredConsent("denied");
            setDecision("denied");
          }}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none transition-colors border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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
