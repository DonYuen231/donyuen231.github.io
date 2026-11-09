import { test, expect } from '@playwright/test';

test('menu items in order', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link'),
  ).toHaveText(['Work', 'About', 'Experience', 'Resume', 'Contact']);
});

test('footer', async ({ page }) => {
  await page.goto('/');
  const f = page.locator('footer#contact');
  await expect(f).toContainText('© 2026 Don Yuen');
  await expect(f.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
    'href',
    '/privacy/',
  );
  await expect(f.getByRole('link', { name: 'GitHub' })).toBeVisible();
});

test('tap targets ≥ 44px', async ({ page }) => {
  await page.goto('/');
  for (const el of await page.locator('header a, footer a, button').all()) {
    expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});

test('menu is one row at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const ys = await page
    .locator('nav[aria-label="Main"] a')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
  expect(new Set(ys).size).toBe(1);
});

test('Work is current on the projects section', async ({ page }) => {
  const work = page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Work' });
  await page.goto('/projects/');
  await expect(work).toHaveAttribute('aria-current', 'page');
  await page.goto('/projects/mnist-neural-network/');
  await expect(work).toHaveAttribute('aria-current', 'true');
  await page.goto('/about/');
  await expect(work).not.toHaveAttribute('aria-current');
});
