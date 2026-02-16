import { test, expect } from '@playwright/test';

// Minimal test for /events page
// Uses mocked API via EVENTS_API_URL env set in playwright.config.ts

test('events list renders search, filter and cards', async ({ page }) => {
  // Force English locale for stable assertions
  await page.addInitScript(() => localStorage.setItem('app_locale', 'en'));
  await page.goto('/events');

  // Search input exists
  const searchInput = page.getByPlaceholder('Search events...');
  await expect(searchInput).toBeVisible();

  // AntD Select (combobox) exists and has options from mocked types endpoint
  const typeCombobox = page.getByRole('combobox', { name: 'Event type filter' });
  await expect(typeCombobox).toBeVisible();

  // Open dropdown and assert options
  await typeCombobox.click();
  const dropdown = page.locator('.ant-select-dropdown:visible');
  await expect(dropdown).toBeVisible();
  const optionItems = dropdown.getByRole('option');
  await expect(optionItems).toContainText(['teatro', 'musica']);

  // Cards render from mocked events endpoint
  const cards = page.locator('.event-card');
  await expect(cards.first()).toBeVisible();
});
