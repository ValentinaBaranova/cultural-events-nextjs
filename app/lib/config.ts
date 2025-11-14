// Prefer browser-exposed env when on the client, fall back to server env or default
const isBrowser = typeof window !== 'undefined';

export const API_URL = (isBrowser
  ? (process.env.NEXT_PUBLIC_EVENTS_API_URL as string | undefined)
  : (process.env.EVENTS_API_URL as string | undefined)) || 'http://localhost:8080/api';

// Feature flag: control visibility of Sign In/Sign Out buttons in the navbar
// Default is hidden (false)
function parseBool(val: string | undefined): boolean | undefined {
  if (!val) return undefined;
  const normalized = val.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized)
    ? true
    : ['0', 'false', 'no', 'off'].includes(normalized)
    ? false
    : undefined;
}

const rawShowAuth = isBrowser
  ? (process.env.NEXT_PUBLIC_SHOW_AUTH_BUTTONS as string | undefined)
  : (process.env.SHOW_AUTH_BUTTONS as string | undefined);

export const SHOW_AUTH_BUTTONS: boolean = parseBool(rawShowAuth) ?? false;
