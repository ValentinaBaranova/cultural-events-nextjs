import React from 'react';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

type TFunc = (key: string, defaultMessage?: string) => string;

interface Preset {
  label: string;
  value: [Dayjs, Dayjs];
}

interface DateRangeFilterProps {
  dateRange: [Dayjs, Dayjs] | null;
  setDateRange: (value: [Dayjs, Dayjs] | null) => void;
  internalDateRange: [Dayjs, Dayjs] | null;
  setInternalDateRange: (value: [Dayjs, Dayjs] | null) => void;
  t: TFunc;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  presets: Preset[];
  applyPreset: (range: [Dayjs, Dayjs]) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  setDateRange,
  internalDateRange,
  setInternalDateRange,
  t,
  pickerOpen,
  setPickerOpen,
  presets,
  applyPreset,
}) => {
  return (
    <div className="flex flex-col sm:mt-6">
      <span className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">{t('filters.dateRange')}</span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2 items-center order-1">
          {(() => {
            let foundActive = false;
            return presets.map((p) => {
              const matches = dateRange && dateRange[0] && dateRange[1] &&
                dateRange[0].isSame(p.value[0], 'day') &&
                dateRange[1].isSame(p.value[1], 'day');
              
              const isActive = matches && !foundActive;
              if (isActive) foundActive = true;

              return (
                <button
                  key={p.label}
                  type="button"
                  aria-label={p.label}
                  onClick={() => { applyPreset(p.value); setPickerOpen(false); }}
                  className={`px-3 py-1 sm:py-1 text-sm rounded-full border transition-colors ${
                    isActive
                      ? 'bg-[#ddd6fe] text-[#111827] border-[#8b5cf6]'
                      : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            });
          })()}
        </div>
        <div className="flex items-center order-2 relative sm:ml-6">
          <DatePicker.RangePicker
            classNames={{ popup: { root: "mobile-range-picker" } }}
            value={internalDateRange}
            onChange={(values) => {
              const range = values as [Dayjs, Dayjs] | null;
              setInternalDateRange(range);
            }}
            onCalendarChange={(values) => {
              const range = values as [Dayjs, Dayjs] | null;
              setInternalDateRange(range);
            }}
            allowClear={true}
            format="DD/MM/YY"
            separator="-"
            placement="bottomLeft"
            getPopupContainer={(trigger) => trigger?.parentElement || document.body}
            open={pickerOpen}
            onOpenChange={(nextOpen) => {
              const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
              if (isMobile) {
                if (nextOpen) setPickerOpen(true);
                return;
              }
              setPickerOpen(nextOpen);
            }}
            disabledDate={(current) => !!current && current.isBefore(dayjs().startOf('day'))}
            className="w-[250px] sm:w-auto"
            panelRender={(panelNode) => (
              <div>
                {panelNode}
                <div className="px-3 pb-3 pt-2 border-t border-gray-200 flex flex-row-reverse justify-start items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (internalDateRange && internalDateRange[0]) {
                        const range: [Dayjs, Dayjs] = [
                          internalDateRange[0],
                          internalDateRange[1] || internalDateRange[0]
                        ];
                        setDateRange(range);
                      } else {
                        setDateRange(null);
                      }
                      setPickerOpen(false);
                    }}
                    className="sheet-apply !flex-none !py-2 !px-4 !text-sm !rounded-lg"
                  >
                    {t('filters.done')}
                  </button>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
