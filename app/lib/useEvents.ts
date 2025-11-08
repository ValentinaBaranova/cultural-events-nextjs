'use client';

import useSWRInfinite from 'swr/infinite';
import { API_URL } from '@/lib/config';
import { CulturalEvent } from '@/lib/definitions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEvents(searchQuery = '', type?: string | null) {
    // ✅ Keep track of whether there are more events
    const getKey = (pageIndex: number, previousPageData: CulturalEvent[] | null) => {
        if (previousPageData && previousPageData.length === 0) return null; // ✅ Stop fetching when no more data
        const queryParam = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : '';
        const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
        return `${API_URL}/events?page=${pageIndex + 1}&limit=10${queryParam}${typeParam}`;
    };

    const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(getKey, fetcher);

    const events = data ? data.flat() : [];

    // ✅ Ensure `hasMore` is true until we know there are no more events
    const hasMore = isValidating || (data && data[data.length - 1]?.length > 0);

    return {
        events,
        isLoading: !data && !error,
        error,
        loadMore: () => {
            if (hasMore) {
                setSize(size + 1); // ✅ Only load more if there are more events
            }
        },
        // Helpful if parent wants to force refresh when filters change
        refresh: () => mutate(),
        isFetchingMore: isValidating,
        hasMore, // ✅ Expose hasMore to UI
    };
}
