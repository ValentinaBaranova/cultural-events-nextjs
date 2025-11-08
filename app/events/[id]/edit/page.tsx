import {redirect} from 'next/navigation';
import {auth} from 'auth.config';
import EditEventForm from '@/ui/events/edit-form';
import {getEvent} from "@/lib/actions";
import ClientT from '@/ui/ClientT';

export default async function EditEventPage({params}: { params: { id: string } }) {
    const session = await auth();

    if (!session?.user) {
        return redirect('/login');
    }
    const {id} = await params
    if (!id) return <p><ClientT k="event.missingId" /></p>;

    const event = await getEvent(id as string);

    if (!event) return <p><ClientT k="event.notFound" /></p>;

    return (
        <main>
            <EditEventForm event={event}/>
        </main>
    );
}
