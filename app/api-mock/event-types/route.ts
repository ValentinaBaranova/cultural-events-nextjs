
// Simple mock for event types used by the UI tests.
// Ignores locale param and returns a minimal set.
const types = [
  { slug: 'teatro', name: 'teatro' },
  { slug: 'musica', name: 'musica' },
];

export async function GET() {
  return Response.json(types);
}
