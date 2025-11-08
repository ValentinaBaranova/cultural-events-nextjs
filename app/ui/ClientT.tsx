'use client';

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export default function ClientT({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}
