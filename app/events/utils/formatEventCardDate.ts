import dayjs from 'dayjs';
import { CulturalEvent, EventDate } from '@/lib/definitions';

// Helper: format date for event cards per product rules.
// - Single-day event: "Jueves 15/01 · 17:30" (weekday localized and capitalized, DD/MM, optional time HH:mm)
// - Multi-day or missing endDate: "Desde jueves 15/01" (weekday localized and lowercased)
export function formatEventCardDate(event: CulturalEvent | EventDate, sinceWord: string): string {
  const d = dayjs(event.date);
  if (!d.isValid()) return String(event.date ?? '');

  const weekday = d.format('dddd'); // localized weekday name
  const datePart = d.format('DD/MM');
  const sinceText = `${sinceWord} ${weekday} ${datePart}`;

  // Determine if we should show "Desde ..."
  const hasEnd = !!event.endDate;
  const e = hasEnd ? dayjs(event.endDate as string) : null;
  const isMultiDay = hasEnd && e!.isValid() && !e!.isSame(d, 'day');
  if (!hasEnd || isMultiDay) {
    return sinceText;
  }

  // Single-day event formatting
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const timePart = event.startTime ? event.startTime.slice(0, 5) : null;
  return timePart ? `${weekdayCap} ${datePart} · ${timePart}` : `${weekdayCap} ${datePart}`;
}
