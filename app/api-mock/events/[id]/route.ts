import type { NextRequest } from 'next/server';

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
  instagramId: 'CxyZAb12345',
  imageExists: false,
};

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (id === sampleEvent.id) {
    return Response.json(sampleEvent);
  }
  return new Response('Not found', { status: 404 });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  if (id !== sampleEvent.id) {
    return new Response('Not found', { status: 404 });
  }
  // return updated object echoing fields
  const updated = { ...sampleEvent, ...body };
  return Response.json(updated);
}
