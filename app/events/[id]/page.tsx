"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { events } from '@/lib/placeholder-data';
import Image from "next/image";

const EventDetailPage = () => {
    const params = useParams();
    const id = params.id;

    // Find the event based on the ID from the URL
    const event = events.find((e) => e.id === id);

    if (!event) {
        return <p>Event not found.</p>;
    }

    return (
        <div className="event-detail-container">
            <Image
                src="/events_images/placeholder.png"
                width={400}
                height={400}
                className="event-image"
                alt="Placeholder for event images"
            />
            <div className="event-info">
                <h1>{event.name}</h1>
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

export default EventDetailPage;
