import useSWR from 'swr';
import { CulturalEvent } from '@/lib/definitions';
import { API_URL } from '@/lib/config'; // Use API URL from config

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEvent(id: string | undefined) {
    const { data, error, isLoading } = useSWR<CulturalEvent>(id ? `${API_URL}/events/${id}` : null, fetcher);

    return {
        event: data,
        isLoading,
        error,
    };
}
