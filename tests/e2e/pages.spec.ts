import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  '/',
  '/projects/',
  '/projects/mnist-neural-network/',
  '/projects/historic-photo-explorer/',
  '/about/',
  '/experience/',
  '/resume/',
  '/privacy/',
  '/notes/',
  '/does-not-exist/',
];

const MNIST_TITLE = 'A neural network written from scratch';
const PHOTO_TITLE = 'Describing historic photos for blind readers';

const mnistCard = (page: Page) =>
  page.locator('article', {
    has: page.getByRole('heading', { level: 3, name: MNIST_TITLE }),
  });

test('unique titles and descriptions', async ({ page }) => {
  const titles: string[] = [];
  const descriptions: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    const title = await page.title();
    const description =
      (await page
        .locator('meta[name="description"]')
        .getAttribute('content')) ?? '';
    expect(title.trim(), path).not.toBe('');
    expect(description.trim(), path).not.toBe('');
    titles.push(title);
    descriptions.push(description);
  }
  expect(new Set(titles).size).toBe(PAGES.length);
  expect(new Set(descriptions).size).toBe(PAGES.length);
});

test('one h1 and headings in order', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    expect(
      levels.filter((l) => l === 1),
      path,
    ).toHaveLength(1);
    expect(levels[0], path).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]!, `${path} heading ${i}`).toBeLessThanOrEqual(
        levels[i - 1]! + 1,
      );
    }
  }
});

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of PAGES) {
    await page.goto(path);
    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(scroll, path).toBeLessThanOrEqual(client);
  }
});

test('axe: zero violations', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});

test('home lists featured projects highest entry first', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h3')).toHaveText([PHOTO_TITLE, MNIST_TITLE]);
});

test('card title opens project page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: MNIST_TITLE }).click();
  await expect(page).toHaveURL(/\/projects\/mnist-neural-network\/$/);
  await expect(page.locator('h1')).toHaveText(MNIST_TITLE);
  await expect(page.locator('#demo')).toBeVisible();
});

test('next project wraps', async ({ page }) => {
  await page.goto('/projects/mnist-neural-network/');
  await page.getByRole('link', { name: /Next project/ }).click();
  await expect(page).toHaveURL(/\/projects\/historic-photo-explorer\/$/);
});

test('notes hidden from menu', async ({ page }) => {
  await page.goto('/');
  await expect(
    page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Notes' }),
  ).toHaveCount(0);
});

test('404 page', async ({ page }) => {
  const response = await page.goto('/does-not-exist/');
  expect(response?.status()).toBe(404);
  const main = page.locator('main');
  await expect(main).toContainText(/page not found/i);
  await expect(main.locator('a[href="/"]')).toHaveCount(1);
  await expect(main.locator('a[href="/projects/"]')).toHaveCount(1);
});

test('no entry-level wording', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    expect(await page.locator('body').innerText(), path).not.toMatch(
      /entry-level/i,
    );
  }
});

test('card links sit at the bottom of the text column', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const cards = page.locator('article.card');
  await expect(cards).toHaveCount(2);
  for (const card of await cards.all()) {
    const link = await card
      .getByRole('link', { name: 'Open project' })
      .boundingBox();
    const column = await card.locator('.text').boundingBox();
    expect(
      Math.abs(link!.y + link!.height - (column!.y + column!.height)),
    ).toBeLessThanOrEqual(1);
  }
});

test('demo above text on phones', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  const card = mnistCard(page);
  const demo = await card.locator('#demo').boundingBox();
  const dl = await card.locator('dl').boundingBox();
  expect(demo!.height).toBeGreaterThan(0);
  expect(demo!.y).toBeLessThan(dl!.y);
});

test('P/A/R labels stack on narrow cards', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  const rows = page.locator('dl > div');
  expect(await rows.count()).toBeGreaterThan(0);
  for (const row of await rows.all()) {
    const dt = await row.locator('dt').boundingBox();
    const dd = await row.locator('dd').boundingBox();
    expect(dt!.y + dt!.height).toBeLessThanOrEqual(dd!.y + 0.5);
  }
});

test('figures numbered', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'computed counter styles: chromium');
  await page.goto('/projects/mnist-neural-network/');
  const reset = await page
    .locator('.writeup')
    .evaluate((el) => getComputedStyle(el).counterReset);
  expect(reset).toContain('fig');
  const captions = page.locator('.writeup figcaption');
  await expect(captions).toHaveCount(3);
  const befores = await captions.evaluateAll((els) =>
    els.map((e) => getComputedStyle(e, '::before').content),
  );
  for (const content of befores) expect(content).toContain('counter(fig)');
  const order = await captions.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().top),
  );
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});

test('card body is not a link', async ({ page }) => {
  await page.goto('/');
  const before = page.url();
  await mnistCard(page).locator('.strip').click();
  await page.waitForTimeout(300);
  expect(page.url()).toBe(before);
});
