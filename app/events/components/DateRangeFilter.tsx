import React from 'react';
import { DatePicker, Checkbox } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

type TFunc = (key: string, defaultMessage?: string) => string;

interface Preset {
  label: string;
  value: [Dayjs, Dayjs];
}

interface DateRangeFilterProps {
  dateRange: [Dayjs, Dayjs] | null;
  setDateRange: (value: [Dayjs, Dayjs] | null) => void;
  onlyFree: boolean;
  setOnlyFree: (value: boolean) => void;
  t: TFunc;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  presets: Preset[];
  applyPreset: (range: [Dayjs, Dayjs]) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  setDateRange,
  onlyFree,
  setOnlyFree,
  t,
  pickerOpen,
  setPickerOpen,
  presets,
  applyPreset,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 sm:mt-4">
      <span className="hidden sm:inline text-sm font-medium text-gray-700 mb-1 sm:mb-0">{t('filters.dateRange')}</span>
      <div className="flex items-center w-full sm:w-auto sm:flex-1">
        <DatePicker.RangePicker
          classNames={{ popup: { root: "mobile-range-picker" } }}
          value={dateRange ?? undefined}
          onChange={(values) => setDateRange((values as [Dayjs, Dayjs] | null) ?? null)}
          allowClear={{
            clearIcon: (
              <span className="text-muted-foreground hover:text-foreground" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M15 9 9 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m9 9 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            ),
          }}
          format="DD/MM/YYYY"
          separator=" - "
          inputReadOnly
          placement="bottomLeft"
          getPopupContainer={(trigger) => trigger?.parentElement || document.body}
          className="w-full sm:w-72"
          size="large"
          open={pickerOpen}
          onOpenChange={(nextOpen) => {
            const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
            if (isMobile) {
              // Ignore unintended close events on mobile; keep it open until user completes a range or picks a preset
              if (nextOpen) {
                setPickerOpen(true);
              }
              return;
            }
            setPickerOpen(nextOpen);
          }}
          disabledDate={(current) => !!current && current.isBefore(dayjs().startOf('day'))}
          panelRender={(panelNode) => (
            <div>
              <div className="flex flex-wrap gap-2 px-3 pt-3 pb-2 border-b border-gray-200">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.value)}
                    className="px-2.5 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {panelNode}
              <div className="px-3 pb-3 pt-2 border-t border-gray-200 sm:hidden flex justify-end">
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {t('filters.done', 'Done')}
                </button>
              </div>
            </div>
          )}
        />
        <div className="hidden sm:block ml-10">
          <Checkbox className="only-free-checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)}>
            {t('filters.onlyFree')}
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
