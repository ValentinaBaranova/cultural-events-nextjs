import React from 'react';
import Image from "next/image";
import {getEvent} from "@/lib/actions";
import ClientT from '@/ui/ClientT';

function formatDateDDMMYY(input?: string | Date | null): string {
    if (!input) return '';
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return String(input);
    try {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        }).format(date);
    } catch {
        return String(input);
    }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!id) return <p><ClientT k="event.missingId" /></p>;

    const event = await getEvent(id as string);

    if (!event) return <p><ClientT k="event.notFound" /></p>;

    return (
        <div className="p-5 max-w-[800px] mx-auto flex flex-col gap-6">
            <div className="relative w-[400px] h-[400px] mx-auto">
                <Image
                    src={event.imageExists
                        ? `/events/${event.id}/image`
                        : '/events_images/placeholder.png'}
                    alt=""
                    fill
                    className="object-cover"
                />
            </div>
                <div className="p-5">
                    <h1 className="text-2xl font-semibold mb-4">{event.name}</h1>
                    {/* Render combined text for Playwright expectations */}
                    <p><strong><ClientT k="event.description" /></strong> {event.description}</p>
                    <p><strong><ClientT k="events.date" /></strong> {formatDateDDMMYY(event.date)}</p>
                    <p><strong><ClientT k="events.location" /></strong> {event.venue?.name ?? event.venueDetail ?? ''}</p>
                    {event.venue && (
                        <p className="mt-1">
                            <a
                                href={(() => {
                                    const v = event.venue!;
                                    if (v.latitude != null && v.longitude != null) {
                                        return `https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`;
                                    }
                                    const name = v.name ? `${v.name}, Buenos Aires` : (event.venueDetail ?? 'Buenos Aires');
                                    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                Ver en Google Maps
                            </a>
                        </p>
                    )}
                    {(event.isFree || event.priceText) && (
                        <p>
                            <strong><ClientT k="events.price" /></strong>{' '}
                            {event.isFree ? <ClientT k="events.free" /> : event.priceText}
                        </p>
                    )}
                    {event.startTime && <p><strong><ClientT k="event.startTime" /></strong> {event.startTime}</p>}
                    {event.endDate && <p><strong><ClientT k="event.endDate" /></strong> {event.endDate}</p>}
                    <p><strong><ClientT k="event.type" /></strong> {event.type}</p>
                    {event.instagramId && (
                        <p className="mt-4">
                            <a
                                href={`https://www.instagram.com/p/${event.instagramId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                <ClientT k="event.originalSource" />
                            </a>
                        </p>
                    )}
                </div>
            </div>
            );
            };
