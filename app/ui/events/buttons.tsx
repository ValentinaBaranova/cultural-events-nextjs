'use client';

import { useSession } from 'next-auth/react';
import { PencilIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function UpdateEvent({ id }: { id: string }) {
    const { data: session } = useSession();

    if (!session?.user) return null;

    return (
        <div className="flex gap-2">
            {/* Edit Button */}
            <Link
                href={`/events/${id}/edit`}
                className="rounded-md border border-border p-2 hover:bg-accent transition"
            >
                <PencilIcon className="w-5 h-5 text-primary" />
            </Link>
        </div>
    );
}
