import { NextRequest } from 'next/server';

const sampleEvent = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Sample Concert',
  date: '2025-03-20',
  description: 'A wonderful evening of music',
  location: 'City Hall',
  startTime: null,
  endDate: null,
  type: 'concert',
  instagramPostId: '123',
  imageExists: false,
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === sampleEvent.id) {
    return Response.json(sampleEvent);
  }
  return new Response('Not found', { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (id !== sampleEvent.id) {
    return new Response('Not found', { status: 404 });
  }
  // return updated object echoing fields
  const updated = { ...sampleEvent, ...body };
  return Response.json(updated);
}
