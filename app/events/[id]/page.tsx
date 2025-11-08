import React from 'react';
import Image from "next/image";
import {getEvent} from "@/lib/actions";
import ClientT from '@/ui/ClientT';

export default async function EventDetailPage({params}: { params: { id: string } }) {
    const {id} = await params
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
                    <p><strong><ClientT k="event.description" /></strong> {event.description}</p>
                    <p><strong><ClientT k="events.date" /></strong> {event.date}</p>
                    <p><strong><ClientT k="events.location" /></strong> {event.location}</p>
                    {event.startTime && <p><strong><ClientT k="event.startTime" /></strong> {event.startTime}</p>}
                    {event.endDate && <p><strong><ClientT k="event.endDate" /></strong> {event.endDate}</p>}
                    <p><strong><ClientT k="event.type" /></strong> {event.type}</p>
                </div>
            </div>
            );
            };
