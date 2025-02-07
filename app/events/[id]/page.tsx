'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { useEvent } from '@/lib/useEvent';
import Image from "next/image";

export default function EventDetailPage() {
  const { id } = useParams(); // Get event ID from URL
  const { event, isLoading, error } = useEvent(id as string); // Fetch event data

  if (isLoading) return <p>Loading event...</p>;
  if (error) return <p>Error loading event</p>;
  if (!event) return <p>Event not found</p>;

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
