'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import Container from '@/ui/Container';
import { API_URL } from '@/lib/config';
import { Venue } from '@/lib/definitions';

export default function VenuesPage() {
    const { t } = useI18n();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const res = await fetch(`${API_URL}/admin/venues`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch venues: ${res.status}`);
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    setVenues(data);
                } else {
                    console.error('Expected array of venues but got:', data);
                    setVenues([]);
                }
            } catch (err) {
                console.error('Failed to fetch venues', err);
                setVenues([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVenues();
    }, []);

    if (loading) {
        return (
            <Container className="py-8">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-muted rounded"></div>
                            <div className="h-4 bg-muted rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">{t('admin.venues.title')}</h1>
            </div>

            <div className="bg-card shadow-sm border border-border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {t('admin.venues.name')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {t('admin.venues.barrio')}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {/* Actions */}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {venues.map((venue) => (
                            <tr key={venue.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                    {venue.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {venue.barrio?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link
                                        href={`/admin/venues/${venue.id}/edit`}
                                        className="text-primary hover:text-primary-hover"
                                    >
                                        {t('common.edit')}
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Container>
    );
}
