'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useI18n } from '@/i18n/I18nProvider';
import React from 'react';

export default function Search({ placeholder }: { placeholder?: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const { t } = useI18n();

    // Local state mirrors the input, but stays in sync with URL changes too
    const [value, setValue] = React.useState<string>(searchParams.get('query')?.toString() ?? '');

    // When URL search params change (e.g., via Clear All), sync input value
    React.useEffect(() => {
        const urlValue = searchParams.get('query')?.toString() ?? '';
        setValue(urlValue);
    }, [searchParams]);

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

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
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const params = new URLSearchParams(searchParams);
                            if (value) {
                                params.set('query', value);
                            } else {
                                params.delete('query');
                            }
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
                        replace(`${pathname}?${params.toString()}`);
                    }}
                >
                    {t('filters.search')}
                </button>
            </div>
        </div>
    );
}
