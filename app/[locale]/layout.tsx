import React, { ReactNode } from 'react';

// Minimal placeholder layout for potential locale-based routing.
// Currently, i18n is handled via a lightweight context provider at app/i18n.
// This layout simply renders children and does not alter routing.
export default function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
