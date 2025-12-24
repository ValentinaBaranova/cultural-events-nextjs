"use client";

import React from "react";
import Search from "@/ui/search";
import { useI18n } from "@/i18n/I18nProvider";
import Image from "next/image";

export default function HeroSearch() {
  const { t } = useI18n();
  return (
    <section className="py-10 sm:py-12">
      <div className="text-center space-y-3">
        <h1 className="text-hero font-normal tracking-tight">
          {t("hero.title", "Descubre Eventos en Buenos Aires")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t(
            "hero.subtitle",
            "Los mejores conciertos, exposiciones y experiencias culturales de la ciudad"
          )}
        </p>
      </div>
      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-3xl">
        <Search />
      </div>

      {/* Hero banner image below the search bar */}
      <div className="mt-6 sm:mt-8 mx-auto w-full">
        <div className="w-full overflow-hidden border border-border shadow">
          <Image
            src="/images/hero/buenos-aires.jpg"
            alt={t("hero.bannerAlt", "Vista panorámica de Buenos Aires")}
            width={1600}
            height={500}
            className="h-16 sm:h-56 md:h-64 lg:h-72 w-full object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
