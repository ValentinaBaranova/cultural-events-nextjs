import { test, expect } from '@playwright/test';

test('login page renders form', async ({ page }) => {
  // Force English locale for stable assertions
  await page.addInitScript(() => localStorage.setItem('app_locale', 'en'));
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
