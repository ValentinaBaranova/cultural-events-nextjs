'use client';

import Link from 'next/link';
import { useEvents } from '@/lib/useEvents';
import EventCard from './components/EventCard';
import { loadDictionaries } from '@/lib/dictionaries';
import React, {useEffect, useRef, useState, Suspense, useMemo} from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { CulturalEvent } from '@/lib/definitions';
import HeroSearch from "@/ui/HeroSearch";
import Skeleton from "@/ui/skeleton";
import { useI18n } from '@/i18n/I18nProvider';
import { Alert } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

type EventTypeOption = { slug: string; name: string };

type Option = { label: string; value: string };

import FilterRow from './components/FilterRow';

import PrimaryFilters from './components/PrimaryFilters';
import DateRangeFilter from './components/DateRangeFilter';
import StickySearchBar from './components/StickySearchBar';

function EventsListPageInner() {
    // Set CSS --vh variable to handle 100vh issues on iOS Safari when the URL bar collapses/expands
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setVh();
        window.addEventListener('resize', setVh);
        window.addEventListener('orientationchange', setVh);
        return () => {
            window.removeEventListener('resize', setVh);
            window.removeEventListener('orientationchange', setVh);
        };
    }, []);
    // Lock body scroll when a full-screen overlay is open (mobile filters sheet or pickers)
    // This prevents background content from moving on iOS and ensures correct viewport calculations
    const router = useRouter();
    const pathname = usePathname();
    const [sheetOpen, setSheetOpen] = useState(false);
    
    // Body scroll lock will be applied in an effect declared after mobilePicker is defined
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('query') || ''; // ✅ Read query from URL
    const [types, setTypes] = useState<EventTypeOption[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [onlyFree, setOnlyFree] = useState<boolean>(false);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [venueOptions, setVenueOptions] = useState<Option[]>([]);
    const [allVenueOptions, setAllVenueOptions] = useState<Option[]>([]); // full dictionary for labels
    const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
    const [barrioOptions, setBarrioOptions] = useState<Option[]>([]);
    const [allBarrioOptions, setAllBarrioOptions] = useState<Option[]>([]); // full dictionary for labels
    const [selectedBarrios, setSelectedBarrios] = useState<string[]>([]);

    const [allTagOptions, setAllTagOptions] = useState<Option[]>([]);
    const [tagOptions, setTagOptions] = useState<Option[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // When a date range is applied, we compute which types have zero events for those dates
    const [disabledTypeSlugs, setDisabledTypeSlugs] = useState<Set<string>>(new Set());
    
    
    // URL sync helpers
    const initializedFromUrlRef = useRef(false);

    // Maps for quick label lookup (must be declared before any early returns)
    const [eventTypeMap, setEventTypeMap] = useState<Record<string, string>>({});
    const barrioNameBySlug = useMemo(() => Object.fromEntries(allBarrioOptions.map(b => [b.value, b.label])), [allBarrioOptions]);
    const venueNameBySlug = useMemo(() => Object.fromEntries(allVenueOptions.map(v => [v.value, v.label])), [allVenueOptions]);

    // Map slug -> localized tag name for quick lookup
    const tagNameBySlug = useMemo(() => {
        return Object.fromEntries(allTagOptions.map(o => [o.value, o.label]));
    }, [allTagOptions]);

    const getTagLabel = (slug: string) => tagNameBySlug[slug] ?? slug;
    const getVenueLabel = (slug: string) => venueNameBySlug[slug] ?? slug;
    const getBarrioLabel = (slug: string) => barrioNameBySlug[slug] ?? slug;

    const { t, locale } = useI18n();

    // Initialize filters from URL on first mount
    useEffect(() => {
        if (initializedFromUrlRef.current) return;
        // Read arrays as comma-separated lists; support legacy singular names
        const getArrayParam = (primary: string, legacy?: string): string[] => {
            const raw = searchParams.get(primary) ?? (legacy ? searchParams.get(legacy) : null);
            if (!raw) return [];
            return raw.split(',').map(s => s.trim()).filter(Boolean);
        };
        const typesFromUrl = getArrayParam('types', 'type');
        const venuesFromUrl = getArrayParam('venues', 'venue');
        const barriosFromUrl = getArrayParam('barrios', 'barrio');
        const tagsFromUrl = getArrayParam('tags');
        const freeFromUrl = searchParams.get('free');
        const startFromUrl = searchParams.get('startDate');
        const endFromUrl = searchParams.get('endDate');

        if (typesFromUrl.length) setSelectedTypes(typesFromUrl);
        if (venuesFromUrl.length) {
            setSelectedVenues(venuesFromUrl);
        }
        if (barriosFromUrl.length) {
            setSelectedBarrios(barriosFromUrl);
        }
        if (tagsFromUrl.length) {
            setSelectedTags(tagsFromUrl);
        }
        if (freeFromUrl) {
            const normalized = freeFromUrl.toLowerCase();
            setOnlyFree(normalized === '1' || normalized === 'true' || normalized === 'yes');
        }
        if (startFromUrl || endFromUrl) {
            const start = startFromUrl ? dayjs(startFromUrl) : null;
            const end = endFromUrl ? dayjs(endFromUrl) : null;
            if (start && start.isValid() && end && end.isValid()) {
                setDateRange([start, end]);
            } else if (start && start.isValid()) {
                setDateRange([start, start]);
            } else if (end && end.isValid()) {
                setDateRange([end, end]);
            }
        }
        initializedFromUrlRef.current = true;
    }, [searchParams, locale]);

    // Keep selectedTypes in sync if URL changes externally (e.g., via Search suggestions)
    useEffect(() => {
        // Read array from URL (support legacy singular name)
        const raw = searchParams.get('types') ?? searchParams.get('type');
        const nextTypes = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const nextKey = nextTypes.join(',');
        const currKey = selectedTypes.join(',');
        if (nextKey !== currKey) {
            setSelectedTypes(nextTypes);
        }
    }, [searchParams, selectedTypes]);

    // Keep selectedVenues in sync if URL changes externally (e.g., via Search suggestions)
    useEffect(() => {
        const raw = searchParams.get('venues') ?? searchParams.get('venue');
        const nextVenues = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const nextKey = nextVenues.join(',');
        const currKey = selectedVenues.join(',');
        if (nextKey !== currKey) {
            setSelectedVenues(nextVenues);
        }
    }, [searchParams, selectedVenues]);

    // Keep selectedBarrios in sync if URL changes externally (e.g., via Search suggestions)
    useEffect(() => {
        const raw = searchParams.get('barrios') ?? searchParams.get('barrio');
        const nextBarrios = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const nextKey = nextBarrios.join(',');
        const currKey = selectedBarrios.join(',');
        if (nextKey !== currKey) {
            setSelectedBarrios(nextBarrios);
        }
    }, [searchParams, selectedBarrios]);

    // Labels for venues are preloaded via dictionaries; no async hydration needed.
    useEffect(() => {
        // No-op: keep for dependency structure in case of future changes
        return;
    }, [selectedVenues]);

    // Labels for barrios are preloaded via dictionaries; no async hydration needed.
    useEffect(() => {
        return;
    }, [selectedBarrios]);

    // Keep selectedTags in sync if URL changes externally (e.g., via Search suggestions)
    useEffect(() => {
        const raw = searchParams.get('tags');
        const nextTags = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const nextKey = nextTags.join(',');
        const currKey = selectedTags.join(',');
        if (nextKey !== currKey) {
            setSelectedTags(nextTags);
        }
    }, [searchParams, selectedTags]);

    // Tag labels are preloaded via dictionaries; no async hydration needed.
    useEffect(() => {
        return;
    }, [selectedTags]);

    // Push active filters into the URL whenever they change
    useEffect(() => {
        if (!initializedFromUrlRef.current) return; // wait until initial read
        const params = new URLSearchParams(searchParams.toString());

        const setOrDelete = (key: string, value?: string | null) => {
            if (value && value.length > 0) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        };

        // Multi-value as comma-separated lists
        setOrDelete('types', selectedTypes.join(','));
        setOrDelete('venues', selectedVenues.join(','));
        setOrDelete('barrios', selectedBarrios.join(','));
        setOrDelete('tags', selectedTags.join(','));
        setOrDelete('free', onlyFree ? '1' : null);

        const start = dateRange?.[0]?.format('YYYY-MM-DD');
        const end = dateRange?.[1]?.format('YYYY-MM-DD');
        setOrDelete('startDate', start ?? null);
        setOrDelete('endDate', end ?? null);

        const qs = params.toString();
        const currentQs = searchParams.toString();
        const next = qs ? `${pathname}?${qs}` : pathname;
        const current = currentQs ? `${pathname}?${currentQs}` : pathname;
        if (next !== current) {
            router.replace(next, { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTypes.join(','), selectedVenues.join(','), selectedBarrios.join(','), selectedTags.join(','), onlyFree, dateRange?.[0]?.valueOf(), dateRange?.[1]?.valueOf(), pathname]);

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

    const next30End = today.add(29, 'day'); // inclusive 30-day window (today + 29)

    // Use i18n before creating presets to avoid "Cannot access 't' before initialization"

    const presets = [
        { label: t('filters.date.today', 'Today'), value: [today, today] as [Dayjs, Dayjs] },
        { label: t('filters.date.tomorrow', 'Tomorrow'), value: [tomorrow, tomorrow] as [Dayjs, Dayjs] },
        { label: t('filters.date.thisWeekend', 'This Weekend'), value: [weekendStart, weekendEnd] as [Dayjs, Dayjs] },
        { label: t('filters.date.next7Days', 'Next 7 Days'), value: [today, next7End] as [Dayjs, Dayjs] },
        { label: t('filters.date.next30Days', 'Next 30 Days'), value: [today, next30End] as [Dayjs, Dayjs] },
    ];

    // Default: next 7 days interval on initial load (but don't override if URL has dates)
    useEffect(() => {
        const hasDateInUrl = typeof window !== 'undefined' && (searchParams.get('startDate') || searchParams.get('endDate'));
        if (!hasDateInUrl) {
            setDateRange([today, next7End]);
        }
        // We intentionally run this only once on mount to avoid overwriting user input
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyPreset = (range: [Dayjs, Dayjs]) => {
        setDateRange(range);
        setPickerOpen(false);
    };

    const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
    const endDate = dateRange?.[1]?.format('YYYY-MM-DD');


    const { events, isLoading, error, loadMore, isFetchingMore, hasMore, facets } = useEvents(
        searchQuery,
        selectedTypes,
        onlyFree,
        startDate,
        endDate,
        selectedVenues,
        selectedBarrios,
        selectedTags,
    );

    // Derive displayed tag options from facets (only tags present in results), while preserving selected tags
    const selectedTagsKey = useMemo(() => (selectedTags && selectedTags.length ? selectedTags.join(',') : ''), [selectedTags]);
    useEffect(() => {
        const tagFacet = facets?.tag;
        if (!tagFacet) {
            // Legacy backend or facets not available: show all tags
            setTagOptions(allTagOptions);
            return;
        }
        const allowed = new Set(Object.entries(tagFacet)
            .filter(([, cnt]) => (cnt ?? 0) > 0)
            .map(([slug]) => slug));
        // Base options from facets
        const filtered = allTagOptions.filter(opt => allowed.has(opt.value));
        // Ensure selected tags are visible even if their count is 0 (so user can remove/see them)
        const missingSelected = selectedTags.filter(slug => !filtered.some(o => o.value === slug));
        const additions: Option[] = missingSelected.map(slug => ({ value: slug, label: tagNameBySlug[slug] ?? slug }));
        const combined = [...filtered, ...additions];
        // Sort by label for stable UX
        combined.sort((a, b) => a.label.localeCompare(b.label));
        setTagOptions(combined);
    }, [facets, allTagOptions, selectedTags, selectedTagsKey, tagNameBySlug]);

    // Stable key for types to avoid complex expression in deps
    const typesKey = useMemo(() => (types && types.length ? types.map(t => t.slug).join(',') : ''), [types]);

    // Compute per-type disabled chips using facets from /events (no extra requests)
    useEffect(() => {
        // Only apply when a date range is set; otherwise keep all enabled per requirement
        if (!startDate || !endDate || types.length === 0) {
            // Clear disabled state only when date range is not applied or no types available
            setDisabledTypeSlugs(new Set());
            return;
        }
        const typeFacet = facets?.type;
        if (!typeFacet) {
            // Keep previous disabled set while facets are loading to avoid flicker
            return;
        }
        const disabled = new Set<string>();
        for (const tp of types) {
            const cnt = typeFacet[tp.slug] ?? 0;
            if (cnt === 0) disabled.add(tp.slug);
        }
        setDisabledTypeSlugs(disabled);
    }, [startDate, endDate, onlyFree, typesKey, facets, types]);

    // Highlight & scroll into view if highlight param is present
    const highlightId = searchParams.get('highlight');
    const hasHighlight = !!highlightId;

    useEffect(() => {
        if (!hasHighlight) return;
        // Wait a tick to allow DOM to render
        const id = `evt-${highlightId}`;
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [hasHighlight, highlightId, events?.length]);


    // Mobile pickers for Lugares/Barrios/Etiquetas
    type PickerKind = 'venues' | 'barrios' | 'tags' | null;
    const [mobilePicker, setMobilePicker] = useState<{
        kind: PickerKind;
        temp: string[];
        query: string;
    }>({ kind: null, temp: [], query: '' });

    // Unified config for mobile pickers to avoid duplication
    const pickerData: Record<'venues' | 'barrios' | 'tags', {
        getValues: () => string[];
        setValues: (vals: string[]) => void;
        options: Option[];
        title: string;
    }> = {
        venues: { getValues: () => selectedVenues, setValues: setSelectedVenues, options: venueOptions, title: t('filters.places') },
        barrios: { getValues: () => selectedBarrios, setValues: setSelectedBarrios, options: barrioOptions, title: t('filters.barrios') },
        tags: { getValues: () => selectedTags, setValues: setSelectedTags, options: tagOptions, title: t('filters.tags') },
    };

    const openMobilePicker = (kind: Exclude<PickerKind, null>) => {
        // Seed temp with current selection
        const seed = pickerData[kind].getValues();
        setMobilePicker({ kind, temp: [...seed], query: '' });
    };

    const toggleTemp = (value: string) => {
        setMobilePicker((prev) => {
            const exists = prev.temp.includes(value);
            const next = exists ? prev.temp.filter(v => v !== value) : [...prev.temp, value];
            return { ...prev, temp: next };
        });
    };

    const applyMobilePicker = () => {
        if (mobilePicker.kind) {
            pickerData[mobilePicker.kind].setValues(mobilePicker.temp);
        }
        setMobilePicker({ kind: null, temp: [], query: '' });
    };

    const cancelMobilePicker = () => setMobilePicker({ kind: null, temp: [], query: '' });

    // Body scroll lock for overlays (sheet or mobile pickers)
    useEffect(() => {
        const anyOverlay = sheetOpen || mobilePicker.kind !== null;
        if (anyOverlay) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
        return;
    }, [sheetOpen, mobilePicker.kind]);

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

    // Load event types via shared dictionaries loader (same as venues/barrios)
    // Types are now cached per-locale together with other dictionaries
    // and converted to the {slug,name} shape expected by PrimaryFilters
    // to keep component props unchanged.
    // Handled in the dictionaries effect below.

    // Load dictionaries (venues, barrios, tags, event types) once per locale
    useEffect(() => {
        let cancelled = false;
        loadDictionaries(locale).then(dict => {
            if (cancelled) return;
            setAllVenueOptions(dict.venues);
            setAllBarrioOptions(dict.barrios);
            setAllTagOptions(dict.tags);
            // Convert eventTypes DictOption[] to PrimaryFilters shape
            const mappedTypes = (dict.eventTypes || []).map(o => ({ slug: o.value, name: o.label }));
            setTypes(mappedTypes);
            setEventTypeMap(dict.eventTypeMap || {});
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [locale]);

    // Venues & Barrios options are derived from /events facets using preloaded dictionaries (no network calls).
    // Search is label-only and handled inline in the mobile picker, and by AntD's filterOption on desktop.

    // Build venue options from facets using preloaded dictionaries (no network calls)
    const selectedVenuesKey = useMemo(() => (selectedVenues && selectedVenues.length ? selectedVenues.join(',') : ''), [selectedVenues]);
    useEffect(() => {
        const venueFacet = facets?.venue;
        if (!venueFacet) {
            setVenueOptions([]);
            return;
        }
        const allowed = new Set<string>(
            Object.entries(venueFacet)
                .filter(([, cnt]) => (cnt ?? 0) > 0)
                .map(([slug]) => slug)
        );
        // Ensure selected venues are included even if count is 0
        selectedVenues.forEach(slug => allowed.add(slug));
        // Filter from dictionary-loaded options
        const base = allVenueOptions.filter(o => allowed.has(o.value));
        const sorted = [...base].sort((a, b) => a.label.localeCompare(b.label));
        setVenueOptions(sorted);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facets, selectedVenuesKey, allVenueOptions]);

    // Build barrio options from facets using preloaded dictionaries (no network calls)
    const selectedBarriosKey = useMemo(() => (selectedBarrios && selectedBarrios.length ? selectedBarrios.join(',') : ''), [selectedBarrios]);
    useEffect(() => {
        const barrioFacet = facets?.barrio;
        if (!barrioFacet) {
            setBarrioOptions([]);
            return;
        }
        const allowed = new Set<string>(
            Object.entries(barrioFacet)
                .filter(([, cnt]) => (cnt ?? 0) > 0)
                .map(([slug]) => slug)
        );
        // Ensure selected barrios are included even if count is 0
        selectedBarrios.forEach(slug => allowed.add(slug));
        const base = allBarrioOptions.filter(o => allowed.has(o.value));
        const sorted = [...base].sort((a, b) => a.label.localeCompare(b.label));
        setBarrioOptions(sorted);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facets, selectedBarriosKey, allBarrioOptions]);


    const heroRef = React.useRef<HTMLDivElement>(null);

    if (error) {
        return (
            <div className="max-w-3xl mx-auto p-4">
                <Alert
                    type="error"
                    showIcon
                    title={t('events.backendDown.title')}
                    description={
                        <span>
                            {t('events.backendDown.message')}
                            {' '}
                            <Link href="/contact" className="underline">{t('events.backendDown.contact')}</Link>.
                        </span>
                    }
                />
            </div>
        );
    }

    // Primary filters: types + only free
    const renderPrimaryFilters = () => (
        <>
            <PrimaryFilters
                types={types}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                onlyFree={onlyFree}
                setOnlyFree={(v: boolean) => setOnlyFree(v)}
                t={t}
                disabledTypeSlugs={dateRange ? disabledTypeSlugs : undefined}
            />
        </>
    );

    // Advanced filters: date range, venues, barrios, tags
    // Split into helpers so we can order differently on mobile
    const renderDateRangeFilter = () => (
        <DateRangeFilter
            dateRange={dateRange}
            setDateRange={setDateRange}
            onlyFree={onlyFree}
            setOnlyFree={(v: boolean) => setOnlyFree(v)}
            t={t}
            pickerOpen={pickerOpen}
            setPickerOpen={setPickerOpen}
            presets={presets}
            applyPreset={applyPreset}
        />
    );


    // AntD filter: search by label only (aligns with mobile picker behavior)
    const antdFilterOption = (input: string, option?: { label?: string; value?: string }) => {
        const text = `${option?.label ?? ''}`.toLowerCase();
        return text.includes(input.toLowerCase());
    };
    // Disable tags input when there are no tag options available
    const isTagsDisabled = tagOptions.length === 0;

    const renderAdvancedFiltersRest = () => (
        <>
            <FilterRow
                label={t('filters.places')}
                placeholder={t('filters.places')}
                prompt={t('filters.placesPrompt')}
                options={venueOptions}
                values={selectedVenues}
                setValues={setSelectedVenues}
                getLabel={getVenueLabel}
                open={openMobilePicker}
                kind="venues"
                t={t}
                filterOption={antdFilterOption}
                ariaLabel={t('filters.places')}
            />

            <FilterRow
                label={t('filters.barrios')}
                placeholder={t('filters.barrios')}
                prompt={t('filters.barriosPrompt')}
                options={barrioOptions}
                values={selectedBarrios}
                setValues={setSelectedBarrios}
                getLabel={getBarrioLabel}
                open={openMobilePicker}
                kind="barrios"
                t={t}
                filterOption={antdFilterOption}
                ariaLabel={t('filters.barrios')}
            />

            <FilterRow
                label={t('filters.tags')}
                placeholder={t('filters.tags')}
                prompt={t('filters.tagsPrompt')}
                options={tagOptions}
                values={selectedTags}
                setValues={setSelectedTags}
                getLabel={getTagLabel}
                open={openMobilePicker}
                kind="tags"
                t={t}
                filterOption={antdFilterOption}
                disabled={isTagsDisabled}
                ariaLabel={t('filters.tags')}
            />
        </>
    );


    // Helpers to render filters content (shared by mobile sheet)
    // Mobile order must be: Date range → Types (chips) → Only free → Lugares → Barrios → Etiquetas
    const renderFiltersContent = () => (
        <>
            {renderDateRangeFilter()}
            {renderPrimaryFilters()}
            {renderAdvancedFiltersRest()}
        </>
    );

    const clearAll = () => {
        setSelectedTypes([]);
        setOnlyFree(false);
        setDateRange(null);
        setSelectedVenues([]);
        setSelectedBarrios([]);
        setSelectedTags([]);
        // If a mobile picker is open with temporary selections, reset it to avoid re-applying cleared values
        setMobilePicker({ kind: null, temp: [], query: '' });
        // Also clear all filter-related query params from URL so UI and state stay in sync
        try {
            const params = new URLSearchParams(searchParams);
            let changed = false;
            const keys = [
                'query', 'highlight',
                // filters
                'tags', 'venues', 'venue', 'barrios', 'barrio', 'types', 'type', 'free', 'startDate', 'endDate',
            ];
            for (const k of keys) {
                if (params.has(k)) { params.delete(k); changed = true; }
            }
            if (changed) {
                const qs = params.toString();
                router.replace(qs ? `${pathname}?${qs}` : pathname);
            }
        } catch {
            // no-op
        }
    };

    // Format date chip label according to priority rules (Hoy / Mañana / Este finde / numeric DD/MM/YYYY)
    const formatDateChip = (): string => {
        if (!dateRange) return '';
        const [s, e] = dateRange;
        const same = (a: Dayjs, b: Dayjs) => a.isSame(b, 'day');
        if (same(s, today) && same(e, today)) return t('filters.date.today', 'Today');
        if (same(s, tomorrow) && same(e, tomorrow)) return t('filters.date.tomorrow', 'Tomorrow');
        if (same(s, weekendStart) && same(e, weekendEnd)) return t('filters.date.thisWeekend', 'This Weekend');
        if (same(s, e)) return s.format('DD/MM/YYYY');
        return `${s.format('DD/MM/YYYY')} – ${e.format('DD/MM/YYYY')}`;
    };


    // Build prioritized chips: Date, Gratis, then individual Type, Barrio (zona), Venue (lugar) and Tag (etiqueta) chips (no grouping). Show max 2, append +N if more.

    const chipCandidates: { key: string; label: string; onClear: () => void }[] = [];
    if (dateRange) chipCandidates.push({ key: 'date', label: formatDateChip(), onClear: () => setDateRange(null) });
    if (onlyFree) chipCandidates.push({ key: 'free', label: t('events.free'), onClear: () => setOnlyFree(false) });
    // One chip per selected type (no grouping)
    if (selectedTypes.length) {
        selectedTypes.forEach((slug) => {
            const name = eventTypeMap[slug] ?? slug;
            chipCandidates.push({ key: `type-${slug}` , label: name, onClear: () => setSelectedTypes(prev => prev.filter(t => t !== slug)) });
        });
    }
    // One chip per selected barrio (no grouping)
    if (selectedBarrios.length) {
        selectedBarrios.forEach((slug) => {
            const name = getBarrioLabel(slug);
            chipCandidates.push({ key: `barrio-${slug}`, label: name, onClear: () => setSelectedBarrios(prev => prev.filter(b => b !== slug)) });
        });
    }
    // One chip per selected venue (no grouping)
    if (selectedVenues.length) {
        selectedVenues.forEach((slug) => {
            const name = getVenueLabel(slug);
            chipCandidates.push({ key: `venue-${slug}`, label: name, onClear: () => setSelectedVenues(prev => prev.filter(v => v !== slug)) });
        });
    }
    // One chip per selected tag (no grouping)
    if (selectedTags.length) {
        selectedTags.forEach((slug) => {
            const name = getTagLabel(slug);
            chipCandidates.push({ key: `tag-${slug}`, label: name, onClear: () => setSelectedTags(prev => prev.filter(tg => tg !== slug)) });
        });
    }

    const prioritizedChips = chipCandidates.slice(0, 2);

    // Badge count should reflect all active groups
    const badgeCount = (
        (dateRange ? 1 : 0) +
        (onlyFree ? 1 : 0) +
        (selectedTypes.length ? 1 : 0) +
        (selectedVenues.length ? 1 : 0) +
        (selectedBarrios.length ? 1 : 0) +
        (selectedTags.length ? 1 : 0) +
        (searchQuery ? 1 : 0)
    );

    // Desktop badge should count only advanced filters hidden behind the toggle

    return (
        <div className="events-list-container">
            <StickySearchBar heroRef={heroRef} />
            <div ref={heroRef}>
                <HeroSearch />
            </div>

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
                        {/* Append +N más if more than 2 filters are active overall */}
                        {(() => {
                            const totalActive =
                                (dateRange ? 1 : 0) +
                                (onlyFree ? 1 : 0) +
                                selectedTypes.length +
                                selectedBarrios.length +
                                selectedVenues.length +
                                selectedTags.length +
                                (searchQuery ? 1 : 0);
                            const extra = totalActive - prioritizedChips.length;
                            return totalActive > 2 ? (
                                <span className="text-sm text-gray-600">+{extra} {t('filters.moreCountSuffix')}</span>
                            ) : null;
                        })()}
                        <button className="chip-clear-all" onClick={clearAll}>{t('filters.clearAll')}</button>
                    </div>
                )}
                <button type="button" className="filters-btn btn-entradas-theme" onClick={() => setSheetOpen(true)}>
                    <svg className="filters-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
                    </svg>
                    Filters
                </button>
            </div>

            {/* Desktop filters container with expand/collapse */}
            <div className="hidden sm:block mb-4 filters-block">
                {/* Primary always visible */}
                {renderPrimaryFilters()}

                {renderDateRangeFilter()}

                {/* Summary row + separator: always render separator; show content only when filters are active */}
                {badgeCount > 0 ? (
                    <div className="filters-summary" role="status" aria-live="polite">
                        <span>{badgeCount === 1 ? `1 ${t('filters.active.singular')}` : `${badgeCount} ${t('filters.active.plural')}`}</span>
                        <button type="button" className="filters-summary-clear" onClick={clearAll}>{t('filters.clearAll')}</button>
                    </div>
                ) : (
                    <div className="filters-summary" aria-hidden="true" />
                )}

                {/* Toggle to expand/collapse advanced */}
                <div className="mb-1">
                    <button
                        type="button"
                        aria-expanded={desktopExpanded}
                        aria-label={desktopExpanded ? 'Hide advanced filters' : 'Show advanced filters'}
                        className="filters-toggle"
                        onClick={() => setDesktopExpanded((v) => !v)}
                    >
                        <span>{desktopExpanded ? t('filters.fewerFilters') : t('filters.moreFilters')}</span>
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
                        {renderAdvancedFiltersRest()}
                    </div>
                )}
            </div>

            {/* Mobile: Bottom sheet */}
            {sheetOpen && (
                <>
                    <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
                    <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Filters">
                        <div className="sheet-header">
                            <span className="sheet-title">Filters</span>
                            <button className="sheet-close" onClick={() => setSheetOpen(false)} aria-label="Close">✕</button>
                        </div>
                        <div className="sheet-content">
                            {renderFiltersContent()}
                        </div>
                        <div className="sheet-footer">
                            <button className="sheet-apply" onClick={() => setSheetOpen(false)}>{t('filters.done')}</button>
                            <button className="sheet-reset" onClick={clearAll}>{t('filters.clearAll')}</button>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile full-screen picker for Venues/Barrios/Tags */}
            {mobilePicker.kind && (
                <div className="mobile-picker-overlay" role="dialog" aria-modal="true">
                    <div className="mobile-picker-header">
                        <div className="mobile-picker-titlebar">
                            <div className="font-semibold">
                                {mobilePicker.kind ? pickerData[mobilePicker.kind].title : ''}
                            </div>
                            <button
                                type="button"
                                className="sheet-close"
                                aria-label="Close"
                                onClick={cancelMobilePicker}
                            >
                                ✕
                            </button>
                        </div>
                        <input
                            className="mobile-picker-search"
                            type="search"
                            value={mobilePicker.query}
                            placeholder={`${t('filters.search')}...`}
                            // Search by label only for all kinds; we filter the rendered list below.
                            onChange={(e) => {
                                const q = e.target.value;
                                setMobilePicker(prev => ({ ...prev, query: q }));
                            }}
                        />
                    </div>
                    <div className="mobile-picker-content">
                        <ul className="mobile-picker-list">
                            {(mobilePicker.kind ? pickerData[mobilePicker.kind].options : [])
                                .filter(opt => opt.label.toLowerCase().includes(mobilePicker.query.toLowerCase()))
                                .map(opt => (
                                <li
                                    key={opt.value}
                                    className={`mobile-picker-item ${mobilePicker.temp.includes(opt.value) ? 'selected' : ''}`}
                                    onClick={() => toggleTemp(opt.value)}
                                >
                                    <span className="label">{opt.label}</span>
                                    {mobilePicker.temp.includes(opt.value) && (
                                        <svg
                                            className="check"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="sheet-footer">
                        <button type="button" className="sheet-apply" onClick={applyMobilePicker}>{t('filters.done')}</button>
                    </div>
                </div>
            )}


                <div className="events-grid">
                {/* ✅ Show skeleton while first request is loading */}
                {isLoading && (
                    <>
                        <Skeleton/>
                        <Skeleton/>
                    </>
                )}

                {/* ✅ Empty state: show polite message when no events match filters */}
                {!isLoading && !isFetchingMore && (!events || events.length === 0) && (
                    <div className="empty-state-card">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{t('events.empty.title')}</h3>
                        <p className="text-gray-600 mb-4">{t('events.empty.subtitle')}</p>
                        <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300" onClick={clearAll}>
                            {t('events.empty.clearFilters')}
                        </button>
                    </div>
                )}

                {events?.map((event: CulturalEvent) => (
                    <EventCard key={event.id} event={event} dictionaries={{ eventTypeMap: eventTypeMap, tagMap: tagNameBySlug }} />
                ))}
                <div ref={lastEventRef} />

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
