"use client";

import React from "react";
import Search from "@/ui/search";
import { useI18n } from "@/i18n/I18nProvider";
import Image from "next/image";

export default function HeroSearch() {
  const { t } = useI18n();
  const rawTitle = t("hero.title", "Descubre Eventos en Buenos Aires");
  const heroTitle = rawTitle.replace(/Buenos Aires/g, "Buenos\u00A0Aires");
  return (
    <section
      className="relative pt-8 pb-4 sm:pt-6 sm:pb-3 bg-[url('/images/hero/buenos-aires.jpg')] bg-cover bg-center sm:bg-none"
    >
      {/* Mobile overlay for readability */}
      <div className="absolute inset-0 bg-black/50 sm:hidden" aria-hidden />

      <div className="relative z-10 text-center space-y-2 sm:space-y-3 text-white sm:text-foreground px-4 sm:px-0">
        <h1 className="text-hero pt-3 font-normal tracking-[-0.01em]">
          {heroTitle}
        </h1>
        {/* Desktop/tablet subtitle */}
        <p className="hidden sm:block text-lg md:text-xl text-muted-foreground">
          {t(
            "hero.subtitle",
            "Conciertos, exposiciones y experiencias culturales de la ciudad"
          )}
        </p>
      </div>
      {/* Hero banner image above the search bar on desktop, hidden on mobile */}
      <div className="hidden sm:block mt-4 sm:mt-6 mx-auto w-full">
        <div className="w-full overflow-hidden border border-border shadow">
          <Image
            src="/images/hero/buenos-aires.jpg"
            alt={t("hero.bannerAlt", "Vista panorámica de Buenos Aires")}
            width={1600}
            height={500}
            className="h-12 sm:h-44 md:h-48 lg:h-48 w-full object-cover"
            style={{ objectPosition: "center 46%" }}
            priority
          />
        </div>
      </div>

      <div className="relative z-10 pb-5 sm:mt-5 w-full px-4 sm:px-0">
        <Search />
      </div>
    </section>
  );
}
