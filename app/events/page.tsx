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
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
// import Skeleton from "@/ui/Skeleton"; // ✅ Import Skeleton Loader

type EventTypeOption = { slug: string; name: string };

export default function EventsListPage() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('query') || ''; // ✅ Read query from URL
    const [types, setTypes] = useState<EventTypeOption[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [onlyFree, setOnlyFree] = useState<boolean>(false);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    // Preset ranges for the date picker
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');
    const next7End = today.add(6, 'day'); // inclusive 7 days (today + 6)

    // This Weekend: Saturday to Sunday; if today is Sunday, only today
    const dow = today.day(); // 0=Sunday ... 6=Saturday
    const weekendStart = dow === 0 ? today : today.add(6 - dow, 'day');
    const weekendEnd = dow === 0 ? today : weekendStart.add(1, 'day');

    const monthStart = today.startOf('month');
    const monthEnd = today.endOf('month');

    const presets = [
        { label: 'Today', value: [today, today] as [Dayjs, Dayjs] },
        { label: 'Tomorrow', value: [tomorrow, tomorrow] as [Dayjs, Dayjs] },
        { label: 'This Weekend', value: [weekendStart, weekendEnd] as [Dayjs, Dayjs] },
        { label: 'Next 7 Days', value: [today, next7End] as [Dayjs, Dayjs] },
        { label: 'This Month', value: [monthStart, monthEnd] as [Dayjs, Dayjs] },
    ];

    const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
    const endDate = dateRange?.[1]?.format('YYYY-MM-DD');

    const { events, isLoading, error, loadMore, isFetchingMore, hasMore } = useEvents(
        searchQuery,
        selectedType,
        onlyFree,
        startDate,
        endDate,
    );
    const { t, locale } = useI18n();

    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastEventRef = useRef<HTMLDivElement | null>(null);

    // Trigger `loadMore()` when the last event enters the viewport
    // Pause observing while a fetch is in progress to avoid rapid re-triggers
    useEffect(() => {
        const target = lastEventRef.current;
        if (!target || !hasMore || isFetchingMore) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                observer.unobserve(entry.target); // avoid multiple triggers while in view
                loadMore();
            }
        });

        observer.observe(target);
        observerRef.current = observer;

        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, loadMore, events?.length]);

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

            <div className="flex items-center gap-4 flex-wrap">
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

                <DatePicker.RangePicker
                    value={dateRange as any}
                    onChange={(values) => setDateRange(values as [Dayjs | null, Dayjs | null] | null)}
                    allowClear
                    presets={presets}
                    format="YYYY-MM-DD"
                />

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
                            <p><strong>{t('events.location')}</strong> {event.place?.name ?? ''}</p>
                            {(event.isFree || event.priceText) && (
                                <p>
                                    <strong>{t('events.price')}</strong>{' '}
                                    {event.isFree ? t('events.free') : event.priceText}
                                </p>
                            )}
                            <UpdateEvent id={event.id}/>
                            {event.instagramId && (
                                <p className="mt-2">
                                    <a
                                        href={`https://www.instagram.com/p/${event.instagramId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {t('event.originalSource')}
                                    </a>
                                </p>
                            )}
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
