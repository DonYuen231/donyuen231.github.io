import { test, expect, type Locator, type Page } from '@playwright/test';

const MNIST_TITLE = 'A neural network written from scratch';
const REPO = 'https://github.com/DonYuen231/mnist-neural-network';

const card = (page: Page) => page.locator('.mnist-card');
const guess = (page: Page) => card(page).locator('.mnist-guess');
// The visible "7 · 98%" text (the spoken version lives in a sr-only span).
const visibleGuess = (page: Page) => card(page).locator('.mnist-guess-visible');
const canvas = (page: Page) => card(page).locator('canvas');

/** Scroll the card into view (client:visible) and wait for the model. */
async function ready(page: Page) {
  await card(page).scrollIntoViewIfNeeded();
  await expect(card(page)).toHaveAttribute('data-state', 'ready');
  await expect(guess(page)).not.toHaveText('Loading model…');
}

async function drawLine(
  page: Page,
  from: [number, number],
  to: [number, number],
) {
  const box = (await canvas(page).boundingBox())!;
  await page.mouse.move(
    box.x + from[0] * box.width,
    box.y + from[1] * box.height,
  );
  await page.mouse.down();
  await page.mouse.move(box.x + to[0] * box.width, box.y + to[1] * box.height, {
    steps: 12,
  });
  await page.mouse.up();
}

async function canvasAlphaSum(c: Locator) {
  return c.evaluate((el: HTMLCanvasElement) => {
    const data = el
      .getContext('2d')!
      .getImageData(0, 0, el.width, el.height).data;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum += data[i];
    return sum;
  });
}

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

const GUESS = /^[0-9] · \d{1,3}%$/;

test('sample button shows the right guess', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await card(page).getByRole('button', { name: 'Sample 7' }).click();
  await expect(visibleGuess(page)).toHaveText(/^7 · \d{1,3}%$/);
});

test('drawing shows a guess', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await drawLine(page, [0.5, 0.2], [0.5, 0.8]);
  await expect(visibleGuess(page)).toHaveText(GUESS);
  expect(await canvasAlphaSum(canvas(page))).toBeGreaterThan(0);
});

test('empty canvas', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await card(page).getByRole('button', { name: 'Guess', exact: true }).click();
  await expect(guess(page)).toHaveText('Draw a digit first');
});

test('a single dot is not a digit', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const box = (await canvas(page).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(guess(page)).toHaveText('Draw a digit first');
  expect(await canvasAlphaSum(canvas(page))).toBeGreaterThan(0);
});

test('stroke leaving the canvas ends cleanly', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await ready(page);
  const box = (await canvas(page).boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 50, y, { steps: 12 });
  await page.mouse.up();
  await card(page).getByRole('button', { name: 'Clear' }).click();
  await expect(guess(page)).toHaveText('');
  // Moving over the canvas with no button held must not draw.
  await page.mouse.move(box.x + box.width / 2, box.y + 10, { steps: 6 });
  expect(await canvasAlphaSum(canvas(page))).toBe(0);
  await drawLine(page, [0.5, 0.2], [0.5, 0.8]);
  await expect(visibleGuess(page)).toHaveText(GUESS);
  expect(errors).toEqual([]);
});

test('clear', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await card(page).getByRole('button', { name: 'Sample 4' }).click();
  await expect(visibleGuess(page)).toHaveText(GUESS);
  await card(page).getByRole('button', { name: 'Clear' }).click();
  await expect(guess(page)).toHaveText('');
  expect(await canvasAlphaSum(canvas(page))).toBe(0);
  await card(page).getByRole('button', { name: 'Guess', exact: true }).click();
  await expect(guess(page)).toHaveText('Draw a digit first');
});

test('model fails to load', async ({ page }) => {
  await page.route('**/models/mnist/weights.bin', (r) => r.abort());
  await page.goto('/');
  await card(page).scrollIntoViewIfNeeded();
  await expect(card(page)).toContainText("Demo couldn't load");
  await expect(
    card(page).getByRole('link', { name: 'View the code' }),
  ).toHaveAttribute('href', REPO);
});

test('watch it think link', async ({ page }) => {
  await page.goto('/');
  await expect(
    card(page).getByRole('link', { name: 'Watch it think' }),
  ).toHaveAttribute('href', '/projects/mnist-neural-network/#demo');
  await page.goto('/projects/mnist-neural-network/');
  await expect(page.locator('#demo .mnist-card')).toHaveCount(1);
  await expect(
    card(page).getByRole('link', { name: 'Watch it think' }),
  ).toHaveCount(0);
  await expect(page.locator('#demo')).toContainText(
    /98\.32%.*10,000 MNIST test images/,
  );
});

test('works after view-transition navigation', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: MNIST_TITLE }).click();
  await expect(page).toHaveURL(/\/projects\/mnist-neural-network\/$/);
  await ready(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('h1')).toHaveText('Don Yuen');
  await ready(page);
  await card(page).getByRole('button', { name: 'Sample 3' }).click();
  await expect(visibleGuess(page)).toHaveText(/^3 · \d{1,3}%$/);
  expect(errors).toEqual([]);
});

test('touch drawing on phone', async ({ page, browserName }, testInfo) => {
  test.skip(
    !testInfo.project.use.hasTouch || browserName !== 'chromium',
    'touch: Pixel 7 project',
  );
  await page.goto('/');
  await ready(page);
  const box = (await canvas(page).boundingBox())!;
  const x = box.x + box.width / 2;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y: number) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
    });
  await touch('touchStart', box.y + box.height * 0.2);
  for (let i = 1; i <= 12; i++)
    await touch('touchMove', box.y + box.height * (0.2 + (0.6 * i) / 12));
  await touch('touchEnd', 0);
  await expect(visibleGuess(page)).toHaveText(GUESS);
  expect(await canvasAlphaSum(canvas(page))).toBeGreaterThan(0);
});
