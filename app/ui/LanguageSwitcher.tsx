'use client';

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="inline-flex items-center rounded-full border border-border p-0.5 bg-card">
      <button
        type="button"
        onClick={() => setLocale('es')}
        className={`px-2 py-1 text-xs rounded-full transition ${locale === 'es' ? 'bg-accent text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        aria-pressed={locale === 'es'}
        aria-label={t('lang.spanish')}
        title={t('lang.spanish')}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-xs rounded-full transition ${locale === 'en' ? 'bg-accent text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        aria-pressed={locale === 'en'}
        aria-label={t('lang.english')}
        title={t('lang.english')}
      >
        EN
      </button>
    </div>
  );
}
