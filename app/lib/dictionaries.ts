'use client';

import { API_URL } from '@/lib/config';

export type DictOption = { label: string; value: string };

export type Dictionaries = {
  venues: DictOption[];
  barrios: DictOption[];
  tags: DictOption[];
  eventTypes: DictOption[];
  venueMap: Record<string, string>;
  barrioMap: Record<string, string>;
  tagMap: Record<string, string>;
  eventTypeMap: Record<string, string>;
};

const cache: Map<string, Promise<Dictionaries>> = new Map();

function toOptions<T extends { slug: string; name: string }>(arr: T[] | undefined | null): DictOption[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(i => ({ value: i.slug, label: i.name }));
}

function toMap(options: DictOption[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const o of options) m[o.value] = o.label;
  return m;
}

export function loadDictionaries(locale: string): Promise<Dictionaries> {
  if (cache.has(locale)) return cache.get(locale)!;

  const p = (async (): Promise<Dictionaries> => {
    try {
      const [venuesRes, barriosRes, tagsRes, eventTypesRes] = await Promise.all([
        fetch(`${API_URL}/places?locale=${encodeURIComponent(locale)}`),
        fetch(`${API_URL}/barrios?locale=${encodeURIComponent(locale)}`),
        fetch(`${API_URL}/tags?locale=${encodeURIComponent(locale)}`),
        fetch(`${API_URL}/event-types?locale=${encodeURIComponent(locale)}`),
      ]);

      const venuesJson = venuesRes.ok ? await venuesRes.json() : [];
      const barriosJson = barriosRes.ok ? await barriosRes.json() : [];
      const tagsJson = tagsRes.ok ? await tagsRes.json() : [];
      const eventTypesJson = eventTypesRes.ok ? await eventTypesRes.json() : [];

      const venues = toOptions(venuesJson);
      const barrios = toOptions(barriosJson);
      const tags = toOptions(tagsJson);
      const eventTypes = toOptions(eventTypesJson);

      const venueMap = toMap(venues);
      const barrioMap = toMap(barrios);
      const tagMap = toMap(tags);
      const eventTypeMap = toMap(eventTypes);

      return { venues, barrios, tags, eventTypes, venueMap, barrioMap, tagMap, eventTypeMap };
    } catch {
      // On any failure, return empty dictionaries to avoid blocking UI
      return { venues: [], barrios: [], tags: [], eventTypes: [], venueMap: {}, barrioMap: {}, tagMap: {}, eventTypeMap: {} };
    }
  })();

  cache.set(locale, p);
  return p;
}

export function clearDictionariesCacheForLocale(locale: string) {
  cache.delete(locale);
}
