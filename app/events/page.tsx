import React from 'react';
import Link from 'next/link';
import { events } from '@/lib/placeholder-data'; // Импорт данных о событиях
import Image from 'next/image';

const EventsListPage = () => {
    return (
        <div className="events-list-container">
            <div className="events-grid">
                {events.map((event) => (
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

export default EventsListPage;
