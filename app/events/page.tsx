'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEvents } from '@/lib/useEvents';
import React, {useEffect, useRef, useState} from 'react';
import { useSearchParams } from 'next/navigation';
import { CulturalEvent } from '@/lib/definitions';
import Search from "@/ui/search";
import { UpdateEvent } from "@/ui/events/buttons";
import Skeleton from "@/ui/skeleton";
import {API_URL} from "@/lib/config";
import { useI18n } from '@/i18n/I18nProvider';
// import Skeleton from "@/ui/Skeleton"; // ✅ Import Skeleton Loader

type EventTypeOption = { slug: string; name: string };

export default function EventsListPage() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('query') || ''; // ✅ Read query from URL
    const [types, setTypes] = useState<EventTypeOption[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [onlyFree, setOnlyFree] = useState<boolean>(false);
    const { events, isLoading, error, loadMore, isFetchingMore, hasMore } = useEvents(searchQuery, selectedType, onlyFree);
    const { t, locale } = useI18n();

    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastEventRef = useRef<HTMLDivElement | null>(null);

    // ✅ Trigger `loadMore()` when the last event enters the viewport (Only if `hasMore`)
    useEffect(() => {
        if (!lastEventRef.current || !hasMore) return; // ✅ Don't observe if no more events

        observerRef.current = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                loadMore();
            }
        });

        observerRef.current.observe(lastEventRef.current);

        return () => observerRef.current?.disconnect();
    }, [loadMore, hasMore]);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/event-types?locale=${locale}`, { signal: controller.signal })
            .then(res => res.json())
            .then((data: { slug: string; name: string }[]) => setTypes(data))
            .catch(() => {});
        return () => controller.abort();
    }, [locale]);

    if (error) return <p>{t('events.error')}</p>;

    return (
        <div className="events-list-container">
            <Search />

            <div className="flex items-center gap-4">
                <select
                    className="border border-gray-300 rounded px-3 py-2"
                    value={selectedType || ''}
                    onChange={(e) => setSelectedType(e.target.value || null)}
                >
                    <option value="">{t('filters.allTypes')}</option>
                    {types.map((type) => (
                        <option key={type.slug} value={type.slug}>
                            {type.name}
                        </option>
                    ))}
                </select>

                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={onlyFree}
                        onChange={(e) => setOnlyFree(e.target.checked)}
                    />
                    {t('filters.onlyFree')}
                </label>
            </div>

            <div className="events-grid">
                {/* ✅ Show skeleton while first request is loading */}
                {isLoading && (
                    <>
                        <Skeleton/>
                        <Skeleton/>
                    </>
                )}

                {events?.map((event: CulturalEvent, index) => (
                    <div
                        key={event.id}
                        className="event-card"
                        ref={index === events.length - 1 ? lastEventRef : null} // ✅ Attach observer to last event
                    >
                        <Image
                            src={event.imageExists
                                ? `/events/${event.id}/image`
                                : '/events_images/placeholder.png'}
                            width={400}
                            height={400}
                            className="event-image"
                            alt={event.imageExists ? t('events.imageAlt') : t('events.imagePlaceholderAlt')}
                        />
                        <div className="event-details">
                            <h2>{event.name}</h2>
                            <p>{event.description}</p>
                            <p><strong>{t('events.date')}</strong> {event.date}</p>
                            <p><strong>{t('events.location')}</strong> {[event.place?.name, event.placeDetail].filter(Boolean).join(' — ')}</p>
                            {(event.isFree || event.priceText) && (
                                <p>
                                    <strong>{t('events.price')}</strong>{' '}
                                    {event.isFree ? t('events.free') : event.priceText}
                                </p>
                            )}
                            <UpdateEvent id={event.id}/>
                            <Link href={`/events/${event.id}`} className="event-link">
                                {t('events.viewDetails')}
                            </Link>
                        </div>
                    </div>
                ))}

                {/* ✅ Show Skeleton Loader while fetching more events */}
                {isFetchingMore && hasMore && <Skeleton/>}
            </div>
        </div>
    );
};
