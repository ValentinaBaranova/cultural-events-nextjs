import { test, expect } from '@playwright/test';

// Verify language switching via the LanguageSwitcher and persistence across reloads/navigation

test('can switch from Spanish to English and it persists', async ({ page }) => {
  // Start in default Spanish
  await page.goto('/events');

  // Verify Spanish baseline
  await expect(page.getByRole('link', { name: 'Eventos en Buenos Aires' })).toBeVisible();
  await expect(page.getByPlaceholder('Buscar eventos...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');

  // Click the English button (labeled in Spanish as "Inglés")
  await page.getByRole('button', { name: 'Inglés' }).click();

  // Now the UI should be in English
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('link', { name: 'Events in Buenos Aires' })).toBeVisible();
  await expect(page.getByPlaceholder('Search events...')).toBeVisible();

  // The English button label is now shown in English in the English UI
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Spanish' })).toHaveAttribute('aria-pressed', 'false');

  // Reload page to ensure locale persisted via localStorage
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByPlaceholder('Search events...')).toBeVisible();

  // Navigate to a different page and make sure locale remains English
  await page.getByRole('link', { name: 'Events in Buenos Aires' }).click(); // home link
  await page.goto('/events');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
