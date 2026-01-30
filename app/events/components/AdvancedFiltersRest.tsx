import React from 'react';
import { Select } from 'antd';

export type Option = { label: string; value: string };

type TFunc = (key: string, defaultMessage?: string) => string;

interface AdvancedFiltersRestProps {
  t: TFunc;
  // Venues
  venueOptions: Option[];
  venueLoading: boolean;
  selectedVenues: string[];
  setSelectedVenues: (values: string[]) => void;
  searchVenues: (q: string) => void;
  openMobilePicker: (kind: 'venues' | 'barrios' | 'tags') => void;
  getVenueLabel: (slug: string) => string;
  // Barrios
  barrioOptions: Option[];
  barrioLoading: boolean;
  selectedBarrios: string[];
  setSelectedBarrios: (values: string[]) => void;
  searchBarrios: (q: string) => void;
  barrioNameBySlug: Record<string, string>;
  // Tags
  tagOptions: Option[];
  selectedTags: string[];
  setSelectedTags: (values: string[]) => void;
  getTagLabel: (slug: string) => string;
}

const AdvancedFiltersRest: React.FC<AdvancedFiltersRestProps> = ({
  t,
  venueOptions,
  venueLoading,
  selectedVenues,
  setSelectedVenues,
  searchVenues,
  openMobilePicker,
  getVenueLabel,
  barrioOptions,
  barrioLoading,
  selectedBarrios,
  setSelectedBarrios,
  searchBarrios,
  barrioNameBySlug,
  tagOptions,
  selectedTags,
  setSelectedTags,
  getTagLabel,
}) => {
  // Disable tags input when there are no tag options available
  const isTagsDisabled = tagOptions.length === 0;
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <span className="hidden sm:inline text-sm font-medium text-gray-700 mb-1 sm:mb-0 sm:w-32">{t('filters.places')}</span>
        {/* Desktop >= sm: keep Select. Mobile: trigger opens full-screen picker */}
        <div className="hidden sm:block">
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
        <div className="sm:hidden">
          <button type="button" className="filter-trigger w-full" onClick={() => openMobilePicker('venues')}>
            <span>{t('filters.places')}</span>
            {selectedVenues.length > 0 && <span className="count">{selectedVenues.length}</span>}
          </button>
          {selectedVenues.length > 0 && (
            <div className="chips-row mt-2">
              {selectedVenues.slice(0, 2).map(v => (
                <span key={v} className="chip">
                  {getVenueLabel(v)}
                  <button aria-label={`Remove venue ${getVenueLabel(v)}`} className="chip-x" onClick={() => setSelectedVenues(selectedVenues.filter(x => x !== v))}>×</button>
                </span>
              ))}
              {selectedVenues.length > 2 && (
                <span className="text-sm text-gray-600">+{selectedVenues.length - 2} {t('filters.moreCountSuffix')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <span className="hidden sm:inline text-sm font-medium text-gray-700 mb-1 sm:mb-0 sm:w-32">{t('filters.barrios')}</span>
        <div className="hidden sm:block">
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
        <div className="sm:hidden">
          <button type="button" className="filter-trigger w-full" onClick={() => openMobilePicker('barrios')}>
            <span>{t('filters.barrios')}</span>
            {selectedBarrios.length > 0 && <span className="count">{selectedBarrios.length}</span>}
          </button>
          {selectedBarrios.length > 0 && (
            <div className="chips-row mt-2">
              {selectedBarrios.slice(0, 2).map(b => (
                <span key={b} className="chip">
                  {barrioNameBySlug[b] ?? b}
                  <button aria-label={`Remove barrio ${barrioNameBySlug[b] ?? b}`} className="chip-x" onClick={() => setSelectedBarrios(selectedBarrios.filter(x => x !== b))}>×</button>
                </span>
              ))}
              {selectedBarrios.length > 2 && (
                <span className="text-sm text-gray-600">+{selectedBarrios.length - 2} {t('filters.moreCountSuffix')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <span className="hidden sm:inline text-sm font-medium text-gray-700 mb-1 sm:mb-0 sm:w-32">{t('filters.tags')}</span>
        <div className="hidden sm:block">
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
            disabled={isTagsDisabled}
          />
        </div>
        <div className="sm:hidden">
          <button
            type="button"
            className={`filter-trigger w-full ${isTagsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => { if (!isTagsDisabled) openMobilePicker('tags'); }}
            aria-disabled={isTagsDisabled}
            disabled={isTagsDisabled}
            title={isTagsDisabled ? t('filters.noTagsThisRange', 'No tags in selected dates') : undefined}
          >
            <span>{t('filters.tags')}</span>
            {selectedTags.length > 0 && <span className="count">{selectedTags.length}</span>}
          </button>
          {selectedTags.length > 0 && (
            <div className="chips-row mt-2">
              {selectedTags.slice(0, 2).map(tag => (
                <span key={tag} className="chip">
                  {getTagLabel(tag)}
                  <button aria-label={`Remove tag ${getTagLabel(tag)}`} className="chip-x" onClick={() => setSelectedTags(selectedTags.filter(x => x !== tag))}>×</button>
                </span>
              ))}
              {selectedTags.length > 2 && (
                <span className="chip">+{selectedTags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdvancedFiltersRest;
