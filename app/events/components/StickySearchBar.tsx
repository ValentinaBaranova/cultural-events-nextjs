"use client";

import React from "react";
import Search from "@/ui/search";

/**
 * Mobile-only sticky search bar that appears when:
 * - The user scrolls past the hero section, OR
 * - The hero search input gains focus.
 *
 * It reuses the same URL param (query) via the shared <Search/> component.
 */
export default function StickySearchBar({ heroRef }: { heroRef: React.RefObject<HTMLDivElement | null> }) {
  const [visible, setVisible] = React.useState(false);
  // Track if sticky is active due to user interaction (promotion from hero)
  const [active, setActive] = React.useState(false);

  // Helper: is mobile viewport (Tailwind sm breakpoint ~640px)
  const isMobile = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 639px)").matches;

  // Determine whether we've scrolled past hero
  const pastHero = React.useCallback(() => {
    if (!isMobile()) return false;
    const el = heroRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const heroBottom = rect.bottom + window.scrollY; // absolute bottom
    return window.scrollY >= heroBottom - 1; // tolerate 1px
  }, [heroRef]);

  // Scroll listener
  React.useEffect(() => {
    const onScroll = () => {
      if (!isMobile()) {
        setVisible(false);
        setActive(false);
        return;
      }
      const shouldShow = pastHero();
      // Show when past hero, or if user actively promoted sticky while hero is still visible
      setVisible(shouldShow || active);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pastHero, active]);

  // Focus handling: when the hero input focuses, reveal sticky and transfer focus/value
  React.useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (!isMobile()) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Default hero search input id is "search"
      if (target.id === "search") {
        setVisible(true);
        setActive(true);
        // Delay to allow sticky to mount/paint, then move focus and copy value
        setTimeout(() => {
          const sticky = document.getElementById("mobile-sticky-search") as HTMLInputElement | null;
          if (sticky) {
            // Copy current value from hero input if possible
            const hero = document.getElementById("search") as HTMLInputElement | null;
            if (hero && sticky.value !== hero.value) {
              sticky.value = hero.value;
              // Dispatch input event so React onChange listeners run if needed
              sticky.dispatchEvent(new Event('input', { bubbles: true }));
            }
            sticky.focus();
            // Put caret at end
            const val = sticky.value;
            sticky.value = "";
            sticky.value = val;
          }
        }, 0);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isMobile()) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // If focus leaves our sticky input and we are above hero, hide it
      if (target.id === "mobile-sticky-search") {
        // Defer to allow click on suggestions/buttons
        setTimeout(() => {
          if (!pastHero()) {
            setVisible(false);
            setActive(false);
          }
        }, 150);
      }
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [pastHero]);

  // Hide if leaving mobile viewport
  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const handler = () => {
      if (!mql.matches) {
        setVisible(false);
        setActive(false);
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Hide immediately when a search navigation is triggered (submit or suggestion click)
  React.useEffect(() => {
    const hideOnNavigate = () => {
      setVisible(false);
      setActive(false);
    };
    window.addEventListener('app:search-navigate', hideOnNavigate as EventListener);
    return () => window.removeEventListener('app:search-navigate', hideOnNavigate as EventListener);
  }, []);

  // Emit a signal for consumers (Search) whenever sticky becomes hidden
  React.useEffect(() => {
    if (!visible) {
      try {
        window.dispatchEvent(new CustomEvent('app:sticky-hide'));
      } catch {}
    }
  }, [visible]);

  // Basic styles: fixed at top with safe-area, high z-index, shadow; only on mobile
  return (
    <div
      aria-hidden={!visible}
      className={`sm:hidden fixed left-0 right-0 top-[env(safe-area-inset-top)] z-50 transition-transform duration-200 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)", pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="bg-card border-b border-border shadow-md px-3 py-2">
        <Search inputId="mobile-sticky-search" />
      </div>
    </div>
  );
}
