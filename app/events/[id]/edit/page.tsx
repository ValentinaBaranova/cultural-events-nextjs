import {redirect} from 'next/navigation';
import {auth} from 'auth.config';
import EditEventForm from '@/ui/events/edit-form';
import {getEvent} from "@/lib/actions";

export default async function EditEventPage({params}: { params: { id: string } }) {
    const session = await auth();

    if (!session?.user) {
        return redirect('/login');
    }
    const {id} = await params
    if (!id) return <p>Event ID is missing</p>;

    const event = await getEvent(id as string);

    if (!event) return <p>Event not found</p>;

    return (
        <main>
            <EditEventForm event={event}/>
        </main>
    );
}
