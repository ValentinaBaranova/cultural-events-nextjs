import React from 'react';
import { Checkbox } from 'antd';

export type EventTypeOption = { slug: string; name: string };

type TFunc = (key: string, defaultMessage?: string) => string;

interface PrimaryFiltersProps {
  types: EventTypeOption[];
  selectedTypes: string[];
  setSelectedTypes: (updater: (prev: string[]) => string[] | string[]) => void;
  onlyFree: boolean;
  setOnlyFree: (value: boolean) => void;
  t: TFunc;
  // When date range is applied, provide a set of disabled type slugs (no events in that date range)
  disabledTypeSlugs?: Set<string>;
}

const PrimaryFilters: React.FC<PrimaryFiltersProps> = ({
  types,
  selectedTypes,
  setSelectedTypes,
  onlyFree,
  setOnlyFree,
  t,
  disabledTypeSlugs,
}) => {
  return (
    <div className="mb-1 sm:mt-4">
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const active = selectedTypes.includes(type.slug);
          const isDisabled = !!disabledTypeSlugs && disabledTypeSlugs.has(type.slug) && !active;
          return (
            <button
              key={type.slug}
              type="button"
              onClick={() => {
                if (isDisabled) return; // don't allow toggling disabled chip
                setSelectedTypes((prev) =>
                  prev.includes(type.slug)
                    ? prev.filter((t) => t !== type.slug)
                    : [...prev, type.slug]
                );
              }}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                active
                  ? 'bg-[#ddd6fe] text-[#111827] border-[#8b5cf6]'
                  : isDisabled
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                    : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
              }`}
              title={isDisabled ? t('filters.noEventsThisRange', 'No events in selected dates') : undefined}
            >
              {type.name}
            </button>
          );
        })}
      </div>
      <div className="mt-4 sm:hidden">
        <Checkbox
          className="only-free-checkbox"
          checked={onlyFree}
          onChange={(e) => setOnlyFree(e.target.checked)}
        >
          {t('filters.onlyFree')}
        </Checkbox>
      </div>
    </div>
  );
};

export default PrimaryFilters;
