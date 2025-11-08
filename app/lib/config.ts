// Prefer browser-exposed env when on the client, fall back to server env or default
const isBrowser = typeof window !== 'undefined';
export const API_URL = (isBrowser
  ? (process.env.NEXT_PUBLIC_EVENTS_API_URL as string | undefined)
  : (process.env.EVENTS_API_URL as string | undefined)) || 'http://localhost:8080/api';
