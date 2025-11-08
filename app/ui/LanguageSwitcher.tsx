'use client';

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLocale('es')}
        className={`px-2 py-1 rounded ${locale === 'es' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
        aria-pressed={locale === 'es'}
      >
        {t('lang.spanish')}
      </button>
      <span className="text-gray-400">|</span>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 rounded ${locale === 'en' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
        aria-pressed={locale === 'en'}
      >
        {t('lang.english')}
      </button>
    </div>
  );
}
