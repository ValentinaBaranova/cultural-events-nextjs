"use client";
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import en from "./messages/en";
import es from "./messages/es";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/es";
import updateLocale from "dayjs/plugin/updateLocale";
import { usePathname, useRouter } from "next/navigation";

// Ensure we can adjust week start per locale (used by antd DatePicker rendering)
dayjs.extend(updateLocale);
// For English, start the week on Monday (0=Sunday, 1=Monday)
// This affects calendar UI like antd DatePicker but does not change day numbers (0..6)
// Spanish (es) already starts on Monday by default in dayjs
if (typeof window !== 'undefined') {
  try {
    dayjs.updateLocale('en', { weekStart: 1 });
  } catch {
    // no-op: in case updateLocale fails in SSR or older dayjs versions
  }
} else {
  // SSR path
  try {
    dayjs.updateLocale('en', { weekStart: 1 });
  } catch {}
}

export type Locale = "en" | "es";

type Messages = Record<string, string>;

type I18nContextType = {
  locale: Locale;
  messages: Messages;
  t: (key: string, fallback?: string) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const ALL_MESSAGES: Record<Locale, Messages> = { en, es };

const STORAGE_KEY = "app_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // IMPORTANT: To avoid hydration mismatch, the initial render must match SSR output.
  // Therefore, we default to 'es' on the very first render (both server and client),
  // and only then, after mount, we read localStorage and update the locale if needed.
  const [locale, setLocaleState] = useState<Locale>('es');

  const router = useRouter();
  const pathname = usePathname();

  // On mount, read initial locale from URL (?lang=xx) or localStorage without mutating URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang');
    if (paramLang === 'en' || paramLang === 'es') {
      setLocaleState(paramLang);
      try { localStorage.setItem(STORAGE_KEY, paramLang); } catch {}
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === 'en' || saved === 'es') {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    // Sync dayjs locale with app locale so antd DatePicker uses correct month/day names
    dayjs.locale(locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    }
  }, []);

  // Keep URL in sync with current locale on route changes or after hydration.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const current = params.get('lang');
    if (current === locale) return;
    params.set('lang', locale);
    const query = params.toString();
    const newUrl = query ? `${pathname}?${query}` : pathname;
    try {
      router.replace(newUrl, { scroll: false });
    } catch {
      try { window.history.replaceState(null, '', newUrl); } catch {}
    }
  }, [locale, pathname, router]);

  const messages = useMemo(() => ALL_MESSAGES[locale], [locale]);

  const t = useCallback((key: string, fallback?: string) => {
    return messages[key] ?? fallback ?? key;
  }, [messages]);

  const value = useMemo(() => ({ locale, messages, t, setLocale }), [locale, messages, t, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
