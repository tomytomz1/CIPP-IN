import { describe, expect, it } from 'vitest';
import { resolveSiteConfig, validateOrigin } from '../../src/config/site.ts';
import { renderHeadersFile } from '../../src/integrations/response-headers.ts';

describe('site configuration', () => {
  it('defaults to development (non-indexable) when SITE_ENV is missing or unknown', () => {
    expect(resolveSiteConfig({})).toEqual({ environment: 'development', origin: null, indexingAllowed: false });
    expect(resolveSiteConfig({ SITE_ENV: 'prod' }).indexingAllowed).toBe(false);
  });
  it('preview is never indexable, even with an origin', () => {
    expect(resolveSiteConfig({ SITE_ENV: 'preview', PUBLIC_SITE_ORIGIN: 'https://preview.fixture-origin.invalid' }).indexingAllowed).toBe(false);
  });
  it('production fails safely without a valid origin', () => {
    expect(() => resolveSiteConfig({ SITE_ENV: 'production' })).toThrow(/requires PUBLIC_SITE_ORIGIN/);
    expect(() => resolveSiteConfig({ SITE_ENV: 'production', PUBLIC_SITE_ORIGIN: 'http://insecure.fixture' })).toThrow(/https/);
    expect(() => resolveSiteConfig({ SITE_ENV: 'production', PUBLIC_SITE_ORIGIN: 'https://localhost' })).toThrow(/not a production host/);
    expect(() => resolveSiteConfig({ SITE_ENV: 'production', PUBLIC_SITE_ORIGIN: 'https://fixture.invalid' })).toThrow(/not a production host/);
    expect(() => resolveSiteConfig({ SITE_ENV: 'production', PUBLIC_SITE_ORIGIN: 'https://ok.fixture/path' })).toThrow(/bare origin/);
  });
  it('normalizes a valid origin', () => {
    expect(validateOrigin('https://Fixture-Origin.com/')).toBe('https://fixture-origin.com');
  });
});

describe('response headers', () => {
  it('non-production builds send X-Robots-Tag noindex on every response', () => {
    expect(renderHeadersFile({ environment: 'preview', origin: null, indexingAllowed: false })).toMatch(/X-Robots-Tag: noindex, nofollow/);
    expect(renderHeadersFile({ environment: 'production', origin: 'https://fixture-origin.com', indexingAllowed: true })).not.toMatch(/X-Robots-Tag/);
  });
  it('includes baseline security headers', () => {
    const h = renderHeadersFile({ environment: 'development', origin: null, indexingAllowed: false });
    for (const name of ['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy']) {
      expect(h).toContain(name);
    }
  });
});
