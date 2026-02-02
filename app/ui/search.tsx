'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useI18n } from '@/i18n/I18nProvider';
import React from 'react';
import { API_URL } from '@/lib/config';

// Simple types
type TypeItem = { slug: string; name: string };
type SimpleItem = { slug: string; name: string };

type EventItem = { id: string; name: string };

export default function Search({ placeholder, inputId }: { placeholder?: string; inputId?: string }) {
    const effectiveId = inputId ?? 'search';
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const { t, locale } = useI18n();

    // Local state mirrors the input, but stays in sync with URL changes too
    const [value, setValue] = React.useState<string>(searchParams.get('query')?.toString() ?? '');

    // Suggestions state
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [typeItems, setTypeItems] = React.useState<TypeItem[]>([]);
    const [venueItems, setVenueItems] = React.useState<SimpleItem[]>([]);
    const [barrioItems, setBarrioItems] = React.useState<SimpleItem[]>([]);
    const [eventItems, setEventItems] = React.useState<EventItem[]>([]);
    const [tagItems, setTagItems] = React.useState<SimpleItem[]>([]);
    // Track focus for gating suggestions on mobile when requested
    const [isFocused, setIsFocused] = React.useState(false);

    // Cache all types once (localized)
    const allTypesRef = React.useRef<TypeItem[] | null>(null);
    // Cache all tags once (localized)
    const allTagsRef = React.useRef<SimpleItem[] | null>(null);
    // Cache all venues once (localized)
    const allVenuesRef = React.useRef<SimpleItem[] | null>(null);
    // Cache all barrios once (localized)
    const allBarriosRef = React.useRef<SimpleItem[] | null>(null);

    // Track the last term we intentionally pushed to the URL from this component
    const lastSentRef = React.useRef<string | null>(null);
    const inputElRef = React.useRef<HTMLInputElement | null>(null);
    const prevValueRef = React.useRef<string>('');

    // Helper: clear suggestions/loading and close panel
    const resetSuggestions = () => {
        setOpen(false);
        setLoading(false);
        setTypeItems([]);
        setVenueItems([]);
        setBarrioItems([]);
        setEventItems([]);
        setTagItems([]);
    };

    const exitSearchMode = () => {
        try {
            // Blur input to exit IME/keyboard and close any focus-dependent UI
            inputElRef.current?.blur();
        } catch {}
        // Ensure suggestions panel is closed and loading stops
        resetSuggestions();
        // Notify any listeners (e.g., StickySearchBar) to hide
        try {
            window.dispatchEvent(new CustomEvent('app:search-navigate'));
        } catch {}
    };

    // When URL search params change (e.g., via Clear All), sync input value
    // but avoid overwriting the user's in-flight typing caused by our own debounced replace.
    React.useEffect(() => {
        const urlValue = searchParams.get('query')?.toString() ?? '';
        if (lastSentRef.current !== urlValue) {
            setValue(urlValue);
            prevValueRef.current = urlValue;
        }
        // If the URL reflects what we sent, we can clear the marker
        if (lastSentRef.current === urlValue) {
            lastSentRef.current = null;
        }
    }, [searchParams]);

    // Load types, tags, venues, barrios once per locale
    React.useEffect(() => {
        allTypesRef.current = null;
        allTagsRef.current = null;
        allVenuesRef.current = null;
        allBarriosRef.current = null;
        (async () => {
            try {
                const [typesRes, tagsRes, venuesRes, barriosRes] = await Promise.all([
                    fetch(`${API_URL}/event-types?locale=${encodeURIComponent(locale)}`),
                    fetch(`${API_URL}/tags?locale=${encodeURIComponent(locale)}`),
                    fetch(`${API_URL}/places?locale=${encodeURIComponent(locale)}`),
                    fetch(`${API_URL}/barrios?locale=${encodeURIComponent(locale)}`),
                ]);
                if (typesRes.ok) {
                    const data: TypeItem[] = await typesRes.json();
                    allTypesRef.current = Array.isArray(data) ? data : [];
                } else {
                    allTypesRef.current = [];
                }
                if (tagsRes.ok) {
                    const data: { slug: string; name: string }[] = await tagsRes.json();
                    allTagsRef.current = Array.isArray(data) ? data : [];
                } else {
                    allTagsRef.current = [];
                }
                if (venuesRes.ok) {
                    const data: { slug: string; name: string }[] = await venuesRes.json();
                    allVenuesRef.current = Array.isArray(data) ? data : [];
                } else {
                    allVenuesRef.current = [];
                }
                if (barriosRes.ok) {
                    const data: { slug: string; name: string }[] = await barriosRes.json();
                    allBarriosRef.current = Array.isArray(data) ? data : [];
                } else {
                    allBarriosRef.current = [];
                }
            } catch {
                allTypesRef.current = [];
                allTagsRef.current = [];
                allVenuesRef.current = [];
                allBarriosRef.current = [];
            }
        })();
    }, [locale]);

    // Close suggestions when sticky bar hides (only for the sticky instance)
    React.useEffect(() => {
        if (inputId !== 'mobile-sticky-search') return;
        const onStickyHide = () => {
            // Ensure suggestions are closed
            resetSuggestions();
            try { inputElRef.current?.blur(); } catch {}
        };
        window.addEventListener('app:sticky-hide', onStickyHide as EventListener);
        return () => window.removeEventListener('app:sticky-hide', onStickyHide as EventListener);
    }, [inputId]);

    // Sync clearing across hero and sticky: when one clears, clear the other too
    React.useEffect(() => {
        type SearchClearedDetail = { sourceId: string };
        const onCleared = (ev: Event) => {
            const src = (ev as CustomEvent<SearchClearedDetail>).detail?.sourceId;
            if (!src) return;
            if (src === effectiveId) return; // ignore own event
            // Clear local state without causing URL changes or refocus
            setValue('');
            prevValueRef.current = '';
            resetSuggestions();
        };
        window.addEventListener('app:search-cleared', onCleared as EventListener);
        return () => window.removeEventListener('app:search-cleared', onCleared as EventListener);
    }, [effectiveId]);

    // Debounced suggestions loader
    const loadSuggestions = useDebouncedCallback(async (term: string) => {
        const q = term.trim();
        if (!q) {
            resetSuggestions();
            return;
        }
        setLoading(true);
        try {
            // Filter types locally
            const types = (allTypesRef.current || []).filter(ti =>
                ti.name.toLowerCase().includes(q.toLowerCase())
            ).slice(0, 6);
            setTypeItems(types);

            // Filter tags locally
            const tagsLocal = (allTagsRef.current || []).filter(tg =>
                tg.name.toLowerCase().includes(q.toLowerCase())
            ).slice(0, 6);
            setTagItems(tagsLocal);

            // Filter venues locally
            const venuesLocal = (allVenuesRef.current || []).filter(v =>
                v.name.toLowerCase().includes(q.toLowerCase())
            ).slice(0, 6);
            setVenueItems(venuesLocal);

            // Filter barrios locally
            const barriosLocal = (allBarriosRef.current || []).filter(b =>
                b.name.toLowerCase().includes(q.toLowerCase())
            ).slice(0, 6);
            setBarrioItems(barriosLocal);

            // Fetch events only on non-mobile to avoid backend calls during typing on mobile
            const isMobileViewport = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 639px)').matches;
            if (!isMobileViewport) {
                const eventsRes = await fetch(`${API_URL}/events?page=1&limit=6&title=${encodeURIComponent(q)}`);
                if (eventsRes.ok) {
                    const raw = await eventsRes.json();
                    type EventApiItem = { id: string; name: string };
                    type EventApiResponse = EventApiItem[] | { items: EventApiItem[] };
                    const itemsRaw: EventApiResponse = raw as EventApiResponse;
                    const items: EventApiItem[] = Array.isArray(itemsRaw)
                        ? itemsRaw
                        : (Array.isArray(itemsRaw.items) ? itemsRaw.items : []);
                    const mapped = items.map((e) => ({ id: e.id, name: e.name }));
                    setEventItems(mapped);
                } else {
                    setEventItems([]);
                }
            } else {
                // On mobile, do not fetch events during typing; leave list empty for submit-only behavior
                setEventItems([]);
            }
        } catch {
            setVenueItems([]);
            setBarrioItems([]);
            setEventItems([]);
        } finally {
            setLoading(false);
        }
    }, 250);

    // Update URL query as user types on desktop/tablet only; on mobile we keep submit-only behavior.
    const handleSearch = useDebouncedCallback((term: string) => {
        // Mobile submit-only: typing should not trigger backend search (URL change)
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 639px)').matches) {
            return;
        }
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        lastSentRef.current = term;
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    // Update suggestions when value changes; require input focus to show suggestions in all viewports
    React.useEffect(() => {
        const hasQuery = !!value.trim();
        // Suggestions should only open when there is a query AND the input is focused
        const shouldSuggest = hasQuery && isFocused;
        setOpen(shouldSuggest);

        if (!shouldSuggest) {
            // If we shouldn't suggest now, clear loading and optionally clear lists to avoid stale UI
            setLoading(false);
            setTypeItems([]);
            setVenueItems([]);
            setBarrioItems([]);
            setEventItems([]);
            setTagItems([]);
            return; // Do not call loader
        }

        // Set loading immediately for non-empty queries to avoid brief "no results" flash
        setLoading(true);
        loadSuggestions(value);
        return () => loadSuggestions.cancel();
    }, [value, loadSuggestions, isFocused]);

    const applyParamAndGo = (updater: (p: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams);
        updater(params);
        // Exit search mode UI
        exitSearchMode();
        // Clear input when applying a filter from suggestions
        setValue('');
        params.delete('query');
        replace(`${pathname}?${params.toString()}`);
    };

    const onPickType = (slug: string) => {
        applyParamAndGo((params) => {
            params.set('types', slug);
        });
    };
    const onPickVenue = (slug: string) => {
        applyParamAndGo((params) => {
            params.set('venues', slug);
        });
    };
    const onPickBarrio = (slug: string) => {
        applyParamAndGo((params) => {
            params.set('barrios', slug);
        });
    };
    const onPickTag = (slug: string) => {
        applyParamAndGo((params) => {
            params.set('tags', slug);
        });
    };
    const onPickEvent = (title: string) => {
        // For events, we keep query to search by title
        const params = new URLSearchParams(searchParams);
        params.set('query', title);
        // Exit UI and update value prior to navigation
        exitSearchMode();
        setValue(title);
        lastSentRef.current = title;
        replace(`${pathname}?${params.toString()}`);
    };

    // Shared clear handler to sync and refresh results
    const clearAndNavigate = () => {
        // Clear locally and suggestions
        setValue('');
        prevValueRef.current = '';
        resetSuggestions();
        // Broadcast to clear the other instance
        try {
            const detail: { sourceId: string } = { sourceId: effectiveId };
            window.dispatchEvent(new CustomEvent('app:search-cleared', { detail }));
        } catch {}
        // Update URL to remove query and trigger backend refresh
        const params = new URLSearchParams(searchParams);
        params.delete('query');
        lastSentRef.current = '';
        // Exit search mode UI (blur input, close suggestions, hide sticky)
        exitSearchMode();
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="mb-4">
            <label htmlFor={effectiveId} className="sr-only">
                {t('search.label')}
            </label>
            <div className="relative">
                {/* Left search icon */}
                <svg
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    {/* Heroicons outline: magnifying-glass */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                    id={effectiveId}
                    ref={inputElRef}
                    className="w-full rounded-lg border border-border bg-card py-3 pl-11 pr-10 sm:pr-36 text-base outline-none focus:ring-2 focus:ring-violet-500 shadow-sm text-muted-foreground placeholder:text-muted-foreground"
                    placeholder={placeholder ?? t('search.placeholder')}
                    onChange={(e) => {
                        const term = e.target.value;
                        // Detect transition from non-empty to empty to broadcast clear
                        const was = prevValueRef.current;
                        prevValueRef.current = term;
                        setValue(term);
                        if (was && !term) {
                            try {
                                window.dispatchEvent(
                                    new CustomEvent<{ sourceId: string }>(
                                        'app:search-cleared',
                                        { detail: { sourceId: effectiveId } } as CustomEventInit<{ sourceId: string }>
                                    )
                                );
                            } catch {}
                        }
                        handleSearch(term);
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                        setOpen(!!value.trim());
                    }}
                    onBlur={() => {
                        setIsFocused(false);
                        setTimeout(() => setOpen(false), 150);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const params = new URLSearchParams(searchParams);
                            if (value) {
                                params.set('query', value);
                            } else {
                                params.delete('query');
                            }
                            lastSentRef.current = value;
                            exitSearchMode();
                            replace(`${pathname}?${params.toString()}`);
                        }
                    }}
                    value={value}
                />
                {/* Mobile clear icon for both hero and sticky search */}
                {value && (
                    <button
                        type="button"
                        aria-label={t('common.clear', 'Limpiar')}
                        className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full focus:outline-none text-muted-foreground hover:text-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clearAndNavigate}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                            <path d="M15 9 9 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="m9 9 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
                {/* Desktop clear icon (shown on sm+), positioned left to the Search button */}
                {value && (
                    <button
                        type="button"
                        aria-label={t('common.clear', 'Limpiar')}
                        className="hidden sm:inline-flex absolute right-24 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full focus:outline-none text-muted-foreground hover:text-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clearAndNavigate}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                            <path d="M15 9 9 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="m9 9 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
                {/* Right aligned Search button on the same line (hidden on mobile) */}
                <button
                    type="button"
                    aria-label={t('filters.search')}
                    className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none transition-colors btn-entradas-theme"
                    onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        if (value) {
                            params.set('query', value);
                        } else {
                            params.delete('query');
                        }
                        lastSentRef.current = value;
                        exitSearchMode();
                        replace(`${pathname}?${params.toString()}`);
                    }}
                >
                    {t('filters.search')}
                </button>

                {/* Suggestions dropdown */}
                {open && (
                    <div className="absolute z-20 mt-2 w-full border border-border bg-card shadow-lg">
                        <div className="max-h-80 overflow-auto py-2">
                            {/* Free text search action */}
                            {value.trim().length >= 2 && (
                                <div className="py-1">
                                    <ul className="divide-y divide-border">
                                        <li>
                                            <button
                                                type="button"
                                                className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    const term = value.trim();
                                                    const params = new URLSearchParams(searchParams);
                                                    if (term) {
                                                        params.set('query', term);
                                                    } else {
                                                        params.delete('query');
                                                    }
                                                    lastSentRef.current = term;
                                                    // Exit search UI (blur, close suggestions, hide sticky)
                                                    exitSearchMode();
                                                    setValue(term);
                                                    replace(`${pathname}?${params.toString()}`);
                                                }}
                                            >
                                                {t('filters.search')} “{value.trim()}...”
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                            {/* Grouped suggestions with one separator between groups */}
                            {(() => {
                                const groups = [
                                    {
                                        key: 'types',
                                        node: (
                                            <SuggestionGroup
                                                key="types"
                                                title={t('search.group.types')}
                                                items={typeItems.map(it => ({ key: it.slug, label: it.name }))}
                                                onClick={(k) => onPickType(k)}
                                                isFilterGroup
                                            />
                                        ),
                                        hasItems: typeItems.length > 0,
                                    },
                                    {
                                        key: 'venues',
                                        node: (
                                            <SuggestionGroup
                                                key="venues"
                                                title={t('search.group.venues')}
                                                items={venueItems.map(it => ({ key: it.slug, label: it.name }))}
                                                onClick={(k) => onPickVenue(k)}
                                                isFilterGroup
                                            />
                                        ),
                                        hasItems: venueItems.length > 0,
                                    },
                                    {
                                        key: 'barrios',
                                        node: (
                                            <SuggestionGroup
                                                key="barrios"
                                                title={t('search.group.barrios')}
                                                items={barrioItems.map(it => ({ key: it.slug, label: it.name }))}
                                                onClick={(k) => onPickBarrio(k)}
                                                isFilterGroup
                                            />
                                        ),
                                        hasItems: barrioItems.length > 0,
                                    },
                                    {
                                        key: 'tags',
                                        node: (
                                            <SuggestionGroup
                                                key="tags"
                                                title={t('search.group.tags')}
                                                items={tagItems.map(it => ({ key: it.slug, label: it.name }))}
                                                onClick={(k) => onPickTag(k)}
                                                isFilterGroup
                                            />
                                        ),
                                        hasItems: tagItems.length > 0,
                                    },
                                    {
                                        key: 'events',
                                        node: (
                                            <SuggestionGroup
                                                key="events"
                                                title={t('search.group.events')}
                                                items={eventItems.map(it => ({ key: it.id, label: it.name }))}
                                                onClick={(_, label) => onPickEvent(label)}
                                            />
                                        ),
                                        hasItems: eventItems.length > 0,
                                    },
                                ];
                                const nonEmpty = groups.filter(g => g.hasItems);
                                if (!nonEmpty.length) return null;
                                return (
                                    <div>
                                        {nonEmpty.map((g, idx) => (
                                            <React.Fragment key={g.key}>
                                                {idx > 0 && <div className="my-2 border-t border-border" />}
                                                {g.node}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                );
                            })()}
                            {!loading && !typeItems.length && !venueItems.length && !barrioItems.length && !tagItems.length && !eventItems.length && (
                                <div className="px-4 py-2 text-sm text-muted-foreground">{t('search.suggestions.noResults')}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SuggestionGroup({ title, items, onClick, isFilterGroup = false }: { title: string; items: { key: string; label: string }[]; onClick: (key: string, label: string) => void; isFilterGroup?: boolean }) {
    if (!items.length) return null;
    return (
        <div className="py-1">
            <div className="px-4 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">{title}</div>
            <ul>
                {items.map((it) => (
                    <li key={it.key} className="px-2">
                        <button
                            type="button"
                            className={`w-full text-left px-2 py-2 text-sm transition-colors ${isFilterGroup ? 'hover:bg-muted cursor-pointer' : 'hover:bg-muted'}` }
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onClick(it.key, it.label)}
                        >
                            {it.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
