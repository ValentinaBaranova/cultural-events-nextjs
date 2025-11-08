import { test, expect } from '@playwright/test';

// Minimal test for /events page
// Uses mocked API via EVENTS_API_URL env set in playwright.config.ts

test('events list renders search, filter and cards', async ({ page }) => {
  await page.goto('/events');

  // Search input exists
  const searchInput = page.getByPlaceholder('Search events...');
  await expect(searchInput).toBeVisible();

  // Filter select exists and has options from mocked types endpoint
  const select = page.locator('select');
  await expect(select).toBeVisible();
  // Check options by text content instead of visibility (native options may be hidden)
  const options = select.locator('option');
  await expect(options).toContainText(['All types', 'concert', 'exhibition', 'festival']);

  // Cards render from mocked events endpoint
  const cards = page.locator('.event-card');
  await expect(cards.first()).toBeVisible();
});
