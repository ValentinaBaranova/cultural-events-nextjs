'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEvents } from '@/lib/useEvents';
import React, {useEffect, useRef, useState} from 'react';
import { useSearchParams } from 'next/navigation';
import { CulturalEvent } from '@/lib/definitions';
import Search from "@/ui/search";
import { UpdateEvent } from "@/ui/events/buttons";
import Skeleton from "@/ui/skeleton";
import {API_URL} from "@/lib/config";
// import Skeleton from "@/ui/Skeleton"; // ✅ Import Skeleton Loader

export default function EventsListPage() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('query') || ''; // ✅ Read query from URL
    const [types, setTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const { events, isLoading, error, loadMore, isFetchingMore, hasMore } = useEvents(searchQuery, selectedType);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastEventRef = useRef<HTMLDivElement | null>(null);

    // ✅ Trigger `loadMore()` when the last event enters the viewport (Only if `hasMore`)
    useEffect(() => {
        if (!lastEventRef.current || !hasMore) return; // ✅ Don't observe if no more events

        observerRef.current = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                loadMore();
            }
        });

        observerRef.current.observe(lastEventRef.current);

        return () => observerRef.current?.disconnect();
    }, [loadMore, hasMore]);

    useEffect(() => {
        fetch(`${API_URL}/events/types`)
            .then(res => res.json())
            .then(data => setTypes(data));
    }, []);

    if (error) return <p>Error loading events</p>;

    return (
        <div className="events-list-container">
            <Search placeholder="Search events..."/>

            <select
                className="border border-gray-300 rounded px-3 py-2"
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
            >
                <option value="">All types</option>
                {types.map((type) => (
                    <option key={type} value={type}>
                        {type}
                    </option>
                ))}
            </select>

            <div className="events-grid">
                {/* ✅ Show skeleton while first request is loading */}
                {isLoading && (
                    <>
                        <Skeleton/>
                        <Skeleton/>
                    </>
                )}

                {events?.map((event: CulturalEvent, index) => (
                    <div
                        key={event.id}
                        className="event-card"
                        ref={index === events.length - 1 ? lastEventRef : null} // ✅ Attach observer to last event
                    >
                        <Image
                            src={event.imageExists
                                ? `/events/${event.id}/image`
                                : '/events_images/placeholder.png'}
                            width={400}
                            height={400}
                            className="event-image"
                            alt="Placeholder for event images"
                        />
                        <div className="event-details">
                            <h2>{event.name}</h2>
                            <p>{event.description}</p>
                            <p><strong>Date:</strong> {event.date}</p>
                            <p><strong>Location:</strong> {event.location}</p>
                            <UpdateEvent id={event.id}/>
                            <Link href={`/events/${event.id}`} className="event-link">
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}

                {/* ✅ Show Skeleton Loader while fetching more events */}
                {isFetchingMore && hasMore && <Skeleton/>}
            </div>
        </div>
    );
};
