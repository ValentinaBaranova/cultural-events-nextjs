"use client";

import React from 'react';
import { Select } from 'antd';

// Local types mirrored from page.tsx to keep this component self-contained
export type Option = { label: string; value: string };
export type TFunc = (key: string, defaultMessage?: string) => string;

export type FilterKind = 'venues' | 'barrios' | 'tags';

export default function FilterRow({
  label,
  placeholder,
  prompt,
  options,
  values,
  setValues,
  getLabel,
  open,
  kind,
  t,
  filterOption,
  disabled,
  ariaLabel,
}: {
  label: string;
  placeholder: string;
  prompt: string;
  options: Option[];
  values: string[];
  setValues: (values: string[]) => void;
  getLabel: (slug: string) => string;
  open: (kind: FilterKind) => void;
  kind: FilterKind;
  t: TFunc;
  filterOption: (input: string, option?: { label?: string; value?: string }) => boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
      <span className="hidden sm:inline text-sm font-medium text-gray-700 mb-1 sm:mb-0 sm:w-32">{label}</span>
      <div className="hidden sm:block">
        <Select
          aria-label={ariaLabel}
          mode="multiple"
          allowClear
          showSearch
          placeholder={placeholder}
          notFoundContent={prompt}
          filterOption={filterOption}
          options={options}
          value={values}
          onChange={(vals) => setValues(vals as string[])}
          style={{ minWidth: 240 }}
          disabled={disabled}
        />
      </div>
      <div className="sm:hidden">
        <button
          type="button"
          className={`filter-trigger w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={() => { if (!disabled) open(kind); }}
          aria-disabled={!!disabled}
          disabled={disabled}
          title={disabled ? t('filters.noTagsThisRange', 'No tags in selected dates') : undefined}
        >
          <span>{label}</span>
          {values.length > 0 && <span className="count">{values.length}</span>}
        </button>
        {values.length > 0 && (
          <div className="chips-row mt-2">
            {values.slice(0, 2).map(v => (
              <span key={v} className="chip">
                {getLabel(v)}
                <button aria-label={`Remove ${label} ${getLabel(v)}`} className="chip-x" onClick={() => setValues(values.filter(x => x !== v))}>×</button>
              </span>
            ))}
            {values.length > 2 && (
              <span className="text-sm text-gray-600">+{values.length - 2} {t('filters.moreCountSuffix')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
