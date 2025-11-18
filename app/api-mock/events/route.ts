import { NextRequest } from 'next/server';

const sampleEvents = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Sample Concert',
    date: '2025-03-20',
    description: 'A wonderful evening of music',
    venueDetail: 'City Hall',
    startTime: null,
    endDate: null,
    type: 'concert',
    instagramPostId: '123',
    instagramId: 'CxyZAb12345',
    imageExists: false,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Art Exhibition',
    date: '2025-04-10',
    description: 'Modern art from local artists',
    venueDetail: 'Art Gallery',
    startTime: null,
    endDate: null,
    type: 'exhibition',
    instagramPostId: '456',
    instagramId: 'DabCDE67890',
    imageExists: false,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || '1');

  // Return data only for first page to stop infinite pagination
  const data = page <= 1 ? sampleEvents : [];
  return Response.json(data);
}
