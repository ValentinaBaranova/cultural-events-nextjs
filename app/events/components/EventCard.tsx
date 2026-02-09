"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import { CulturalEvent } from '@/lib/definitions';
import { SHOW_EVENT_DETAILS_LINK, API_URL } from '@/lib/config';
import { formatEventCardDate } from '../utils/formatEventCardDate';
import { useI18n } from '@/i18n/I18nProvider';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { message } from 'antd';
import { ReportProblemModal, type ReportModalHandle } from './ReportProblemModal';
import { ConfirmHideModal, type HideModalHandle } from './ConfirmHideModal';

export type EventCardProps = {
  event: CulturalEvent;
  dictionaries?: {
    eventTypeMap?: Record<string, string>;
    tagMap?: Record<string, string>;
  };
  // When provided, requesting an expand on desktop should expand all cards
  onRequestExpandAll?: () => void;
  // When provided, requesting a collapse on desktop should collapse all cards
  onRequestCollapseAll?: () => void;
  // Parent-managed expand-all flags
  expandAllActive?: boolean;
  expandAllSignal?: number;
};

function hasTicketsButton(ev: CulturalEvent): boolean {
  const isPaid = ev.isFree === false;
  return isPaid && !!getFirstPaymentUrl(ev);
}

function getFirstPaymentUrl(ev: CulturalEvent): string {
  const chs = ev.paymentChannels || [];
  for (const ch of chs) {
    const url = ch?.url?.trim();
    if (url) return url.startsWith('http') ? url : `https://${url}`;
  }
  return '';
}

export default function EventCard(props: EventCardProps) {
  const { event, expandAllActive, expandAllSignal, onRequestExpandAll, onRequestCollapseAll } = props;

  // i18n and next/navigation hooks
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [messageApi, messageContextHolder] = message.useMessage();
  const reportRef = React.useRef<ReportModalHandle>(null);
  const hideModalRef = React.useRef<HideModalHandle>(null);

  // Local UI state
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // React to parent-managed expand/collapse-all triggers
  const lastParentSignalRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    // Mark that the next state change originates from parent to avoid feedback loops
    lastParentSignalRef.current = true;
    // Parent dictates the target state for desktop when signal bumps
    // On mobile, parent passes expandAllActive=false always, so this won't force open.
    setIsExpanded(!!expandAllActive);
    // Only re-run when a new signal/version comes from parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandAllSignal]);

  // After commit: signal parent for desktop-wide coordination
  const prevExpandedRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    const prev = prevExpandedRef.current;
    // If the latest state change comes from parent, swallow signals to avoid feedback loops
    if (lastParentSignalRef.current) {
      lastParentSignalRef.current = false;
    } else {
      if (!prev && isExpanded) {
        // Expanded now (user interaction)
        onRequestExpandAll?.();
      } else if (prev && !isExpanded) {
        // Collapsed now (user interaction)
        onRequestCollapseAll?.();
      }
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, onRequestExpandAll, onRequestCollapseAll]);

  // Compute highlight locally from URL
  const isHighlighted = searchParams.get('highlight') === event.id;

  // Close kebab menu on outside click or Escape
  React.useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      const menu = document.getElementById(`actions-menu-${event.id}`);
      const btn = document.querySelector(`button[aria-controls="actions-menu-${event.id}"]`);
      if (menu && target && menu.contains(target)) return;
      if (btn && target && btn.contains(target)) return;
      setMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, event.id]);

  const toggleSelf = React.useCallback(() => {
    // Just toggle local state; request to expand-all will be handled in an effect
    setIsExpanded(prev => !prev);
  }, []);

  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const url = (() => {
        const loc = typeof window !== 'undefined' ? window.location : null;
        const origin = loc ? loc.origin : '';
        const params = new URLSearchParams();

        // Always highlight this specific event
        params.set('highlight', event.id);

        // Include title as the search query
        if (event.name) {
          params.set('query', event.name);
        }

        // Include venue if we have a slug (canonical for filters)
        const venueSlug = event.venue?.slug;
        if (venueSlug) {
          params.set('venues', venueSlug);
        }

        // Include proper date(s)
        const start = dayjs(event.date).isValid() ? dayjs(event.date).format('YYYY-MM-DD') : '';
        const end = event.endDate && dayjs(event.endDate).isValid()
          ? dayjs(event.endDate).format('YYYY-MM-DD')
          : start;
        if (start) params.set('startDate', start);
        if (end) params.set('endDate', end);

        const qs = params.toString();
        const path = `${pathname}${qs ? `?${qs}` : ''}`;
        return origin ? `${origin}${path}` : path;
      })();
      if (navigator.share) {
        await navigator.share({ url, title: event.name });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        alert(t('events.linkCopied', 'Link copied to clipboard'));
      } else {
        // Fallback: prompt for manual copy
        prompt(t('events.copyLink', 'Copy this link'), url);
      }
    } catch (err) {
      console.error('Share failed', err);
      alert(t('events.shareFailed', 'Could not share the link'));
    }
  };

  return (
    <>
      {messageContextHolder}
      <ReportProblemModal ref={reportRef} locale={locale} />
      <ConfirmHideModal ref={hideModalRef} onHidden={() => router.refresh()} />
      <div
        id={`evt-${event.id}`}
        className={`event-card ${isHighlighted ? 'event-card-highlight' : ''}`}
      >
      <div className="event-image-wrapper">
        {event.isFree && (
          <span className="badge-free" aria-label={t('events.free')}>
            {t('events.free')}
          </span>
        )}
        {/* Share button */}
        <button
          type="button"
          className="event-share-btn"
          aria-label={t('events.share', 'Share event')}
          title={t('events.share', 'Share event')}
          onClick={share}
        >
          <svg
            className="event-share-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Icon: Paper Plane (Send) */}
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
        <Image
          src={event.imageExists
            ? `/events/${event.id}/image`
            : '/events_images/placeholder.png'}
          width={400}
          height={400}
          className="event-image"
          alt={event.imageExists ? t('events.imageAlt') : t('events.imagePlaceholderAlt')}
        />
      </div>
      <div className="event-details">
        <h2
          className={"event-title" + (isExpanded ? " is-expanded" : "")}
          onClick={() => {
            if (!isExpanded) {
              setIsExpanded(true);
            }
          }}
        >
          {locale === 'en' ? (event.nameEn || event.name) : event.name}
        </h2>
        <div className="event-divider" aria-hidden="true" />

        <div className="event-meta justify-between">
          <div className="flex items-center gap-2">
            <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className="event-meta-text">
              {formatEventCardDate(event, t('events.since'))}
              {!event.endDate && (
                <>
                  <br />
                  <span className="event-meta-note">{t('events.durationNotProvided')}</span>
                </>
              )}
            </span>
          </div>

          {/* Kebab menu aligned to the right of the date line */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              className="event-kebab-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={`actions-menu-${event.id}`}
              onClick={() => setMenuOpen(prev => !prev)}
              title={t ? t('filters.moreFilters') : 'More'}
            >
              <span aria-hidden="true">⋮</span>
              <span className="sr-only">More actions</span>
            </button>
            {menuOpen && (
              <div
                id={`actions-menu-${event.id}`}
                role="menu"
                tabIndex={-1}
                className="absolute right-0 mt-2 w-64 origin-top-right bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              >
                <a
                  role="menuitem"
                  className="block w-full px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  href={(function() {
                    const title = event.name || '';
                    const venueName = event.venue?.name || '';
                    const detailsParts: string[] = [];
                    if (event.instagramId) {
                      detailsParts.push(`IG: https://www.instagram.com/p/${event.instagramId}`);
                    }
                    const details = detailsParts.join('\n');
                    const start = dayjs(event.date);
                    const hasTime = !!event.startTime && /^\d{2}:\d{2}/.test(event.startTime);
                    let startStr = '';
                    let endStr = '';
                    if (start.isValid()) {
                      if (hasTime) {
                        const startTime = dayjs(`${start.format('YYYY-MM-DD')}T${event.startTime!.slice(0,5)}:00`);
                        let endTime = startTime.add(2, 'hour');
                        if (event.endDate) {
                          const e = dayjs(event.endDate as string);
                          if (e.isValid()) {
                            endTime = e.endOf('day');
                          }
                        }
                        startStr = startTime.format('YYYYMMDDTHHmmss');
                        endStr = endTime.format('YYYYMMDDTHHmmss');
                      } else {
                        const end = (event.endDate && dayjs(event.endDate as string).isValid()) ? dayjs(event.endDate as string).add(1, 'day') : start.add(1, 'day');
                        startStr = start.format('YYYYMMDD');
                        endStr = end.format('YYYYMMDD');
                      }
                    }
                    const params = new URLSearchParams({
                      action: 'TEMPLATE',
                      text: title,
                      dates: `${startStr}/${endStr}`,
                      location: venueName,
                      details,
                    });
                    return `https://calendar.google.com/calendar/render?${params.toString()}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  title={t('events.addToGoogleCalendar')}
                >
                  <svg
                    className="w-4 h-4 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{t('events.addToGoogleCalendar')}</span>
                </a>

                <button
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => { setMenuOpen(false); reportRef.current?.open(event.id); }}
                >
                  <svg
                    className="w-4 h-4 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span>{t('events.report.button')}</span>
                </button>

                {!!session?.user && (
                  <>
                    <div className="my-1 border-t border-gray-200" role="separator" aria-hidden="true"></div>
                    <a
                      role="menuitem"
                      className="block w-full px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                      href={`/events/${event.id}/edit`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        className="w-4 h-4 text-gray-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                      </svg>
                      <span>{t('events.edit')}</span>
                    </a>

                    {event.instagramPostId && (
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        onClick={async () => {
                          setMenuOpen(false);
                          try {
                            messageApi.loading({ content: t('events.refetch.loading'), key: `refetch-${event.id}` });
                            const resp = await fetch(`${API_URL}/admin/instagram/posts/${event.instagramPostId}/refetch`, { method: 'POST' });
                            if (resp.ok) {
                              messageApi.success({ content: t('events.refetch.success'), key: `refetch-${event.id}` });
                              router.refresh();
                            } else {
                              messageApi.error({ content: t('events.refetch.error'), key: `refetch-${event.id}` });
                            }
                          } catch {
                            messageApi.error({ content: t('events.refetch.error'), key: `refetch-${event.id}` });
                          }
                        }}
                      >
                        <svg
                          className="w-4 h-4 text-gray-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <polyline points="1 20 1 14 7 14"></polyline>
                          <path d="M3.51 9a9 9 0 0114.13-3.36L23 10"></path>
                          <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14"></path>
                        </svg>
                        <span>{t('events.refetch.button')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      role="menuitem"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => { setMenuOpen(false); hideModalRef.current?.open(event.id); }}
                    >
                      <svg
                        className="w-4 h-4 text-gray-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="2" y1="2" x2="22" y2="22"></line>
                      </svg>
                      <span>{t('events.hide.button')}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="event-meta">
          <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 5.523-9 12-9 12S3 15.523 3 10a9 9 0 1118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="event-meta-text">
            {event.venue?.name ? (
              <a
                href={(function() {
                  const v = event.venue!;
                  const name = v.name ? `${v.name}, Buenos Aires` : 'Buenos Aires';
                  if (v.googlePlaceId) {
                    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(v.googlePlaceId)}`;
                  }
                  if (v.latitude != null && v.longitude != null) {
                    return `https://www.google.com/maps/@?api=1&map_action=map&center=${v.latitude},${v.longitude}&zoom=16`;
                  }
                  return `https://www.google.com/maps/search/?api=1&map_action=map&query=${encodeURIComponent(name)}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="event-link"
                title={event.venue.name}
              >
                {event.venue.name}
              </a>
            ) : ''}
            {event.venue?.barrio?.name && (
              <>
                {' '}
                ·{' '}
                <span>{event.venue.barrio.name}</span>
              </>
            )}
          </span>
        </div>

        {/* Event type: show only when collapsed */}
        {!isExpanded && (
          <div className="event-meta">
            <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.59 13.41L12 21l-9-9V3h9l8.59 8.59z" />
              <path d="M7 7h.01" />
            </svg>
            <span>
              {props.dictionaries?.eventTypeMap?.[event.type] ?? event.type}
            </span>
          </div>
        )}

        {/* Main action (collapsed): same as expanded (Tickets if paid with URL, else Más info) */}
        {!isExpanded && (() => {
          const firstPaymentUrl = getFirstPaymentUrl(event);
          if (hasTicketsButton(event)) {
            return (
              <div className="event-main-action">
                <a
                  className="event-main-action-btn"
                  href={firstPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('events.mainAction.tickets', 'Entradas')}
                </a>
              </div>
            );
          }

          // Otherwise: show "Más info". Prefer Instagram original source; if not available, link to event details.
          const igUrl = event.instagramId ? `https://www.instagram.com/p/${event.instagramId}` : '';
          if (igUrl) {
            return (
              <div className="event-main-action">
                <a
                  className="event-main-action-btn"
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('events.mainAction.moreInfo', 'Sitio oficial')}
                </a>
              </div>
            );
          }
          return (
            <div className="event-main-action">
              <Link href={`/events/${event.id}`} className="event-main-action-btn">
                {t('events.mainAction.moreInfo', 'Sitio oficial')}
              </Link>
            </div>
          );
        })()}

        {/* Toggle collapsed/expanded (top): show only when collapsed */}
        {!isExpanded && (
          <button
            type="button"
            className="event-collapse"
            aria-expanded={isExpanded}
            aria-controls={`event-content-${event.id}`}
            onClick={toggleSelf}
            title={isExpanded ? t('events.collapse') : t('events.expand')}
          >
            <svg className={`event-collapse-icon ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div id={`event-content-${event.id}`} className="event-expanded">
            {/* Type row (moved above description) */}
            <div className="event-meta">
              <svg className="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.59 13.41L12 21l-9-9V3h9l8.59 8.59z" />
                <path d="M7 7h.01" />
              </svg>
              <span>
                {props.dictionaries?.eventTypeMap?.[event.type] ?? event.type}
              </span>
            </div>
            <p className="event-description">{locale === 'en' ? (event.descriptionEn || event.description) : event.description}</p>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="event-tags" aria-label="event-tags">
                {event.tags.map((tag, idx) => {
                  const label = props.dictionaries?.tagMap?.[tag] ?? tag;
                  return (
                    <span key={`tag-${idx}`} className="event-tag" title={`#${label}`}>#{label}</span>
                  );
                })}
              </div>
            )}

            {/* Tickets */}
            {(() => {
              const chs = event.paymentChannels || [];
              if (chs.length === 0) return null;
              const isPaid = event.isFree === false;
              const urlCount = chs.reduce((acc, ch) => acc + (((ch?.url || '').trim()) ? 1 : 0), 0);
              // Hide the Tickets row if it's a paid event and there's exactly one URL, since the main button already uses it
              if (isPaid && urlCount === 1) return null;
              return (
                <>
                  <div className="event-divider" aria-hidden="true" />
                  <div className="tickets-row flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p>
                      <strong>{t('events.tickets')}</strong>{' '}
                      {chs.map((ch, idx) => {
                        const displayName = ch?.name || ch?.url || '';
                        const hasUrl = !!ch?.url;
                        const normalizedUrl = hasUrl
                          ? (ch!.url!.startsWith('http') ? ch!.url! : `https://${ch!.url!}`)
                          : '';
                        const linkClasses = "event-link inline-flex items-center max-w-full break-words px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-0 sm:py-0 sm:bg-transparent sm:rounded-none";
                        const spanClasses = "max-w-full break-words";
                        const content = hasUrl ? (
                          <a
                            key={`ch-${idx}`}
                            href={normalizedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkClasses}
                            title={displayName}
                          >
                            {displayName}
                          </a>
                        ) : (
                          <span key={`ch-${idx}`} className={spanClasses}>{displayName}</span>
                        );

                        return (
                          <React.Fragment key={`frag-${idx}`}>
                            {content}
                            {idx < chs.length - 1 && <span className="hidden sm:inline"> · </span>}
                          </React.Fragment>
                        );
                      })}
                    </p>
                  </div>
                </>
              );
            })()}

            <div className="event-divider" aria-hidden="true" />
            <div className="event-actions relative">
              {(() => {
                // Show the small "Original source" link only if the main action button is Tickets.
                if (hasTicketsButton(event) && event.instagramId) {
                  return (
                    <a
                      href={`https://www.instagram.com/p/${event.instagramId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-link"
                    >
                      {t('event.originalSource')}
                    </a>
                  );
                }
                return <span />;
              })()}
              {SHOW_EVENT_DETAILS_LINK ? (
                <Link href={`/events/${event.id}`} className="event-link">
                  {t('events.viewDetails')}
                </Link>
              ) : <span />}
            </div>

            {/* Main action (expanded, positioned above bottom chevron): Tickets for paid events, default to Original source */}
            {(() => {
              const firstPaymentUrl = getFirstPaymentUrl(event);
              if (hasTicketsButton(event)) {
                return (
                  <div className="event-main-action">
                    <a
                      className="event-main-action-btn"
                      href={firstPaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('events.mainAction.tickets', 'Entradas')}
                    </a>
                  </div>
                );
              }

              // Otherwise: show "Fuente original/Original source". Prefer Instagram; if not available, link to event details.
              const igUrl = event.instagramId ? `https://www.instagram.com/p/${event.instagramId}` : '';
              if (igUrl) {
                return (
                  <div className="event-main-action">
                    <a
                      className="event-main-action-btn"
                      href={igUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('events.mainAction.moreInfo', 'Sitio oficial')}
                    </a>
                  </div>
                );
              }
              return (
                <div className="event-main-action">
                  <Link href={`/events/${event.id}`} className="event-main-action-btn">
                    {t('events.mainAction.moreInfo', 'Sitio oficial')}
                  </Link>
                </div>
              );
            })()}

            {/* Toggle (bottom): show only when expanded */}
            <button
              type="button"
              className="event-collapse"
              aria-expanded={isExpanded}
              aria-controls={`event-content-${event.id}`}
              onClick={toggleSelf}
              title={isExpanded ? t('events.collapse') : t('events.expand')}
            >
              <svg className={`event-collapse-icon ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
