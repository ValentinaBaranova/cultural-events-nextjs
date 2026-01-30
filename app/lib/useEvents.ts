'use client';

import useSWRInfinite from 'swr/infinite';
import { API_URL } from '@/lib/config';
import { CulturalEvent } from '@/lib/definitions';
import { useEffect, useMemo } from 'react';

// Robust fetcher: throw on non-OK and network failures so UI can show a friendly message
const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`API error ${res.status}`) as Error & { status?: number; body?: string };
      err.status = res.status;
      err.body = text;
      throw err;
    }
    return await res.json();
  } catch (e) {
    // Network error or JSON parse
    throw e;
  }
};

const PAGE_SIZE = 10;

type EventsFacets = {
  type?: Record<string, number>;
  barrio?: Record<string, number>;
  venue?: Record<string, number>;
  tag?: Record<string, number>;
};

type EventsResponseDto = {
  items: CulturalEvent[];
  total: number;
  facets?: EventsFacets;
} | CulturalEvent[]; // Backward compatibility during rollout

export function useEvents(
    searchQuery = '',
    types?: string[] | null,
    onlyFree?: boolean,
    startDate?: string,
    endDate?: string,
    venues?: string[],
    barrios?: string[],
    tags?: string[],
) {
    // Build key per page
    const getKey = (pageIndex: number, previousPageData: EventsResponseDto | null) => {
        // Stop when previous page had no items
        if (previousPageData) {
            const prevItems = Array.isArray(previousPageData)
                ? previousPageData
                : (previousPageData?.items ?? []);
            if (prevItems.length === 0) return null;
        }
        const queryParam = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : '';
        const typesParam = types && types.length ? `&type=${encodeURIComponent(types.join(','))}` : '';
        const freeParam = onlyFree ? `&isFree=true` : '';
        const startDateParam = startDate ? `&startDate=${encodeURIComponent(startDate)}` : '';
        const endDateParam = endDate ? `&endDate=${encodeURIComponent(endDate)}` : '';
        const venuesParam = venues && venues.length ? `&venues=${encodeURIComponent(venues.join(','))}` : '';
        const barriosParam = barrios && barrios.length ? `&barrio=${encodeURIComponent(barrios.join(','))}` : '';
        const tagsParam = tags && tags.length ? `&tags=${encodeURIComponent(tags.join(','))}` : '';
        return `${API_URL}/events?page=${pageIndex + 1}&limit=${PAGE_SIZE}${queryParam}${typesParam}${freeParam}${startDateParam}${endDateParam}${venuesParam}${barriosParam}${tagsParam}`;
    };

    const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<EventsResponseDto>(getKey, fetcher);

    // Stable keys for array dependencies
    const venuesKey = useMemo(() => (venues && venues.length ? venues.join(',') : ''), [venues]);
    const barriosKey = useMemo(() => (barrios && barrios.length ? barrios.join(',') : ''), [barrios]);
    const typesKey = useMemo(() => (types && types.length ? types.join(',') : ''), [types]);
    const tagsKey = useMemo(() => (tags && tags.length ? tags.join(',') : ''), [tags]);

    // Reset pagination when filters change
    useEffect(() => {
        setSize(1);
    }, [searchQuery, typesKey, onlyFree, startDate, endDate, venuesKey, barriosKey, tagsKey, setSize]);

    // Flatten items across pages regardless of response shape
    const allEvents: CulturalEvent[] = data
        ? data.flatMap((page) => (Array.isArray(page) ? page : (page?.items ?? [])))
        : [];

    // No client-side date filtering; backend handles date filters now
    const events = allEvents;

    // Determine hasMore using last page items length and optional total
    const lastPage = data ? data[data.length - 1] : null;
    const lastItems = lastPage ? (Array.isArray(lastPage) ? lastPage : (lastPage.items ?? [])) : [];
    const hasMoreBySize = lastItems.length === PAGE_SIZE;
    // If total is present, prefer it for accuracy
    const total = !lastPage || Array.isArray(lastPage) ? undefined : lastPage.total;
    const fetchedCount = data ? data.reduce((acc, p) => acc + (Array.isArray(p) ? p.length : (p.items?.length ?? 0)), 0) : 0;
    const hasMore = typeof total === 'number' ? fetchedCount < total : hasMoreBySize;

    // Extract facets from the first page when available
    const firstPage = data && data.length > 0 ? data[0] : undefined;
    const facets: EventsFacets | undefined = firstPage && !Array.isArray(firstPage) ? firstPage.facets : undefined;

    return {
        events,
        isLoading: !data && !error,
        error,
        loadMore: () => {
            if (!isValidating && hasMore) {
                setSize(size + 1);
            }
        },
        refresh: () => mutate(),
        isFetchingMore: isValidating,
        hasMore,
        facets,
    };
}
