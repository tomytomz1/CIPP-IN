/**
 * Automated accessibility (axe-core, WCAG 2.0/2.1/2.2 A + AA rules) and lab performance checks
 * for every built page. Automated checks are necessary but NOT sufficient: manual keyboard and
 * screen-reader review is still required (docs/05-BUILD-SPEC.md, Accessibility).
 *
 * Lab LCP/CLS here are synthetic measurements on a local server with CPU throttling. They are
 * not field Core Web Vitals; field p75 (LCP/CLS/INP) requires real-user data after launch.
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { builtPages } from '../../scripts/lib/dist.ts';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const LAB_LCP_BUDGET_MS = 2000;
const LAB_CLS_BUDGET = 0.05;

const routes = builtPages().map((p) => p.route);

for (const route of routes) {
  test.describe(`page ${route}`, () => {
    test('has no automatically detectable WCAG 2.2 A/AA violations', async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual([]);
    });

    test('exposes landmarks and a working, visible skip link', async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('main#main')).toHaveCount(1);
      await expect(page.locator('header')).toHaveCount(1);
      await expect(page.locator('footer')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);

      await page.keyboard.press('Tab');
      const skip = page.locator('a.skip-link');
      await expect(skip).toBeFocused();
      await expect(skip).toBeInViewport();
      const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle);
      expect(outline).not.toBe('none');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, '\\/')}#main$`));
    });

    test('meets lab LCP/CLS budgets under mobile CPU throttling', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'CDP throttling is Chromium-only');
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.goto(route, { waitUntil: 'load' });
      const metrics = await page.evaluate(
        () =>
          new Promise<{ lcp: number; cls: number }>((resolve) => {
            let lcp = 0;
            let cls = 0;
            new PerformanceObserver((list) => {
              for (const e of list.getEntries()) lcp = Math.max(lcp, e.startTime);
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            new PerformanceObserver((list) => {
              for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
                if (!e.hadRecentInput) cls += e.value;
              }
            }).observe({ type: 'layout-shift', buffered: true });
            setTimeout(() => resolve({ lcp, cls }), 1000);
          }),
      );
      console.log(`lab ${route}: LCP=${Math.round(metrics.lcp)}ms CLS=${metrics.cls.toFixed(3)}`);
      expect(metrics.lcp).toBeLessThanOrEqual(LAB_LCP_BUDGET_MS);
      expect(metrics.cls).toBeLessThanOrEqual(LAB_CLS_BUDGET);
    });
  });
}
