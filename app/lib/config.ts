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

// Feature flag: control visibility of the "View details" link on events list
// Default is hidden (false)
const rawShowEventDetails = isBrowser
  ? (process.env.NEXT_PUBLIC_SHOW_EVENT_DETAILS_LINK as string | undefined)
  : (process.env.SHOW_EVENT_DETAILS_LINK as string | undefined);

export const SHOW_EVENT_DETAILS_LINK: boolean = parseBool(rawShowEventDetails) ?? false;

// Public contact email shown on the Contact page
// Prefer browser-exposed env in the client, fallback to server env, then default
export const CONTACT_EMAIL: string = (isBrowser
  ? (process.env.NEXT_PUBLIC_CONTACT_EMAIL as string | undefined)
  : (process.env.CONTACT_EMAIL as string | undefined)) || 'vbaranova87@gmail.com';

export const SITE_URL: string = (isBrowser
  ? (process.env.NEXT_PUBLIC_SITE_URL as string | undefined)
  : (process.env.SITE_URL as string | undefined)) || 'https://cultural-events.ba';
