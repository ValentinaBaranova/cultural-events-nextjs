"use client";

import React from "react";
import Search from "@/ui/search";
import { useI18n } from "@/i18n/I18nProvider";
import Image from "next/image";
import { Piazzolla } from "next/font/google";

const piazzolla = Piazzolla({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

export default function HeroSearch() {
  const { t } = useI18n();
  const rawTitle = t("hero.title", "Descubre Eventos en Buenos Aires");
  const heroTitle = rawTitle.replace(/Buenos Aires/g, "Buenos\u00A0Aires");
  return (
    <section className="pt-3 pb-4 sm:pt-6 sm:pb-6">
      <div className="text-center space-y-3">
        <h1 className={`${piazzolla.className} text-hero font-normal tracking-[-0.01em]`}>
          {heroTitle}
        </h1>
        {/* Mobile-only subtitle (grammar fix, shorter) */}
        <p className="text-sm text-muted-foreground sm:hidden">
          {t("hero.subtitleMobile", "Las mejores experiencias culturales de la ciudad")}
        </p>
        {/* Desktop/tablet subtitle */}
        <p className="hidden sm:block text-base text-muted-foreground">
          {t(
            "hero.subtitle",
            "Los mejores conciertos, exposiciones y experiencias culturales de la ciudad"
          )}
        </p>
      </div>
      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-3xl">
        <Search />
      </div>

      {/* Hero banner image below the search bar (hidden on mobile) */}
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
    </section>
  );
}
