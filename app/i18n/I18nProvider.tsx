"use client";
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import en from "./messages/en";
import es from "./messages/es";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/es";
import updateLocale from "dayjs/plugin/updateLocale";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();

  // After mount, load locale from URL (?lang=xx) or saved locale (if any) and apply it.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const paramLang = searchParams?.get('lang');
    if (paramLang === 'en' || paramLang === 'es') {
      if (paramLang !== locale) {
        setLocaleState(paramLang);
        try { localStorage.setItem(STORAGE_KEY, paramLang); } catch {}
      }
      return;
    }

    // Fallback to saved locale
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if ((saved === 'en' || saved === 'es') && saved !== locale) {
      setLocaleState(saved);
    }
  }, [locale, searchParams]);

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
      // Update URL query parameter (?lang=...); preserve other params and hash
      const params = new URLSearchParams(window.location.search);
      params.set('lang', l);
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      // Use replace so we don't clutter history when toggling language
      try {
        router.replace(newUrl, { scroll: false });
      } catch {
        // As a fallback, use history.replaceState
        try { window.history.replaceState(null, '', newUrl); } catch {}
      }
    }
  }, [pathname, router]);

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
