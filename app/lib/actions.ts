'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { UpdateEventSchema } from '@/lib/validation/eventSchema';
import { API_URL } from '@/lib/config';

export async function updateEvent(id: string, formData: FormData) {
    if (!id) throw new Error('Event ID is missing');

    const parsedData = UpdateEventSchema.parse({
        name: formData.get('name'),
        date: formData.get('date'),
        location: formData.get('location'),
        description: formData.get('description'),
        startTime: formData.get('startTime') || null,
        endDate: formData.get('endDate') || null,
        type: formData.get('type'),
    });

    const response = await fetch(`${API_URL}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
    });

    if (!response.ok) {
        throw new Error(`Failed to update event: ${response.statusText}`);
    }

    revalidatePath('/events');
    redirect('/events');
}

export async function getEvent(id: string) {
    const res = await fetch(`${API_URL}/events/${id}`, {
        cache: 'no-store', // ✅ Avoid caching if you need fresh data
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch event with id ${id}`);
    }

    return res.json();
}
