'use client';

import { useEffect, useState } from 'react';
import { updateEvent } from '@/lib/actions';
import { API_URL } from '@/lib/config';
import { useI18n } from '@/i18n/I18nProvider';

type EventTypeOption = { slug: string; name: string };

export default function EditEventForm({ event }: { event: any }) {
    const updateEventWithId = updateEvent.bind(null, event.id);
    const { locale } = useI18n();
    const [types, setTypes] = useState<EventTypeOption[]>([]);

    const [isFree, setIsFree] = useState<boolean>(!!event.isFree);
    const [priceText, setPriceText] = useState<string>(event.priceText || '');

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/event-types?locale=${locale}`, { signal: controller.signal })
            .then(res => res.json())
            .then((data: EventTypeOption[]) => setTypes(data))
            .catch(() => {});
        return () => controller.abort();
    }, [locale]);

    return (
        <form action={updateEventWithId} className="max-w-lg mx-auto p-4 bg-white rounded shadow">
            <label className="block mb-2">Event Name</label>
            <input type="text" name="name" defaultValue={event.name} className="w-full p-2 border rounded mb-4" />

            <label className="block mb-2">Date</label>
            <input type="date" name="date" defaultValue={event.date} className="w-full p-2 border rounded mb-4" />

            <label className="block mb-2">Location</label>
            <input type="text" name="location" defaultValue={event.location} className="w-full p-2 border rounded mb-4" />

            <label className="block mb-2">Description</label>
            <textarea name="description" defaultValue={event.description} className="w-full p-2 border rounded mb-4" />

            <label className="block mb-2">Event Type</label>
            <select name="type" defaultValue={event.type} className="w-full p-2 border rounded mb-4">
                {types.map((t) => (
                    <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
            </select>

            <div className="flex items-center gap-2 mb-4">
                <input
                    id="isFree"
                    type="checkbox"
                    name="isFree"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                />
                <label htmlFor="isFree">Free</label>
            </div>

            <label className="block mb-2">Price text</label>
            <input
                type="text"
                name="priceText"
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                disabled={isFree}
                placeholder="$5.000"
                className="w-full p-2 border rounded mb-4 disabled:bg-gray-100"
            />

            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-700">
                Save Changes
            </button>
        </form>
    );
}
