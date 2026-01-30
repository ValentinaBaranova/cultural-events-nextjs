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

export default function Search({ placeholder }: { placeholder?: string }) {
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

    // Cache all types once (localized)
    const allTypesRef = React.useRef<TypeItem[] | null>(null);
    // Cache all tags once (localized)
    const allTagsRef = React.useRef<SimpleItem[] | null>(null);

    // Track the last term we intentionally pushed to the URL from this component
    const lastSentRef = React.useRef<string | null>(null);

    // When URL search params change (e.g., via Clear All), sync input value
    // but avoid overwriting the user's in-flight typing caused by our own debounced replace.
    React.useEffect(() => {
        const urlValue = searchParams.get('query')?.toString() ?? '';
        if (lastSentRef.current !== urlValue) {
            setValue(urlValue);
        }
        // If the URL reflects what we sent, we can clear the marker
        if (lastSentRef.current === urlValue) {
            lastSentRef.current = null;
        }
    }, [searchParams]);

    // Load types once per locale
    React.useEffect(() => {
        allTypesRef.current = null;
        allTagsRef.current = null;
        (async () => {
            try {
                const [typesRes, tagsRes] = await Promise.all([
                    fetch(`${API_URL}/event-types?locale=${encodeURIComponent(locale)}`),
                    fetch(`${API_URL}/tags?locale=${encodeURIComponent(locale)}`),
                ]);
                if (typesRes.ok) {
                    const data: TypeItem[] = await typesRes.json();
                    allTypesRef.current = data || [];
                }
                if (tagsRes.ok) {
                    const data: { slug: string; name: string }[] = await tagsRes.json();
                    allTagsRef.current = Array.isArray(data) ? data : [];
                }
            } catch {
                // ignore
            }
        })();
    }, [locale]);

    // Debounced suggestions loader
    const loadSuggestions = useDebouncedCallback(async (term: string) => {
        const q = term.trim();
        if (!q) {
            setTypeItems([]);
            setVenueItems([]);
            setBarrioItems([]);
            setEventItems([]);
            setTagItems([]);
            setLoading(false);
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

            // Parallel fetch venues, barrios, events
            const [venuesRes, barriosRes, eventsRes] = await Promise.all([
                fetch(`${API_URL}/places/suggest?q=${encodeURIComponent(q)}&limit=6`),
                fetch(`${API_URL}/barrios/suggest?q=${encodeURIComponent(q)}&limit=6`),
                fetch(`${API_URL}/events?page=1&limit=6&title=${encodeURIComponent(q)}`),
            ]);

            if (venuesRes.ok) {
                const data: { slug: string; name: string }[] = await venuesRes.json();
                setVenueItems(Array.isArray(data) ? data : []);
            } else {
                setVenueItems([]);
            }
            if (barriosRes.ok) {
                const data: { slug: string; name: string }[] = await barriosRes.json();
                setBarrioItems(Array.isArray(data) ? data : []);
            } else {
                setBarrioItems([]);
            }
            if (eventsRes.ok) {
                const raw = await eventsRes.json();
                const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
                type EventApiItem = { id: string; name: string };
                const safeItems: EventApiItem[] = Array.isArray(items)
                    ? (items as EventApiItem[])
                    : [];
                const mapped = safeItems.map((e) => ({ id: e.id, name: e.name }));
                setEventItems(mapped);
            } else {
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

    // Update URL query as user types (existing behavior)
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        lastSentRef.current = term;
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    // Update suggestions when value changes
    React.useEffect(() => {
        const hasQuery = !!value.trim();
        setOpen(hasQuery);
        // Set loading immediately for non-empty queries to avoid brief "no results" flash
        setLoading(hasQuery);
        loadSuggestions(value);
        return () => loadSuggestions.cancel();
    }, [value, loadSuggestions]);

    const applyParamAndGo = (updater: (p: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams);
        updater(params);
        // Close panel and clear input when applying a filter
        setOpen(false);
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
        setOpen(false);
        setValue(title);
        lastSentRef.current = title;
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="mb-4">
            <label htmlFor="search" className="sr-only">
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
                    id="search"
                    className="w-full rounded-lg border border-border bg-card py-3 pl-11 pr-28 text-base outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                    placeholder={placeholder ?? t('search.placeholder')}
                    onChange={(e) => {
                        const term = e.target.value;
                        setValue(term);
                        handleSearch(term);
                    }}
                    onFocus={() => setOpen(!!value.trim())}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const params = new URLSearchParams(searchParams);
                            if (value) {
                                params.set('query', value);
                            } else {
                                params.delete('query');
                            }
                            lastSentRef.current = value;
                            replace(`${pathname}?${params.toString()}`);
                        }
                    }}
                    value={value}
                />
                {/* Right aligned Search button on the same line */}
                <button
                    type="button"
                    aria-label={t('filters.search')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none transition-colors btn-entradas-theme"
                    onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        if (value) {
                            params.set('query', value);
                        } else {
                            params.delete('query');
                        }
                        lastSentRef.current = value;
                        replace(`${pathname}?${params.toString()}`);
                    }}
                >
                    {t('filters.search')}
                </button>

                {/* Suggestions dropdown */}
                {open && (
                    <div className="absolute z-20 mt-2 w-full rounded-md border border-border bg-card shadow-lg">
                        <div className="max-h-80 overflow-auto py-2">
                            {/* Free text search action */}
                            {value.trim().length >= 2 && (
                                <div className="py-1">
                                    <ul className="divide-y divide-border">
                                        <li>
                                            <button
                                                type="button"
                                                className="w-full text-left px-4 py-2 hover:bg-muted rounded-sm text-sm"
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
                                                    setOpen(false);
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
                            className={`w-full text-left px-2 py-2 text-sm transition-colors ${isFilterGroup ? 'hover:bg-muted rounded-sm cursor-pointer' : 'hover:bg-muted'}` }
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
