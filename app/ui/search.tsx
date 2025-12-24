'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useI18n } from '@/i18n/I18nProvider';

export default function Search({ placeholder }: { placeholder?: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const { t } = useI18n();

    const handleSearch = useDebouncedCallback((term) => {
        console.log(`Searching... ${term}`);

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
                    className="w-full rounded-lg border border-border bg-card py-3 pl-11 pr-4 text-base outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder={placeholder ?? t('search.placeholder')}
                    onChange={(e) => {
                        handleSearch(e.target.value);
                    }}
                    defaultValue={searchParams.get('query')?.toString()}
                />
            </div>
        </div>
    );
}
