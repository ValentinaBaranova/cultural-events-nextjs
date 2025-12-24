'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEvents } from '@/lib/useEvents';
import React, {useEffect, useRef, useState, Suspense, useMemo} from 'react';
import { useSearchParams } from 'next/navigation';
import { CulturalEvent } from '@/lib/definitions';
import HeroSearch from "@/ui/HeroSearch";
import { UpdateEvent } from "@/ui/events/buttons";
import Skeleton from "@/ui/skeleton";
import {API_URL, SHOW_EVENT_DETAILS_LINK} from "@/lib/config";
import { useI18n } from '@/i18n/I18nProvider';
import { DatePicker, Select, Checkbox } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
// import Skeleton from "@/ui/Skeleton"; // ✅ Import Skeleton Loader

type EventTypeOption = { slug: string; name: string };

type VenueSuggest = { id: string; name: string; slug: string };

type BarrioSuggest = { id: string; name: string; slug: string };

type Option = { label: string; value: string };

type TagOption = { slug: string; name: string };

function EventsListPageInner() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('query') || ''; // ✅ Read query from URL
    const [types, setTypes] = useState<EventTypeOption[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [onlyFree, setOnlyFree] = useState<boolean>(false);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [venueOptions, setVenueOptions] = useState<Option[]>([]);
    const [venueLoading, setVenueLoading] = useState(false);
    const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
    const [barrioOptions, setBarrioOptions] = useState<Option[]>([]);
    const [barrioLoading, setBarrioLoading] = useState(false);
    const [selectedBarrios, setSelectedBarrios] = useState<string[]>([]);

    const [tagOptions, setTagOptions] = useState<Option[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Map slug -> localized tag name for quick lookup
    const tagNameBySlug = useMemo(() => {
        return Object.fromEntries(tagOptions.map(o => [o.value, o.label]));
    }, [tagOptions]);

    const getTagLabel = (slug: string) => tagNameBySlug[slug] ?? slug;

    const [pickerOpen, setPickerOpen] = useState(false);

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

    // Default: next 7 days interval on initial load
    useEffect(() => {
        setDateRange([today, next7End]);
        // We intentionally run this only once on mount to avoid overwriting user input
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyPreset = (range: [Dayjs, Dayjs]) => {
        setDateRange(range);
        setPickerOpen(false);
    };

    const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
    const endDate = dateRange?.[1]?.format('YYYY-MM-DD');

    const { events, isLoading, error, loadMore, isFetchingMore, hasMore } = useEvents(
        searchQuery,
        selectedTypes,
        onlyFree,
        startDate,
        endDate,
        selectedVenues,
        selectedBarrios,
        selectedTags,
    );

    const handleTagClick = (tag: string) => {
        setSelectedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
        // Optionally ensure the tag exists in options so it shows up with label
        setTagOptions((prev) => (prev.some(o => o.value === tag) ? prev : [...prev, { label: tag, value: tag }]));
    };
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

    // Fetch tags for multiselect
    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/tags?locale=${locale}`, { signal: controller.signal })
            .then(res => res.json())
            .then((data: TagOption[]) => setTagOptions(data.map(t => ({ label: t.name, value: t.slug }))))
            .catch(() => {});
        return () => controller.abort();
    }, [locale]);

    // Venues autocomplete: debounced fetch
    const searchTimer = useRef<NodeJS.Timeout | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Barrios autocomplete timers
    const barrioSearchTimer = useRef<NodeJS.Timeout | null>(null);
    const barrioAbortRef = useRef<AbortController | null>(null);

    const searchVenues = (q: string) => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            const query = q.trim();
            if (abortRef.current) abortRef.current.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            setVenueLoading(true);
            try {
                let url: string;
                if (!query) {
                    const start = dateRange?.[0]?.format('YYYY-MM-DD');
                    const end = dateRange?.[1]?.format('YYYY-MM-DD');
                    const startParam = start ? `&startDate=${encodeURIComponent(start)}` : '';
                    const endParam = end ? `&endDate=${encodeURIComponent(end)}` : '';
                    url = `${API_URL}/places/with-events?limit=8${startParam}${endParam}`;
                } else {
                    url = `${API_URL}/places/suggest?q=${encodeURIComponent(query)}&limit=8`;
                }
                const resp = await fetch(url, { signal: ctrl.signal });
                const data: VenueSuggest[] = await resp.json();
                const opts: Option[] = data.map(p => ({ label: p.name, value: p.slug }));
                setVenueOptions(opts);
            } catch {
                // ignore abort or network errors for suggestions
            } finally {
                setVenueLoading(false);
            }
        }, 250);
    };

    const searchBarrios = (q: string) => {
        if (barrioSearchTimer.current) clearTimeout(barrioSearchTimer.current);
        barrioSearchTimer.current = setTimeout(async () => {
            const query = q.trim();
            if (barrioAbortRef.current) barrioAbortRef.current.abort();
            const ctrl = new AbortController();
            barrioAbortRef.current = ctrl;
            setBarrioLoading(true);
            try {
                let url: string;
                if (!query) {
                    const start = dateRange?.[0]?.format('YYYY-MM-DD');
                    const end = dateRange?.[1]?.format('YYYY-MM-DD');
                    const startParam = start ? `&startDate=${encodeURIComponent(start)}` : '';
                    const endParam = end ? `&endDate=${encodeURIComponent(end)}` : '';
                    url = `${API_URL}/barrios/with-events?limit=8${startParam}${endParam}`;
                } else {
                    url = `${API_URL}/barrios/suggest?q=${encodeURIComponent(query)}&limit=8`;
                }
                const resp = await fetch(url, { signal: ctrl.signal });
                const data: BarrioSuggest[] = await resp.json();
                const opts: Option[] = data.map(b => ({ label: b.name, value: b.slug }));
                setBarrioOptions(opts);
            } catch {
                // ignore abort or network errors for suggestions
            } finally {
                setBarrioLoading(false);
            }
        }, 250);
    };

    if (error) return <p>{t('events.error')}</p>;

    return (
        <div className="events-list-container">
            <HeroSearch />

            <div className="flex items-center gap-4 flex-wrap mb-6">
                {/* Event types */}
                <Select
                    aria-label="Event type filter"
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder={t('filters.allTypes')}
                    value={selectedTypes}
                    onChange={(values) => setSelectedTypes(values as string[])}
                    options={types.map((type) => ({ label: type.name, value: type.slug }))}
                    optionFilterProp="label"
                    style={{ minWidth: 240 }}
                />

                {/* Tags */}
                <Select
                    aria-label="Event tags filter"
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder={t('filters.tags')}
                    value={selectedTags}
                    onChange={(values) => setSelectedTags(values as string[])}
                    options={tagOptions}
                    optionFilterProp="label"
                    style={{ minWidth: 240 }}
                />

                <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder={t('filters.places')}
                    notFoundContent={t('filters.placesPrompt')}
                    filterOption={false}
                    onSearch={searchVenues}
                    onOpenChange={(open) => { if (open) searchVenues(''); }}
                    options={venueOptions}
                    loading={venueLoading}
                    value={selectedVenues}
                    onChange={(values) => setSelectedVenues(values as string[])}
                    style={{ minWidth: 240 }}
                />

                <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder={t('filters.barrios')}
                    notFoundContent={t('filters.barriosPrompt')}
                    filterOption={false}
                    onSearch={searchBarrios}
                    onOpenChange={(open) => { if (open) searchBarrios(''); }}
                    options={barrioOptions}
                    loading={barrioLoading}
                    value={selectedBarrios}
                    onChange={(values) => setSelectedBarrios(values as string[])}
                    style={{ minWidth: 240 }}
                />

                <DatePicker.RangePicker
                    value={dateRange ?? undefined}
                    onChange={(values) => setDateRange((values as [Dayjs, Dayjs] | null) ?? null)}
                    allowClear
                    format="YYYY-MM-DD"
                    inputReadOnly
                    placement="bottomLeft"
                    getPopupContainer={(trigger) => trigger?.parentElement || document.body}
                    className="min-w-[240px] w-full sm:w-auto"
                    size="large"
                    classNames={{ popup: { root: 'mobile-range-picker' } }}
                    open={pickerOpen}
                    onOpenChange={setPickerOpen}
                    panelRender={(panelNode) => (
                        <div>
                            <div className="flex flex-wrap gap-2 px-3 pt-3 pb-2 border-b border-gray-200">
                                {presets.map((p) => (
                                    <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => applyPreset(p.value)}
                                        className="px-2.5 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            {panelNode}
                        </div>
                    )}
                />

                <Checkbox
                    checked={onlyFree}
                    onChange={(e) => setOnlyFree(e.target.checked)}
                >
                    {t('filters.onlyFree')}
                </Checkbox>
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
                            <p><strong>{t('events.type')}</strong> {types.find((ty) => ty.slug === event.type)?.name ?? event.type}</p>
                            <p><strong>{(!event.endDate || event.endDate !== event.date) ? t('events.startDate') : t('events.date')}</strong> {event.date}{event.startTime ? ` ${event.startTime.slice(0, 5)}` : ''}</p>
                            <p><strong>{t('events.location')}</strong> {event.venue?.name ?? ''}</p>
                            {event.venue?.barrio?.name && (
                                <p><strong>{t('events.barrio')}</strong> {event.venue.barrio.name}</p>
                            )}
                            {(event.isFree || event.priceText) && (
                                <p>
                                    <strong>{t('events.price')}</strong>{' '}
                                    {event.isFree ? t('events.free') : event.priceText}
                                </p>
                            )}

                            {/* Tags */}
                            {event.tags && event.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2" aria-label="event-tags">
                                    {event.tags.map((tag, idx) => {
                                        const label = getTagLabel(tag);
                                        return (
                                            <button
                                                key={`tag-${idx}`}
                                                type="button"
                                                onClick={() => handleTagClick(tag)}
                                                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                aria-label={`Filter by tag ${label}`}
                                                title={`Filter by #${label}`}
                                            >
                                                #{label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {event.paymentChannels && event.paymentChannels.length > 0 && (
                                <div className="tickets-row flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <p>
                                    <strong>{t('events.tickets')}</strong>{' '}
                                    {event.paymentChannels.map((ch, idx) => {
                                        const displayName = ch?.name || ch?.url || '';
                                        const hasUrl = !!ch?.url;
                                        const normalizedUrl = hasUrl
                                            ? (ch!.url!.startsWith('http') ? ch!.url! : `https://${ch!.url!}`)
                                            : '';
                                        const linkClasses = "event-link inline-flex items-center max-w-full break-words px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-0 sm:py-0 sm:bg-transparent sm:rounded-none";
                                        const spanClasses = "max-w-full break-words";
                                        const content = hasUrl ? (
                                            <a
                                                key={`ch-${idx}`}
                                                href={normalizedUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={linkClasses}
                                                title={displayName}
                                            >
                                                {displayName}
                                            </a>
                                        ) : (
                                            <span key={`ch-${idx}`} className={spanClasses}>{displayName}</span>
                                        );

                                        return (
                                            <React.Fragment key={`frag-${idx}`}>
                                                {content}
                                                {idx < event.paymentChannels!.length - 1 && <span className="hidden sm:inline"> · </span>}
                                            </React.Fragment>
                                        );
                                    })}
                                    </p>
                                </div>
                            )}

                            <UpdateEvent id={event.id}/>
                            <div className="event-actions">
                                {event.instagramId ? (
                                    <a
                                        href={`https://www.instagram.com/p/${event.instagramId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="event-link"
                                    >
                                        {t('event.originalSource')}
                                    </a>
                                ) : (
                                    <span />
                                )}
                                {SHOW_EVENT_DETAILS_LINK ? (
                                    <Link href={`/events/${event.id}`} className="event-link">
                                        {t('events.viewDetails')}
                                    </Link>
                                ) : <span />}
                            </div>
                        </div>
                    </div>
                ))}

                {/* ✅ Show Skeleton Loader while fetching more events */}
                {isFetchingMore && hasMore && <Skeleton/>}
            </div>
        </div>
    );
};

export default function EventsListPage() {
    return (
        <Suspense fallback={<div />}> 
            <EventsListPageInner />
        </Suspense>
    );
}
