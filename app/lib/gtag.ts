// https://developers.google.com/analytics/devguides/collection/ga4/event-parameters
export const trackExternalClick = ({
  event_id,
  click_type,
  platform,
}: {
  event_id: string;
  click_type: 'ticket' | 'instagram';
  platform: 'passline' | 'alternativateatral' | 'instagram' | 'other';
}) => {
  if (typeof window !== 'undefined' && (window as unknown as { gtag: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'external_click', {
      event_id,
      click_type,
      platform,
    });
  }
};

export const getPlatformFromUrl = (url: string): 'passline' | 'alternativateatral' | 'instagram' | 'other' => {
  const lowUrl = url.toLowerCase();
  if (lowUrl.includes('passline.com')) return 'passline';
  if (lowUrl.includes('alternativateatral.com') || lowUrl.includes('alternativa.ar')) return 'alternativateatral';
  if (lowUrl.includes('instagram.com')) return 'instagram';
  return 'other';
};

export const trackAddToFavorites = ({
  event_id,
  event_type,
  barrio,
  is_free,
}: {
  event_id: string;
  event_type: string;
  barrio: string;
  is_free: boolean;
}) => {
  if (typeof window !== 'undefined' && (window as unknown as { gtag: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'add_to_favorites', {
      event_id,
      event_type,
      barrio,
      is_free,
    });
  }
};

export const trackShareEvent = ({
  event_id,
  event_type,
  share_type,
  barrio,
  is_free,
}: {
  event_id: string;
  event_type: string;
  share_type: string;
  barrio: string;
  is_free: boolean;
}) => {
  if (typeof window !== 'undefined' && (window as unknown as { gtag: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'share_event', {
      event_id,
      event_type,
      share_type,
      barrio,
      is_free,
    });
  }
};
