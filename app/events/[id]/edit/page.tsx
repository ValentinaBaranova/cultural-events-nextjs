'use client';

import { useParams } from 'next/navigation';
import { useEvent } from '@/lib/useEvent';
import EditEventForm from '@/ui/events/edit-form';

export default function EditEventPage() {
    const { id } = useParams();
    if (!id) return <p>Event ID is missing</p>;

    const { event, isLoading, error } = useEvent(id as string);

    if (isLoading) return <p>Loading event...</p>;
    if (error) return <p>Error loading event</p>;
    if (!event) return <p>Event not found</p>;

    return (
        <main>
            <EditEventForm event={event} />
        </main>
    );
}
