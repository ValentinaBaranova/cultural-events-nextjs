'use client';

import { updateEvent } from '@/lib/actions';

export default function EditEventForm({ event }: { event: any }) {
    const updateEventWithId = updateEvent.bind(null, event.id);

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
                <option value="performance">Performance</option>
                <option value="exhibition">Exhibition</option>
                <option value="festival">Festival</option>
                <option value="workshop">Workshop</option>
                <option value="concert">Concert</option>
                <option value="social">Social</option>
                <option value="tour">Tour</option>
                <option value="wellness">Wellness</option>
            </select>

            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-700">
                Save Changes
            </button>
        </form>
    );
}
