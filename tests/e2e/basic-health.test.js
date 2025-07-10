import { test, expect } from '@playwright/test';

test.describe('Basic Health Check', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Lightning Talk/i);
  });

  test('should have API health endpoint', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});
