import { test, expect } from '@playwright/test';

// i18n default locale should be Spanish (es)
// Verify key UI texts and attributes

test('default locale is Spanish on first visit', async ({ page }) => {
  await page.goto('/events');

  // <html lang="es"> should be set (SSR) and remain 'es' on client
  const langAttr = await page.locator('html').getAttribute('lang');
  expect(langAttr).toBe('es');

  // Navbar title in Spanish
  await expect(page.getByRole('link', { name: 'Eventos en Buenos Aires' })).toBeVisible();

  // Search placeholder in Spanish
  await expect(page.getByPlaceholder('Buscar eventos...')).toBeVisible();

  // Filter placeholder is shown in Spanish on AntD Select
  const typeCombobox = page.getByRole('combobox', { name: 'Event type filter' });
  await expect(typeCombobox).toBeVisible();
  await expect(page.getByText('Todos los tipos')).toBeVisible();

  // Language switcher buttons show localized names in current locale (Spanish UI)
  await expect(page.getByRole('button', { name: 'Español' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Inglés' })).toBeVisible();

  // Spanish should be marked as active via aria-pressed
  await expect(page.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
});
