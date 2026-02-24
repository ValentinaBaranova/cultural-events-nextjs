"use client";

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { CONTACT_EMAIL } from '@/lib/config';

export default function ContactPage() {
  const { t } = useI18n();

  const googleFormSrc =
    'https://docs.google.com/forms/d/1FUtgEoBkMFppuvtAxAFiv0JPh6YzDquDbgnKBVKZyCQ/viewform?embedded=true';

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4 bg-card shadow-sm border border-border rounded-lg">
      <h1 className="text-2xl font-semibold">{t('contact.title', 'Contacto')}</h1>
      <p>{t('contact.q', '¿Tenés una pregunta, una sugerencia o querés proponer un evento o un espacio cultural?')}</p>
      <p>
        {t('contact.fillOrEmailPrefix', 'Completa el formulario o ')}
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-link">
          {t('contact.sendEmail', 'envíanos un email')}
        </a>
      </p>
      <p>{t('contact.alpha1', 'Estamos en una versión alpha.')}</p>
      <p>{t('contact.alpha2', 'La información puede estar incompleta o contener errores.')}</p>

      {/* Embedded Google Form */}
      <div className="pt-2">
        <iframe
          title="Contact form"
          src={googleFormSrc}
          width="100%"
          height="2000"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          loading="lazy"
        >
          Loading…
        </iframe>
      </div>
    </main>
  );
}
