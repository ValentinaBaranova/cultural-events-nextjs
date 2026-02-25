import React from 'react';

export type EventTypeOption = { slug: string; name: string };

type TFunc = (key: string, defaultMessage?: string) => string;

interface PrimaryFiltersProps {
  types: EventTypeOption[];
  selectedTypes: string[];
  setSelectedTypes: (updater: (prev: string[]) => string[] | string[]) => void;
  t: TFunc;
  // When date range is applied, provide a set of disabled type slugs (no events in that date range)
  disabledTypeSlugs?: Set<string>;
}

const PrimaryFilters: React.FC<PrimaryFiltersProps> = ({
  types,
  selectedTypes,
  setSelectedTypes,
  t,
  disabledTypeSlugs,
}) => {
  return (
    <div className="mb-1 mt-2 sm:mt-4">
      <span className="text-sm font-semibold text-muted-foreground mb-2 sm:mb-3 inline-block">{t('filters.types')}</span>
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
              className={`px-3 py-1 sm:py-1 text-sm rounded-full border transition-colors ${
                active
                  ? 'bg-primary-active text-primary-foreground border-brand'
                  : isDisabled
                    ? 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60'
                    : 'bg-muted text-primary-foreground border-border hover:bg-primary-hover'
              }`}
              title={isDisabled ? t('filters.noEventsThisRange', 'No events in selected dates') : undefined}
            >
              {type.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PrimaryFilters;
