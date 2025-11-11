"use client";
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import en from "./messages/en";
import es from "./messages/es";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/es";
import updateLocale from "dayjs/plugin/updateLocale";

// Ensure we can adjust week start per locale (used by antd DatePicker rendering)
dayjs.extend(updateLocale);
// For English, start the week on Monday (0=Sunday, 1=Monday)
// This affects calendar UI like antd DatePicker but does not change day numbers (0..6)
// Spanish (es) already starts on Monday by default in dayjs
if (typeof window !== 'undefined') {
  try {
    dayjs.updateLocale('en', { weekStart: 1 });
  } catch (_) {
    // no-op: in case updateLocale fails in SSR or older dayjs versions
  }
} else {
  // SSR path
  try {
    dayjs.updateLocale('en', { weekStart: 1 });
  } catch (_) {}
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
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as Locale | null) : null;
    if (saved && (saved === 'en' || saved === 'es')) {
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
      localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

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
