"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEvents } from '@/lib/useEvents';
import React, { useState } from 'react';
import { CulturalEvent } from '@/lib/definitions';


export default function EventsListPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const { events, isLoading, error } = useEvents(searchQuery); // Pass search query to API

    if (isLoading) return <p>Loading events...</p>;
    if (error) return <p>Error loading events</p>;

    return (
        <div className="events-list-container">
            <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
            />

            <div className="events-grid">
                {events?.map((event: CulturalEvent) => ( // <-- Указываем тип
                    <div key={event.id} className="event-card">
                        <Image
                            src="/events_images/placeholder.png"
                            width={400}
                            height={400}
                            className="event-image"
                            alt="Placeholder for event images"
                        />
                        <div className="event-details">
                            <h2>{event.name}</h2>
                            <p>{event.description}</p>
                            <p>
                                <strong>Date:</strong> {event.date}
                            </p>
                            <p>
                                <strong>Location:</strong> {event.location}
                            </p>
                            <Link href={`/events/${event.id}`} className="event-link">
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

