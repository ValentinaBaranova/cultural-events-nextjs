import React from 'react';
import Container from '@/ui/Container';
import VenueEditForm from '../../components/VenueEditForm';
import { getVenue } from '@/lib/actions';
import { API_URL } from '@/lib/config';
import { Barrio } from '@/lib/definitions';

export default async function EditVenuePage(props: {
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;
    const { id } = params;
    
    // Fetch venue and barrios
    const venue = await getVenue(id);
    
    const barriosRes = await fetch(`${API_URL}/barrios`);
    const barrios: Barrio[] = barriosRes.ok ? await barriosRes.json() : [];

    return (
        <Container className="py-8">
            <VenueEditForm venue={venue} barrios={barrios} />
        </Container>
    );
}
