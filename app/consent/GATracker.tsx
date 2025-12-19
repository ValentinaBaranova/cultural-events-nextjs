"use client";

import React from "react";
import Script from "next/script";
import { hasAnalyticsConsent } from "./ConsentBanner";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GATracker() {
  const [enabled, setEnabled] = React.useState<boolean>(false);

  React.useEffect(() => {
    const apply = () => setEnabled(Boolean(GA_MEASUREMENT_ID) && hasAnalyticsConsent());
    apply();
    const handler = () => apply();
    window.addEventListener("consent-changed", handler as EventListener);
    return () => window.removeEventListener("consent-changed", handler as EventListener);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);} 
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
      `}</Script>
    </>
  );
}
