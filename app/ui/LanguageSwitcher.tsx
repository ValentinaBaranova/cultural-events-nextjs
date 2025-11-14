'use client';

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setLocale('es')}
        className={`px-1.5 py-0.5 text-xs rounded-md border ${locale === 'es' ? 'bg-gray-200 border-gray-300 font-semibold' : 'hover:bg-gray-100 border-transparent'}`}
        aria-pressed={locale === 'es'}
        aria-label={t('lang.spanish')}
        title={t('lang.spanish')}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-1.5 py-0.5 text-xs rounded-md border ${locale === 'en' ? 'bg-gray-200 border-gray-300 font-semibold' : 'hover:bg-gray-100 border-transparent'}`}
        aria-pressed={locale === 'en'}
        aria-label={t('lang.english')}
        title={t('lang.english')}
      >
        EN
      </button>
    </div>
  );
}
