import { test, expect } from '@playwright/test';

const EVENT_ID = '11111111-1111-1111-1111-111111111111';

test('edit event page redirects to login if not authenticated', async ({ page }) => {
  // Force English locale for stable assertions
  await page.addInitScript(() => localStorage.setItem('app_locale', 'en'));
  const res = await page.goto(`/events/${EVENT_ID}/edit`);
  // NextAuth redirect should land us on /login
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
});
