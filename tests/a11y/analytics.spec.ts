import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const origin = 'https://indysewerresource.com';
test.describe('production analytics consent', () => {
  test.skip(process.env['PUBLIC_GA4_ENABLED'] !== 'true', 'Run against the enabled production build in the analytics CI job.');
  test.beforeEach(async ({ page, request }) => {
    await page.route(origin + '/**', async (route) => {
      const url = new URL(route.request().url());
      const local = await request.get('http://127.0.0.1:4321' + url.pathname);
      await route.fulfill({ response: local });
    });
    // Never send any test traffic to the real property. This stub tests our consent contract,
    // not Google's processing or Realtime acceptance.
    await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '/* simulated tag load; no collection */' }));
    await page.route(/https:\/\/(www|region1)\.google-analytics\.com\//, (route) => route.abort());
  });
  test('requires consent, sends one scrubbed page view, supports withdrawal and keyboard use', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => { if (r.url().startsWith('https://www.googletagmanager.com/')) external.push(r.url()); });
    await page.goto(origin + '/?email=secret%40example.com&utm_source=google');
    await expect(page.locator('[data-ga4-consent]')).toBeVisible();
    await page.locator('summary').click();
    await expect(page.locator('#analytics-status')).toHaveText('Optional analytics off.');
    expect(external).toEqual([]);
    await page.getByRole('button', { name: 'Allow analytics', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => external.length).toBe(1);
    await expect.poll(() => page.evaluate(() => {
      const w = window as typeof window & { dataLayer: Array<ArrayLike<unknown>> };
      return w.dataLayer.filter((x) => x[0] === 'event' && x[1] === 'page_view').length;
    })).toBe(1);
    const data = await page.evaluate(() => {
      const w = window as typeof window & { dataLayer: Array<ArrayLike<unknown>> };
      return w.dataLayer.map((x) => Array.from(x));
    });
    expect(JSON.stringify(data)).not.toContain('secret');
    await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
    expect(external.length).toBe(1);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(axe.violations).toEqual([]);
    await page.getByRole('button', { name: 'Decline analytics', exact: true }).click();
    await expect(page.locator('#analytics-status')).toHaveText('Optional analytics off.');
    expect(external.length).toBe(1);
  });
  test('excludes internal testing without an IP or geographic filter', async ({ page }) => {
    let loads = 0;
    page.on('request', (r) => { if (r.url().includes('googletagmanager.com')) loads++; });
    await page.goto(origin + '/about/?analytics=internal');
    await page.locator('summary').click();
    await expect(page.locator('#analytics-status')).toContainText('Internal testing');
    await page.reload();
    await expect(page.locator('#analytics-status')).toContainText('Internal testing');
    expect(loads).toBe(0);
  });
  test('validation marker needs consent and only labels the page view as internal', async ({ page }) => {
    let loads = 0;
    page.on('request', (r) => { if (r.url().includes('googletagmanager.com')) loads++; });
    await page.goto(origin + '/?analytics=validate');
    await page.locator('summary').click();
    await expect(page.locator('#analytics-status')).toHaveText('Optional analytics off.');
    expect(loads).toBe(0);
    await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
    await expect.poll(() => loads).toBe(1);
    const views = await page.evaluate(() => {
      const w = window as typeof window & { dataLayer: Array<ArrayLike<unknown>> };
      return w.dataLayer.filter((x) => x[0] === 'event' && x[1] === 'page_view').map((x) => x[2]);
    });
    expect(views).toEqual([expect.objectContaining({ traffic_type: 'internal', page_location: origin + '/' })]);
  });
  test('honors Global Privacy Control even after an allow click', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
    let loads = 0;
    page.on('request', (r) => { if (r.url().includes('googletagmanager.com')) loads++; });
    await page.goto(origin + '/');
    await page.locator('summary').click();
    await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
    await expect(page.locator('#analytics-status')).toContainText('privacy signal');
    expect(loads).toBe(0);
  });
});
