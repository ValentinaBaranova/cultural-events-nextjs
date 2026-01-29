"use client";

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import Link from 'next/link';

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4 bg-white shadow">
      <h1 className="text-2xl font-semibold">{t('about.title', 'Qué es')}</h1>
      <p>{t('about.p1')}</p>
      <p>{t('about.p2')}</p>
      <p>{t('about.p3')}</p>
      <p>{t('about.p4')}</p>
      <p>{t('about.p5')}</p>
      <p>
        {t('about.p6.prefix')}
        <Link href="/contact" className="inline-link">{t('about.here')}</Link>
        {t('about.p6.suffix')}
      </p>
    </main>
  );
}
