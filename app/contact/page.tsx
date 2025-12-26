"use client";

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { CONTACT_EMAIL } from '@/lib/config';

export default function ContactPage() {
  const { t } = useI18n();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4 bg-white shadow">
      <h1 className="text-2xl font-semibold">{t('contact.title', 'Contacto')}</h1>
      <p>{t('contact.q', '¿Tenés una pregunta, una sugerencia o querés proponer un evento o un espacio cultural?')}</p>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">
          {t('contact.writeLink', 'Escribinos')}
        </a>{' '}
        {t('contact.writeSuffix', 'para esta versión de prueba.')}
      </p>
      <p>{t('contact.alpha1', 'Estamos en una versión alpha.')}</p>
      <p>{t('contact.alpha2', 'La información puede estar incompleta o contener errores.')}</p>
    </main>
  );
}
