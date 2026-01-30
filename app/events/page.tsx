'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEvents } from '@/lib/useEvents';
import { loadDictionaries } from '@/lib/dictionaries';
import React, {useEffect, useRef, useState, Suspense, useMemo} from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { CulturalEvent } from '@/lib/definitions';
import HeroSearch from "@/ui/HeroSearch";
import Skeleton from "@/ui/skeleton";
import {API_URL, SHOW_EVENT_DETAILS_LINK} from "@/lib/config";
import { useSession } from 'next-auth/react';
import { useI18n } from '@/i18n/I18nProvider';
import { Alert, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

type EventTypeOption = { slug: string; name: string };

type Option = { label: string; value: string };

import { formatEventCardDate } from './utils/formatEventCardDate';

import { ReportProblemModal, type ReportModalHandle } from './components/ReportProblemModal';
import { ConfirmHideModal, type HideModalHandle } from './components/ConfirmHideModal';
import PrimaryFilters from './components/PrimaryFilters';
import DateRangeFilter from './components/DateRangeFilter';
import AdvancedFiltersRest from './components/AdvancedFiltersRest';

function EventsListPageInner() {
    const { data: session } = useSession();
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

    // Kebab menu state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Imperative modal instance
    const reportModalRef = useRef<ReportModalHandle>(null);
        const hideModalRef = useRef<HideModalHandle>(null);

    // Close kebab menu on outside click or when pressing Escape
    useEffect(() => {
        if (typeof window === 'undefined') return;
        function handlePointerDown(e: MouseEvent | TouchEvent) {
            if (!openMenuId) return;
            const target = e.target as Node | null;
            const menu = document.getElementById(`actions-menu-${openMenuId}`);
            const btn = document.querySelector(`button[aria-controls="actions-menu-${openMenuId}"]`);
            // If click is inside the menu or on its trigger button, ignore
            if (menu && target && menu.contains(target)) return;
            if (btn && target && btn.contains(target)) return;
            setOpenMenuId(null);
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (!openMenuId) return;
            if (e.key === 'Escape') {
                setOpenMenuId(null);
            }
        }
        document.addEventListener('mousedown', handlePointerDown, true);
        document.addEventListener('touchstart', handlePointerDown, true);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown, true);
            document.removeEventListener('touchstart', handlePointerDown, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [openMenuId]);

    // Antd message API (avoid static calls to consume context)
    const [messageApi, messageContextHolder] = message.useMessage();

    // Helper utilities to avoid duplicated logic across collapsed/expanded blocks
    const getFirstPaymentUrl = React.useCallback((ev: CulturalEvent): string => {
        const chs = ev.paymentChannels || [];
        for (const ch of chs) {
            const url = ch?.url?.trim();
            if (url) return url.startsWith('http') ? url : `https://${url}`;
        }
        return '';
    }, []);

    const hasTicketsButton = React.useCallback((ev: CulturalEvent): boolean => {
        const isPaid = ev.isFree === false;
        return isPaid && !!getFirstPaymentUrl(ev);
    }, [getFirstPaymentUrl]);

    // URL sync helpers
    const initializedFromUrlRef = useRef(false);

    // Maps for quick label lookup (must be declared before any early returns)
    const typeNameBySlug = useMemo(() => Object.fromEntries(types.map(t => [t.slug, t.name])), [types]);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, selectedTypes.join(',')]);

    // Keep selectedVenues in sync if URL changes externally (e.g., via Search suggestions)
    useEffect(() => {
        const raw = searchParams.get('venues') ?? searchParams.get('venue');
        const nextVenues = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const nextKey = nextVenues.join(',');
        const currKey = selectedVenues.join(',');
        if (nextKey !== currKey) {
            setSelectedVenues(nextVenues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, selectedVenues.join(',')]);

    // Keep selectedBarrios in sync if URL changes externally (e.g., via Search suggestions)
    useEffect(() => {
        const raw = searchParams.get('barrios') ?? searchParams.get('barrio');
        const nextBarrios = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const nextKey = nextBarrios.join(',');
        const currKey = selectedBarrios.join(',');
        if (nextKey !== currKey) {
            setSelectedBarrios(nextBarrios);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, selectedBarrios.join(',')]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, selectedTags.join(',')]);

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


    const { events, isLoading, error, loadMore, isFetchingMore, hasMore, refresh, facets } = useEvents(
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
    }, [facets, allTagOptions, selectedTagsKey, tagNameBySlug]);

    // Stable key for types to avoid complex expression in deps
    const typesKey = useMemo(() => (types && types.length ? types.map(t => t.slug).join(',') : ''), [types]);

    // Compute per-type disabled chips using facets from /events (no extra requests)
    useEffect(() => {
        // Only apply when a date range is set; otherwise keep all enabled per requirement
        if (!startDate || !endDate || types.length === 0) {
            setDisabledTypeSlugs(new Set());
            return;
        }
        const typeFacet = facets?.type;
        if (!typeFacet) {
            // If facets are missing (e.g., legacy backend), do not disable anything
            setDisabledTypeSlugs(new Set());
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
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', apply);
        } else if ('addListener' in mq) {
            // Fallback for older browsers
            (mq as MediaQueryList).addListener(apply);
        }
        return () => {
            if (typeof mq.removeEventListener === 'function') {
                mq.removeEventListener('change', apply);
            } else if ('removeListener' in mq) {
                (mq as MediaQueryList).removeListener(apply);
            }
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
        // Ensure the tag exists in allTagOptions so it shows up with localized label when available
        setAllTagOptions((prev) => (prev.some(o => o.value === tag) ? prev : [...prev, { label: tag, value: tag }]));
    };

    // Note: Previously, clicking event type or barrio on the card added filters.
    // Per UX update, these are now plain text, so handlers are removed.

    // Mobile pickers for Lugares/Barrios/Etiquetas
    type PickerKind = 'venues' | 'barrios' | 'tags' | null;
    const [mobilePicker, setMobilePicker] = useState<{
        kind: PickerKind;
        temp: string[];
        query: string;
    }>({ kind: null, temp: [], query: '' });

    const openMobilePicker = (kind: Exclude<PickerKind, null>) => {
        // Seed temp with current selection
        const seed = kind === 'venues' ? selectedVenues : kind === 'barrios' ? selectedBarrios : selectedTags;
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
        if (mobilePicker.kind === 'venues') setSelectedVenues(mobilePicker.temp);
        if (mobilePicker.kind === 'barrios') setSelectedBarrios(mobilePicker.temp);
        if (mobilePicker.kind === 'tags') setSelectedTags(mobilePicker.temp);
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


    const renderAdvancedFiltersRest = () => (
        <AdvancedFiltersRest
            t={t}
            // Venues
            venueOptions={venueOptions}
            selectedVenues={selectedVenues}
            setSelectedVenues={setSelectedVenues}
            openMobilePicker={openMobilePicker}
            getVenueLabel={getVenueLabel}
            // Barrios
            barrioOptions={barrioOptions}
            selectedBarrios={selectedBarrios}
            setSelectedBarrios={setSelectedBarrios}
            getBarrioLabel={getBarrioLabel}
            // Tags
            tagOptions={tagOptions}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            getTagLabel={getTagLabel}
        />
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
    if (onlyFree) chipCandidates.push({ key: 'free', label: 'Gratis', onClear: () => setOnlyFree(false) });
    // One chip per selected type (no grouping)
    if (selectedTypes.length) {
        selectedTypes.forEach((slug) => {
            const name = typeNameBySlug[slug] ?? slug;
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
                                {mobilePicker.kind === 'venues' ? t('filters.places') : mobilePicker.kind === 'barrios' ? t('filters.barrios') : t('filters.tags')}
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
                            {(mobilePicker.kind === 'venues' ? venueOptions : mobilePicker.kind === 'barrios' ? barrioOptions : tagOptions)
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

            {messageContextHolder}
            {/* Report Problem Modal instance */}
            <ReportProblemModal ref={reportModalRef} locale={locale} />
                        <ConfirmHideModal ref={hideModalRef} onHidden={() => refresh()} />

            {/* Report modal handled by ReportProblemModal component */}

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

                {events?.map((event: CulturalEvent, index) => (
                    <div
                        key={event.id}
                        id={`evt-${event.id}`}
                        className={`event-card ${searchParams.get('highlight') === event.id ? 'event-card-highlight' : ''}`}
                        ref={index === events.length - 1 ? lastEventRef : null} // ✅ Attach observer to last event
                    >
                        <div className="event-image-wrapper">
                            {event.isFree && (
                                <span className="badge-free" aria-label={t('events.free')}>
                                    {t('events.free')}
                                </span>
                            )}
                            {/* Share button */}
                            <button
                                type="button"
                                className="event-share-btn"
                                aria-label={t('events.share', 'Share event')}
                                title={t('events.share', 'Share event')}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const url = (() => {
                                            const loc = typeof window !== 'undefined' ? window.location : null;
                                            const origin = loc ? loc.origin : '';
                                            const params = new URLSearchParams();

                                            // Always highlight this specific event
                                            params.set('highlight', event.id);

                                            // Include title as the search query
                                            if (event.name) {
                                                params.set('query', event.name);
                                            }

                                            // Include venue if we have a slug (canonical for filters)
                                            const venueSlug = event.venue?.slug;
                                            if (venueSlug) {
                                                params.set('venues', venueSlug);
                                            }

                                            // Include proper date(s)
                                            const start = dayjs(event.date).isValid() ? dayjs(event.date).format('YYYY-MM-DD') : '';
                                            const end = event.endDate && dayjs(event.endDate).isValid()
                                                ? dayjs(event.endDate).format('YYYY-MM-DD')
                                                : start;
                                            if (start) params.set('startDate', start);
                                            if (end) params.set('endDate', end);

                                            const qs = params.toString();
                                            const path = `${pathname}${qs ? `?${qs}` : ''}`;
                                            return origin ? `${origin}${path}` : path;
                                        })();
                                        if (navigator.share) {
                                            await navigator.share({ url, title: event.name });
                                        } else if (navigator.clipboard && navigator.clipboard.writeText) {
                                            await navigator.clipboard.writeText(url);
                                            alert(t('events.linkCopied', 'Link copied to clipboard'));
                                        } else {
                                            // Fallback: prompt for manual copy
                                            prompt(t('events.copyLink', 'Copy this link'), url);
                                        }
                                    } catch (err) {
                                        console.error('Share failed', err);
                                        alert(t('events.shareFailed', 'Could not share the link'));
                                    }
                                }}
                            >
                                <svg
                                    className="event-share-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    {/* Icon: Share-2 from Lucide */}
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                </svg>
                            </button>
                            <Image
                                src={event.imageExists
                                    ? `/events/${event.id}/image`
                                    : '/events_images/placeholder.png'}
                                width={400}
                                height={400}
                                className="event-image"
                                alt={event.imageExists ? t('events.imageAlt') : t('events.imagePlaceholderAlt')}
                            />
                        </div>
                        <div className="event-details">
                            <h2 className="event-title">{locale === 'en' ? (event.nameEn || event.name) : event.name}</h2>
                            <div className="event-divider" aria-hidden="true" />

                            <div className="event-meta justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span className="event-meta-text">
                                        {formatEventCardDate(event, t('events.since'))}
                                        {!event.endDate && (
                                            <>
                                                <br />
                                                <span className="event-meta-note">{t('events.durationNotProvided')}</span>
                                            </>
                                        )}
                                    </span>
                                </div>

                                {/* Kebab menu aligned to the right of the date line */}
                                <div className="relative inline-block text-left">
                                    <button
                                        type="button"
                                        className="event-kebab-btn"
                                        aria-haspopup="menu"
                                        aria-expanded={openMenuId === event.id}
                                        aria-controls={`actions-menu-${event.id}`}
                                        onClick={() => setOpenMenuId(prev => prev === event.id ? null : event.id)}
                                        title={t ? t('filters.moreFilters') : 'More'}
                                    >
                                        <span aria-hidden="true">⋮</span>
                                        <span className="sr-only">More actions</span>
                                    </button>
                                    {openMenuId === event.id && (
                                        <div
                                            id={`actions-menu-${event.id}`}
                                            role="menu"
                                            tabIndex={-1}
                                            className="absolute right-0 mt-2 w-64 origin-top-right bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                                        >
                                            <a
                                                role="menuitem"
                                                className="block w-full px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                href={(function() {
                                                    const title = event.name || '';
                                                    const venueName = event.venue?.name || '';
                                                    const detailsParts: string[] = [];
                                                    if (event.instagramId) {
                                                        detailsParts.push(`IG: https://www.instagram.com/p/${event.instagramId}`);
                                                    }
                                                    const details = detailsParts.join('\n');
                                                    const start = dayjs(event.date);
                                                    const hasTime = !!event.startTime && /^\d{2}:\d{2}/.test(event.startTime);
                                                    let startStr = '';
                                                    let endStr = '';
                                                    if (start.isValid()) {
                                                        if (hasTime) {
                                                            const startTime = dayjs(`${start.format('YYYY-MM-DD')}T${event.startTime!.slice(0,5)}:00`);
                                                            let endTime = startTime.add(2, 'hour');
                                                            if (event.endDate) {
                                                                const e = dayjs(event.endDate as string);
                                                                if (e.isValid()) {
                                                                    endTime = e.endOf('day');
                                                                }
                                                            }
                                                            startStr = startTime.format('YYYYMMDDTHHmmss');
                                                            endStr = endTime.format('YYYYMMDDTHHmmss');
                                                        } else {
                                                            const end = (event.endDate && dayjs(event.endDate as string).isValid()) ? dayjs(event.endDate as string).add(1, 'day') : start.add(1, 'day');
                                                            startStr = start.format('YYYYMMDD');
                                                            endStr = end.format('YYYYMMDD');
                                                        }
                                                    }
                                                    const params = new URLSearchParams({
                                                        action: 'TEMPLATE',
                                                        text: title,
                                                        dates: `${startStr}/${endStr}`,
                                                        location: venueName,
                                                        details,
                                                    });
                                                    return `https://calendar.google.com/calendar/render?${params.toString()}`;
                                                })()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setOpenMenuId(null)}
                                                title={t('events.addToGoogleCalendar')}
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-700"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden="true"
                                                >
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                <span>{t('events.addToGoogleCalendar')}</span>
                                            </a>

                                            <button
                                                type="button"
                                                role="menuitem"
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                onClick={() => { setOpenMenuId(null); reportModalRef.current?.open(event.id); }}
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-700"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                </svg>
                                                <span>{t('events.report.button')}</span>
                                            </button>

                                            {session?.user && (
                                                <>
                                                    <div className="my-1 border-t border-gray-200" role="separator" aria-hidden="true"></div>
                                                    <a
                                                        role="menuitem"
                                                        className="block w-full px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                        href={`/events/${event.id}/edit`}
                                                        onClick={() => setOpenMenuId(null)}
                                                    >
                                                        <svg
                                                            className="w-4 h-4 text-gray-700"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            aria-hidden="true"
                                                        >
                                                            <path d="M12 20h9"></path>
                                                            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                                                        </svg>
                                                        <span>{t('events.edit')}</span>
                                                    </a>

                                                    {event.instagramPostId && (
                                                        <button
                                                            type="button"
                                                            role="menuitem"
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                            onClick={async () => {
                                                                setOpenMenuId(null);
                                                                try {
                                                                    messageApi.loading({ content: t('events.refetch.loading'), key: `refetch-${event.id}` });
                                                                    const resp = await fetch(`${API_URL}/admin/instagram/posts/${event.instagramPostId}/refetch`, {
                                                                        method: 'POST'
                                                                    });
                                                                    if (resp.ok) {
                                                                        messageApi.success({ content: t('events.refetch.success'), key: `refetch-${event.id}` });
                                                                        refresh();
                                                                    } else {
                                                                        messageApi.error({ content: t('events.refetch.error'), key: `refetch-${event.id}` });
                                                                    }
                                                                } catch {
                                                                    messageApi.error({ content: t('events.refetch.error'), key: `refetch-${event.id}` });
                                                                }
                                                            }}
                                                        >
                                                            <svg
                                                                className="w-4 h-4 text-gray-700"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                aria-hidden="true"
                                                            >
                                                                <polyline points="23 4 23 10 17 10"></polyline>
                                                                <polyline points="1 20 1 14 7 14"></polyline>
                                                                <path d="M3.51 9a9 9 0 0114.13-3.36L23 10"></path>
                                                                <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14"></path>
                                                            </svg>
                                                            <span>{t('events.refetch.button')}</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                        onClick={() => { setOpenMenuId(null); hideModalRef.current?.open(event.id); }}
                                                    >
                                                        <svg
                                                            className="w-4 h-4 text-gray-700"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            aria-hidden="true"
                                                        >
                                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                            <line x1="2" y1="2" x2="22" y2="22"></line>
                                                        </svg>
                                                        <span>{t('events.hide.button')}</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="event-meta">
                                <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 10c0 5.523-9 12-9 12S3 15.523 3 10a9 9 0 1118 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span className="event-meta-text">
                                    {event.venue?.name ? (
                                        <a
                                            href={(() => {
                                                const v = event.venue!;
                                                const name = v.name ? `${v.name}, Buenos Aires` : 'Buenos Aires';
                                                if (v.googlePlaceId) {
                                                    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(v.googlePlaceId)}`;
                                                }
                                                if (v.latitude != null && v.longitude != null) {
                                                    return `https://www.google.com/maps/@?api=1&map_action=map&center=${v.latitude},${v.longitude}&zoom=16`;
                                                }
                                                return `https://www.google.com/maps/search/?api=1&map_action=map&query=${encodeURIComponent(name)}`;
                                            })()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="event-link"
                                            title={event.venue.name}
                                        >
                                            {event.venue.name}
                                        </a>
                                    ) : ''}
                                    {event.venue?.barrio?.name && (
                                        <>
                                            {' '}
                                            ·{' '}
                                            <span>{event.venue.barrio.name}</span>
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Event type: show only when collapsed */}
                            {!isCardExpanded(event.id) && (
                                <div className="event-meta">
                                    <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M20.59 13.41L12 21l-9-9V3h9l8.59 8.59z" />
                                        <path d="M7 7h.01" />
                                    </svg>
                                    <span>
                                        {typeNameBySlug[event.type] ?? event.type}
                                    </span>
                                </div>
                            )}

                            {/* Main action (collapsed): same as expanded (Tickets if paid with URL, else Más info) */}
                            {(!isCardExpanded(event.id)) && (() => {
                                const firstPaymentUrl = getFirstPaymentUrl(event);
                                if (hasTicketsButton(event)) {
                                    return (
                                        <div className="event-main-action">
                                            <a
                                                className="event-main-action-btn"
                                                href={firstPaymentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {t('events.mainAction.tickets', 'Entradas')}
                                            </a>
                                        </div>
                                    );
                                }

                                // Otherwise: show "Más info". Prefer Instagram original source; if not available, link to event details.
                                const igUrl = event.instagramId ? `https://www.instagram.com/p/${event.instagramId}` : '';
                                if (igUrl) {
                                    return (
                                        <div className="event-main-action">
                                            <a
                                                className="event-main-action-btn"
                                                href={igUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {t('events.mainAction.moreInfo', 'Sitio oficial')}
                                            </a>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="event-main-action">
                                        <Link href={`/events/${event.id}`} className="event-main-action-btn">
                                            {t('events.mainAction.moreInfo', 'Sitio oficial')}
                                        </Link>
                                    </div>
                                );
                            })()}

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
                                <div id={`event-content-${event.id}`} className="event-expanded">
                                    {/* Type row (moved above description) */}
                                    <div className="event-meta">
                                        <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M20.59 13.41L12 21l-9-9V3h9l8.59 8.59z" />
                                            <path d="M7 7h.01" />
                                        </svg>
                                        <span>
                                            {types.find((ty) => ty.slug === event.type)?.name ?? event.type}
                                        </span>
                                    </div>
                                    <p className="event-description">{locale === 'en' ? (event.descriptionEn || event.description) : event.description}</p>

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


                                    {/* Tickets */}
                                    {(() => {
                                        const chs = event.paymentChannels || [];
                                        if (chs.length === 0) return null;
                                        const isPaid = event.isFree === false;
                                        const urlCount = chs.reduce((acc, ch) => acc + ((ch?.url || '').trim() ? 1 : 0), 0);
                                        // Hide the Tickets row if it's a paid event and there's exactly one URL, since the main button already uses it
                                        if (isPaid && urlCount === 1) return null;
                                        return (
                                            <>
                                                <div className="event-divider" aria-hidden="true" />
                                                <div className="tickets-row flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <p>
                                                    <strong>{t('events.tickets')}</strong>{' '}
                                                    {chs.map((ch, idx) => {
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
                                                                {idx < chs.length - 1 && <span className="hidden sm:inline"> · </span>}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                    </p>
                                                </div>
                                            </>
                                        );
                                    })()}

                                    <div className="event-divider" aria-hidden="true" />
                                    <div className="event-actions relative">
                                        {(() => {
                                            // Show the small "Original source" link only if the main action button is Tickets.
                                            if (hasTicketsButton(event) && event.instagramId) {
                                                return (
                                                    <a
                                                        href={`https://www.instagram.com/p/${event.instagramId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="event-link"
                                                    >
                                                        {t('event.originalSource')}
                                                    </a>
                                                );
                                            }
                                            return <span />;
                                        })()}
                                        {SHOW_EVENT_DETAILS_LINK ? (
                                            <Link href={`/events/${event.id}`} className="event-link">
                                                {t('events.viewDetails')}
                                            </Link>
                                        ) : <span />}
                                    </div>

                                    {/* Main action (expanded, positioned above bottom chevron): Tickets for paid events, default to Original source */}
                                    {(() => {
                                        const firstPaymentUrl = getFirstPaymentUrl(event);
                                        if (hasTicketsButton(event)) {
                                            return (
                                                <div className="event-main-action">
                                                    <a
                                                        className="event-main-action-btn"
                                                        href={firstPaymentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {t('events.mainAction.tickets', 'Entradas')}
                                                    </a>
                                                </div>
                                            );
                                        }

                                        // Otherwise: show "Fuente original/Original source". Prefer Instagram; if not available, link to event details.
                                        const igUrl = event.instagramId ? `https://www.instagram.com/p/${event.instagramId}` : '';
                                        if (igUrl) {
                                            return (
                                                <div className="event-main-action">
                                                    <a
                                                        className="event-main-action-btn"
                                                        href={igUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {t('events.mainAction.moreInfo', 'Sitio oficial')}
                                                    </a>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="event-main-action">
                                                <Link href={`/events/${event.id}`} className="event-main-action-btn">
                                                    {t('events.mainAction.moreInfo', 'Sitio oficial')}
                                                </Link>
                                            </div>
                                        );
                                    })()}

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
