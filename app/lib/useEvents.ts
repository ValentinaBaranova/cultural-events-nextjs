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
    // ✅ Keep track of whether there are more events
    const getKey = (pageIndex: number, previousPageData: CulturalEvent[] | null) => {
        if (previousPageData && previousPageData.length === 0) return null; // ✅ Stop fetching when no more data
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

    const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(getKey, fetcher);

    // ✅ Stable keys for array dependencies
    const venuesKey = useMemo(() => (venues && venues.length ? venues.join(',') : ''), [venues]);
    const barriosKey = useMemo(() => (barrios && barrios.length ? barrios.join(',') : ''), [barrios]);
    const typesKey = useMemo(() => (types && types.length ? types.join(',') : ''), [types]);
    const tagsKey = useMemo(() => (tags && tags.length ? tags.join(',') : ''), [tags]);

    // ✅ Reset pagination when filters change
    useEffect(() => {
        setSize(1);
    }, [searchQuery, typesKey, onlyFree, startDate, endDate, venuesKey, barriosKey, tagsKey, setSize]);

    const allEvents: CulturalEvent[] = data ? data.flat() : [];

    // ✅ No client-side date filtering; backend handles date filters now
    const events = allEvents;

    // Decide if there are more pages based on the size of the last page
    const lastPageSize = data ? (data[data.length - 1]?.length ?? 0) : 0;
    const hasMore = data ? lastPageSize === PAGE_SIZE : true;

    return {
        events,
        isLoading: !data && !error,
        error,
        loadMore: () => {
            // Prevent spamming requests while a fetch is in progress
            if (!isValidating && hasMore) {
                setSize(size + 1);
            }
        },
        // Helpful if parent wants to force refresh when filters change
        refresh: () => mutate(),
        isFetchingMore: isValidating,
        hasMore, // ✅ Expose hasMore to UI
    };
}
