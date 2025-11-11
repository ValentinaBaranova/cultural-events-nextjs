"use client";
import React from "react";
import { ConfigProvider, theme } from "antd";
import enUS from "antd/locale/en_US";
import esES from "antd/locale/es_ES";
import { useI18n } from "@/i18n/I18nProvider";

export default function AntdLocaleProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  const antdLocale = locale === "es" ? esES : enUS;
  return (
    <ConfigProvider locale={antdLocale} theme={{ algorithm: theme.defaultAlgorithm }}>
      {children}
    </ConfigProvider>
  );
}
