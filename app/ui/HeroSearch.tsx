"use client";

import React from "react";
import Search from "@/ui/search";
import { useI18n } from "@/i18n/I18nProvider";

export default function HeroSearch() {
  const { t } = useI18n();
  return (
    <section className="py-10 sm:py-12">
      <div className="text-center space-y-3">
        <h1 className="text-hero font-normal tracking-tight">
          {t("hero.title", "Descubre Eventos en Buenos Aires")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("hero.subtitle", "Los mejores conciertos, exposiciones y experiencias culturales de la ciudad")}
        </p>
      </div>
      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-3xl">
        <Search />
      </div>
    </section>
  );
}
