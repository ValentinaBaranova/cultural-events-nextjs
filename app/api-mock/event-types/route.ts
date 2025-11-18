import { NextRequest } from 'next/server';

// Simple mock for event types used by the UI tests.
// Ignores locale param and returns a minimal set.
const types = [
  { slug: 'teatro', name: 'teatro' },
  { slug: 'concierto', name: 'concierto' },
];

export async function GET(_req: NextRequest) {
  return Response.json(types);
}
