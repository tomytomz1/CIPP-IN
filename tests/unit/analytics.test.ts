import { describe, expect, it } from 'vitest';
import { analyticsEnabled } from '../../src/config/analytics.ts';
import { analyticsCsp, CONTENT_SECURITY_POLICY, renderHeadersFile } from '../../src/integrations/response-headers.ts';
import { safePageData, readChoice } from '../../public/analytics.js';

const production = { environment: 'production' as const, origin: 'https://indysewerresource.com', indexingAllowed: true };
describe('analytics privacy and activation boundaries', () => {
  it('requires an explicit production release switch and exact canonical origin', () => {
    expect(analyticsEnabled(production, 'true')).toBe(true);
    for (const flag of [undefined, '', 'false']) expect(analyticsEnabled(production, flag)).toBe(false);
    for (const environment of ['development', 'preview'] as const) expect(analyticsEnabled({ ...production, environment }, 'true')).toBe(false);
    expect(analyticsEnabled({ ...production, origin: 'https://preview.example.com' }, 'true')).toBe(false);
  });
  it('drops personal data, unknown paths, queries, fragments, and unapproved attribution', () => {
    const data = safePageData('https://indysewerresource.com/about/?email=secret%40example.com&gclid=secret&utm_campaign=secret&utm_source=google&utm_medium=organic#secret', 'https://www.google.com/search?q=secret');
    expect(data).toEqual({ page_location: 'https://indysewerresource.com/about/', page_title: 'How Indy Sewer Resource works', page_referrer: 'https://www.google.com/', campaign_source: 'google', campaign_medium: 'organic' });
    expect(safePageData('https://preview.example.com/', '')).toBeNull();
    expect(safePageData('https://indysewerresource.com/private-personal-data/', '')).toBeNull();
    expect(safePageData('https://indysewerresource.com/', 'https://private.example.com/secret')?.page_referrer).toBe('');
  });
  it('fails closed for missing, expired, corrupt, future, or inaccessible preference storage', () => {
    const storage = (raw: string | null) => ({ getItem: () => raw }) as unknown as Storage;
    expect(readChoice(storage(null), 1000)).toBe('deny');
    expect(readChoice(storage('{oops'), 1000)).toBe('deny');
    expect(readChoice(storage(JSON.stringify({ choice: 'allow', at: 2000 })), 1000)).toBe('deny');
    expect(readChoice(storage(JSON.stringify({ choice: 'allow', at: 1 })), 181 * 86400000)).toBe('deny');
    expect(readChoice({ getItem: () => { throw new Error('blocked'); } } as unknown as Storage, 1000)).toBe('deny');
    expect(readChoice(storage(JSON.stringify({ choice: 'allow', at: 1 })), 1000)).toBe('allow');
  });
  it('preserves CSP by default and never adds wildcard, inline, or eval permissions', () => {
    expect(analyticsCsp(false)).toBe(CONTENT_SECURITY_POLICY);
    expect(analyticsCsp(true)).toContain('https://www.googletagmanager.com/gtag/js');
    expect(analyticsCsp(true)).not.toMatch(/unsafe-|\*/);
    expect(renderHeadersFile({ ...production, environment: 'preview' }, { ga4Enabled: true })).not.toContain('googletagmanager');
    expect(renderHeadersFile(production, { ga4Enabled: true, indexablePages: 0 })).toContain('X-Robots-Tag: noindex, nofollow');
  });
});
