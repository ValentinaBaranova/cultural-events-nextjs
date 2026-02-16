'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { UpdateEventSchema } from '@/lib/validation/eventSchema';
import { API_URL } from '@/lib/config';


export async function updateEvent(id: string, formData: FormData) {
    if (!id) throw new Error('Event ID is missing');

    const parsedData = UpdateEventSchema.parse({
        name: formData.get('name'),
        nameEn: ((): string | null => {
            const v = formData.get('nameEn');
            return v && typeof v === 'string' && v.trim().length > 0 ? v.toString() : null;
        })(),
        date: formData.get('date'),
        venueDetail: formData.get('venueDetail'),
        description: formData.get('description'),
        descriptionEn: ((): string | null => {
            const v = formData.get('descriptionEn');
            return v && typeof v === 'string' && v.trim().length > 0 ? v.toString() : null;
        })(),
        startTime: formData.get('startTime') || null,
        endDate: formData.get('endDate') || null,
        isFree: ((): boolean | null => {
            const v = formData.get('isFree');
            if (v === null) return null;
            // checkbox sends 'on' when checked
            if (v === 'on' || v === 'true') return true;
            if (v === 'false') return false;
            return null;
        })(),
        priceText: ((): string | null => {
            const t = formData.get('priceText');
            return (t && typeof t === 'string' && t.trim().length > 0) ? t.toString() : null;
        })(),
        type: formData.get('type'),
        tags: ((): string[] => {
            const values = formData.getAll('tags');
            const slugs = values.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(Boolean);
            // Always send an array. Empty array means clear all tags.
            return slugs;
        })()
    });

    try {
        const response = await fetch(`${API_URL}/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedData),
        });

        if (!response.ok) {
            // statusText can be empty in some runtimes; attempt to parse a meaningful message from body
            let detail = '';
            try {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const data = await response.json();
                    const msg = (data && (data.message || data.error)) || '';
                    const errors = Array.isArray(data?.errors) ? JSON.stringify(data.errors) : '';
                    detail = [msg, errors].filter(Boolean).join(' ');
                } else {
                    detail = await response.text();
                }
            } catch {
                // ignore body parse errors
            }
            const suffix = detail ? ` - ${detail}` : '';
            throw new Error(`Failed to update event (${response.status})${suffix}`);
        }
    } catch (e: unknown) {
        // Normalize network or unexpected errors to a consistent message
        const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Unknown error');
        throw new Error(msg.startsWith('Failed to update event') ? msg : `Failed to update event: ${msg}`);
    }

    revalidatePath('/events');
    redirect('/events');
}

export async function updateVenue(id: string, formData: FormData) {
    if (!id) throw new Error('Venue ID is missing');

    const data = {
        name: formData.get('name'),
        barrioId: formData.get('barrioId') || null,
        singleRoomVenue: formData.get('singleRoomVenue') === 'on' || formData.get('singleRoomVenue') === 'true',
    };

    try {
        const response = await fetch(`${API_URL}/admin/venues/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            let detail = '';
            try {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const errorData = await response.json();
                    detail = errorData.message || errorData.error || '';
                } else {
                    detail = await response.text();
                }
            } catch {
                // ignore
            }
            throw new Error(`Failed to update venue (${response.status}) ${detail}`);
        }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        throw new Error(msg);
    }

    revalidatePath('/admin/venues');
    redirect('/admin/venues');
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

export async function getVenue(id: string) {
    const res = await fetch(`${API_URL}/admin/venues/${id}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch venue with id ${id}`);
    }

    return res.json();
}
