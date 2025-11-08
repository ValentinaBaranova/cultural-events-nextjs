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
        <div className="flex justify-start mb-4">
            <label htmlFor="search" className="sr-only">
                {t('search.label')}
            </label>
            <input
                id="search"
                className="w-full max-w-[300px] rounded-md border border-gray-300 py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder ?? t('search.placeholder')}
                onChange={(e) => {
                    handleSearch(e.target.value);
                }}
                defaultValue={searchParams.get('query')?.toString()}
            />
        </div>
    );
}
