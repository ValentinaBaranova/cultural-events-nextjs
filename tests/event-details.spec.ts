import { test, expect } from '@playwright/test';

const EVENT_ID = '11111111-1111-1111-1111-111111111111';

test('event details page renders mocked event', async ({ page }) => {
  // Force English locale for stable assertions
  await page.addInitScript(() => localStorage.setItem('app_locale', 'en'));
  await page.goto(`/events/${EVENT_ID}`);

  await expect(page.getByRole('heading', { name: 'Sample Concert' })).toBeVisible();
  await expect(page.getByText('Description: A wonderful evening of music')).toBeVisible();
  await expect(page.getByText('Location: City Hall')).toBeVisible();
});
