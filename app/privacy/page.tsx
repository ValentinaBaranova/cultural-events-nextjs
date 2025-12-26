"use client";

import React from "react";
import { useI18n } from "@/i18n/I18nProvider";

export default function PrivacyPage() {
  const { t } = useI18n();

  const email = t("contact.email", "vbaranova87@gmail.com");

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4 bg-white shadow">
      <h1 className="text-2xl font-semibold">{t("privacy.title")}</h1>
      <p>{t("privacy.p1")}</p>
      <p>{t("privacy.p2")}</p>
      <p>{t("privacy.p3")}</p>
      <p>{t("privacy.p4")}</p>
      <p>
        {t("privacy.p5.prefix")}
        <a
          href={`mailto:${email}`}
          className="text-blue-600 hover:underline"
        >
          {t("privacy.p5.link")}
        </a>.
        {t("privacy.p5.suffix")}
      </p>
      <p className="text-sm text-gray-500">{t("privacy.updated")}</p>
    </main>
  );
}
