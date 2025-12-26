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
    const [sheetOpen, setSheetOpen] = useState(false);
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

    // Maps for quick label lookup (must be declared before any early returns)
    const typeNameBySlug = useMemo(() => Object.fromEntries(types.map(t => [t.slug, t.name])), [types]);
    const barrioNameBySlug = useMemo(() => Object.fromEntries(barrioOptions.map(b => [b.value, b.label])), [barrioOptions]);


    // Map slug -> localized tag name for quick lookup
    const tagNameBySlug = useMemo(() => {
        return Object.fromEntries(tagOptions.map(o => [o.value, o.label]));
    }, [tagOptions]);

    const getTagLabel = (slug: string) => tagNameBySlug[slug] ?? slug;

    const [pickerOpen, setPickerOpen] = useState(false);
    // Desktop filters expand/collapse
    const [desktopExpanded, setDesktopExpanded] = useState(false);

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

    // Expand/collapse state
    // - Mobile/tablet: per-card state via Set
    // - Desktop (>=1024px): global state — expanding one expands all; collapsing one collapses all
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [isDesktop, setIsDesktop] = useState(false);
    const [allExpandedDesktop, setAllExpandedDesktop] = useState(false);

    // Listen for viewport changes to determine desktop mode
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(min-width: 1024px)');
        const apply = () => setIsDesktop(mq.matches);
        apply();
        mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply as any);
        return () => {
            mq.removeEventListener ? mq.removeEventListener('change', apply) : mq.removeListener(apply as any);
        };
    }, []);

    // When switching into desktop, derive global state from current per-card state (any expanded => all expanded)
    useEffect(() => {
        if (isDesktop) {
            setAllExpandedDesktop(expandedCards.size > 0);
        }
        // no else: keep per-card state intact for when returning to mobile
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDesktop]);

    const isCardExpanded = (id: string | number) => {
        return isDesktop ? allExpandedDesktop : expandedCards.has(String(id));
    };

    const toggleCard = (id: string | number) => {
        if (isDesktop) {
            setAllExpandedDesktop((prev) => !prev);
            return;
        }
        setExpandedCards((prev) => {
            const next = new Set(prev);
            const key = String(id);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

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

    // Primary filters: types + only free
    const renderPrimaryFilters = () => (
        <>
            <div className="mb-4 sm:mt-4">
                <div className="flex flex-wrap gap-2">
                    {types.map((type) => {
                        const active = selectedTypes.includes(type.slug);
                        return (
                            <button
                                key={type.slug}
                                type="button"
                                onClick={() => {
                                    setSelectedTypes((prev) =>
                                        prev.includes(type.slug)
                                            ? prev.filter((t) => t !== type.slug)
                                            : [...prev, type.slug]
                                    );
                                }}
                                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                    active
                                        ? 'bg-[#ddd6fe] text-[#111827] border-[#8b5cf6]'
                                        : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                                }`}
                            >
                                {type.name}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-4">
                    <Checkbox className="only-free-checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)}>
                        {t('filters.onlyFree')}
                    </Checkbox>
                </div>
            </div>
        </>
    );

    // Advanced filters: date range, venues, barrios, tags
    const renderAdvancedFilters = () => (
        <>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 mb-1">Rango de fechas</span>
                <DatePicker.RangePicker
                    value={dateRange ?? undefined}
                    onChange={(values) => setDateRange((values as [Dayjs, Dayjs] | null) ?? null)}
                    allowClear
                    format="YYYY-MM-DD"
                    inputReadOnly
                    placement="bottomLeft"
                    getPopupContainer={(trigger) => trigger?.parentElement || document.body}
                    className="w-full sm:w-80"
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
            </div>

            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 mb-1">Lugares</span>
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
            </div>

            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 mb-1">Barrios</span>
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
            </div>

            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 mb-1">Etiquetas</span>
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
            </div>
        </>
    );

    // Helpers to render filters content (shared by mobile sheet)
    const renderFiltersContent = () => (
        <>
            {renderPrimaryFilters()}
            {renderAdvancedFilters()}
        </>
    );

    const clearAll = () => {
        setSelectedTypes([]);
        setOnlyFree(false);
        setDateRange(null);
        setSelectedVenues([]);
        setSelectedBarrios([]);
        setSelectedTags([]);
    };

    // Format date chip label according to priority rules (Hoy / Mañana / Este finde / range)
    const formatDateChip = (): string => {
        if (!dateRange) return '';
        const [s, e] = dateRange;
        const same = (a: Dayjs, b: Dayjs) => a.isSame(b, 'day');
        if (same(s, today) && same(e, today)) return 'Hoy';
        if (same(s, tomorrow) && same(e, tomorrow)) return 'Mañana';
        if (same(s, weekendStart) && same(e, weekendEnd)) return 'Este finde';
        if (same(s, e)) return s.format('DD MMM');
        const showYear = !same(s, e) && !s.isSame(e, 'year');
        return `${s.format(showYear ? 'DD MMM YYYY' : 'DD MMM')} – ${e.format(showYear ? 'DD MMM YYYY' : 'DD MMM')}`;
    };

    // Build prioritized chips: Date, Gratis, Type, Barrio (max 2 shown)

    const chipCandidates: { key: string; label: string; onClear: () => void }[] = [];
    if (dateRange) chipCandidates.push({ key: 'date', label: formatDateChip(), onClear: () => setDateRange(null) });
    if (onlyFree) chipCandidates.push({ key: 'free', label: 'Gratis', onClear: () => setOnlyFree(false) });
    if (selectedTypes.length) {
        const first = selectedTypes[0];
        const firstName = typeNameBySlug[first] ?? first;
        const extra = selectedTypes.length > 1 ? ` +${selectedTypes.length - 1}` : '';
        chipCandidates.push({ key: 'types', label: `${firstName}${extra}` , onClear: () => setSelectedTypes([]) });
    }
    if (selectedBarrios.length) {
        const first = selectedBarrios[0];
        const firstName = barrioNameBySlug[first] ?? first;
        const extra = selectedBarrios.length > 1 ? ` +${selectedBarrios.length - 1}` : '';
        chipCandidates.push({ key: 'barrios', label: `${firstName}${extra}`, onClear: () => setSelectedBarrios([]) });
    }

    const prioritizedChips = chipCandidates.slice(0, 2);

    // Badge count should reflect all active groups
    const badgeCount = (
        (dateRange ? 1 : 0) +
        (onlyFree ? 1 : 0) +
        (selectedTypes.length ? 1 : 0) +
        (selectedVenues.length ? 1 : 0) +
        (selectedBarrios.length ? 1 : 0) +
        (selectedTags.length ? 1 : 0)
    );

    // Desktop badge should count only advanced filters hidden behind the toggle

    return (
        <div className="events-list-container">
            <HeroSearch />

            {/* Mobile: Unified chips + Filters button block */}
            <div className="sm:hidden mb-4 filters-block">
                {prioritizedChips.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {prioritizedChips.map(chip => (
                            <span key={chip.key} className="chip">
                                {chip.label}
                                <button aria-label={`Clear ${chip.key}`} className="chip-x" onClick={chip.onClear}>×</button>
                            </span>
                        ))}
                        <button className="chip-clear-all" onClick={clearAll}>Limpiar todo</button>
                    </div>
                )}
                <button type="button" className="filters-btn" onClick={() => setSheetOpen(true)}>
                    <svg className="filters-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
                    </svg>
                    Filtros
                    {badgeCount > 0 && <span className="filters-badge">{badgeCount}</span>}
                </button>
            </div>

            {/* Desktop filters container with expand/collapse */}
            <div className="hidden sm:block mb-4 filters-block">
                {/* Primary always visible */}
                {renderPrimaryFilters()}

                {/* Summary row: visible when any filter is active */}
                {badgeCount > 0 && (
                    <div className="filters-summary" role="status" aria-live="polite">
                        <span>{badgeCount === 1 ? '1 filtro activo' : `${badgeCount} filtros activos`}</span>
                        <button type="button" className="filters-summary-clear" onClick={clearAll}>Limpiar todo</button>
                    </div>
                )}

                {/* Toggle to expand/collapse advanced */}
                <div className="mb-1">
                    <button
                        type="button"
                        aria-expanded={desktopExpanded}
                        aria-label={desktopExpanded ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
                        className="filters-toggle"
                        onClick={() => setDesktopExpanded((v) => !v)}
                    >
                        <span>{desktopExpanded ? 'Menos filtros' : 'Más filtros'}</span>
                        <svg
                            className={`filters-icon transition-transform ${desktopExpanded ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                </div>
                {desktopExpanded && (
                    <div className="mt-2 pt-2 pb-4 grid gap-4">
                        {renderAdvancedFilters()}
                    </div>
                )}
            </div>

            {/* Mobile: Bottom sheet */}
            {sheetOpen && (
                <>
                    <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
                    <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Filters">
                        <div className="sheet-header">
                            <span className="sheet-title">Filtros</span>
                            <button className="sheet-close" onClick={() => setSheetOpen(false)} aria-label="Close">✕</button>
                        </div>
                        <div className="sheet-content">
                            {renderFiltersContent()}
                        </div>
                        <div className="sheet-footer">
                            <button className="sheet-apply" onClick={() => setSheetOpen(false)}>Aplicar</button>
                            <button className="sheet-reset" onClick={clearAll}>Limpiar</button>
                        </div>
                    </div>
                </>
            )}

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
                            <h2 className="event-title">{event.name}</h2>
                            <div className="event-divider" aria-hidden="true" />

                            <div className="event-meta">
                                <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span className="event-meta-text">
                                    {event.date}{event.startTime ? ` a las ${event.startTime.slice(0, 5)}` : ''}
                                </span>
                            </div>

                            <div className="event-meta">
                                <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 10c0 5.523-9 12-9 12S3 15.523 3 10a9 9 0 1118 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span className="event-meta-text">
                                    {event.venue?.name ?? ''}
                                    {event.venue?.barrio?.name && (
                                        <>
                                            {' '}
                                            ·{' '}
                                            <a className="event-link" href={`/events?barrio=${encodeURIComponent(event.venue.barrio.name)}`}>{event.venue.barrio.name}</a>
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Toggle collapsed/expanded (top): show only when collapsed */}
                            {!isCardExpanded(event.id) && (
                                <button
                                    type="button"
                                    className="event-collapse"
                                    aria-expanded={isCardExpanded(event.id)}
                                    aria-controls={`event-content-${event.id}`}
                                    onClick={() => toggleCard(event.id)}
                                    title={isCardExpanded(event.id) ? t('events.collapse') : t('events.expand')}
                                >
                                    <svg className={`event-collapse-icon ${isCardExpanded(event.id) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                            )}

                            {/* Expanded content */}
                            {isCardExpanded(event.id) && (
                                <div id={`event-content-${event.id}`}>
                                    <p className="event-description">{event.description}</p>

                                    {/* Tags */}
                                    {event.tags && event.tags.length > 0 && (
                                        <div className="event-tags" aria-label="event-tags">
                                            {event.tags.map((tag, idx) => {
                                                const label = getTagLabel(tag);
                                                return (
                                                    <button
                                                        key={`tag-${idx}`}
                                                        type="button"
                                                        onClick={() => handleTagClick(tag)}
                                                        className="event-tag"
                                                        aria-label={`Filter by tag ${label}`}
                                                        title={`Filter by #${label}`}
                                                    >
                                                        #{label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Type row */}
                                    <div className="event-meta">
                                        <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M20.59 13.41L12 21l-9-9V3h9l8.59 8.59z" />
                                            <path d="M7 7h.01" />
                                        </svg>
                                        <a className="event-link" href={`/events?type=${encodeURIComponent(event.type)}`}>
                                            {types.find((ty) => ty.slug === event.type)?.name ?? event.type}
                                        </a>
                                    </div>

                                    {/* Tickets */}
                                    {event.paymentChannels && event.paymentChannels.length > 0 && (
                                        <>
                                            <div className="event-divider" aria-hidden="true" />
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
                                        </>
                                    )}

                                    <div className="event-divider" aria-hidden="true" />
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

                                    {/* Toggle (bottom): show only when expanded */}
                                    <button
                                        type="button"
                                        className="event-collapse"
                                        aria-expanded={isCardExpanded(event.id)}
                                        aria-controls={`event-content-${event.id}`}
                                        onClick={() => toggleCard(event.id)}
                                        title={isCardExpanded(event.id) ? t('events.collapse') : t('events.expand')}
                                    >
                                        <svg className={`event-collapse-icon ${isCardExpanded(event.id) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                </div>
                            )}
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
