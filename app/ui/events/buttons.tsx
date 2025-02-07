import { PencilIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function UpdateEvent({ id }: { id: string }) {
    return (
        <div className="flex gap-2">
            {/* Edit Button */}
            <Link
                href={`/events/${id}/edit`}
                className="rounded-md border p-2 hover:bg-gray-100 transition"
            >
                <PencilIcon className="w-5 h-5 text-blue-500" />
            </Link>
        </div>
    );
}
