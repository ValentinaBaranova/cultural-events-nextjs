"use client";
import useSWR from 'swr';
import { API_URL } from '@/lib/config';
import { CulturalEvent } from '@/lib/definitions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEvents(searchQuery = '') {
  const url = searchQuery ? `${API_URL}/events?search=${encodeURIComponent(searchQuery)}` : `${API_URL}/events`;
  const { data, error } = useSWR<CulturalEvent[]>(url, fetcher);

    return {
        events: data,
        isLoading: !data && !error,
        error,
    };
}
