import React from 'react';
import Image from "next/image";
import {getEvent} from "@/lib/actions";

export default async function EventDetailPage({params}: { params: { id: string } }) {
    const {id} = await params
    if (!id) return <p>Event ID is missing</p>;

    const event = await getEvent(id as string);

    if (!event) return <p>Event not found</p>;

    return (
        <div className="p-5 max-w-[800px] mx-auto flex flex-col gap-6">
            <div className="relative w-[400px] h-[400px] mx-auto">
                <Image
                    src={event.imageExists
                        ? `/events/${event.id}/image`
                        : '/events_images/placeholder.png'}
                    alt="Event image"
                    fill
                    className="object-cover"
                />
            </div>
                <div className="p-5">
                    <h1 className="text-2xl font-semibold mb-4">{event.name}</h1>
                    <p><strong>Description:</strong> {event.description}</p>
                    <p><strong>Date:</strong> {event.date}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                    {event.startTime && <p><strong>Start Time:</strong> {event.startTime}</p>}
                    {event.endDate && <p><strong>End Date:</strong> {event.endDate}</p>}
                    <p><strong>Type:</strong> {event.type}</p>
                </div>
            </div>
            );
            };
