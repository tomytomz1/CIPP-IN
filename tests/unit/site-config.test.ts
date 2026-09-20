import { describe, expect, it } from 'vitest';
import { resolveSiteConfig, validateOrigin } from '../../src/config/site.ts';
import { PRODUCTION_ORIGIN } from '../../src/config/brand.ts';
import { renderHeadersFile } from '../../src/integrations/response-headers.ts';

describe('site configuration', () => {
  it('defaults to development (non-indexable) when SITE_ENV is missing or unknown', () => {
    expect(resolveSiteConfig({})).toEqual({ environment: 'development', origin: null, indexingAllowed: false });
    expect(resolveSiteConfig({ SITE_ENV: 'prod' }).indexingAllowed).toBe(false);
  });
  it('preview is never indexable, even with an origin', () => {
    expect(resolveSiteConfig({ SITE_ENV: 'preview', PUBLIC_SITE_ORIGIN: 'https://preview.fixture-origin.invalid' }).indexingAllowed).toBe(false);
  });
  it('production uses the registered brand domain when no origin is configured', () => {
    // The operator registered indysewerresource.com; knowing the canonical origin does not
    // make any page indexable (the evaluator decides that) and nothing is deployed to it.
    expect(resolveSiteConfig({ SITE_ENV: 'production' })).toEqual({
      environment: 'production',
      origin: PRODUCTION_ORIGIN,
      indexingAllowed: true,
    });
  });
  it('production rejects an invalid explicit origin', () => {
    expect(() => resolveSiteConfig({ SITE_ENV: 'production', PUBLIC_SITE_ORIGIN: 'http://insecure.fixture' })).toThrow(/https/);
    expect(() => resolveSiteConfig({ SITE_ENV: 'production', PUBLIC_SITE_ORIGIN: 'https://localhost' })).toThrow(/not a production host/);
    expect(() => resolveSiteConfig({ SITE_ENV: 'production', PUBLIC_SITE_ORIGIN: 'https://fixture.invalid' })).toThrow(/not a production host/);
    expect(() => resolveSiteConfig({ SITE_ENV: 'production', PUBLIC_SITE_ORIGIN: 'https://ok.fixture/path' })).toThrow(/bare origin/);
  });
  it('normalizes a valid origin', () => {
    expect(validateOrigin('https://Fixture-Origin.com/')).toBe('https://fixture-origin.com');
  });
});

const PRODUCTION = { environment: 'production' as const, origin: 'https://fixture-origin.com', indexingAllowed: true };

describe('response headers', () => {
  it('non-production builds send X-Robots-Tag noindex on every response', () => {
    expect(renderHeadersFile({ environment: 'preview', origin: null, indexingAllowed: false })).toMatch(/X-Robots-Tag: noindex, nofollow/);
  });

  it('a production deployment stays globally noindex while no page is indexable', () => {
    // A real hostname never authorizes indexing: with 0 indexable pages every response,
    // including non-HTML assets, carries the header.
    expect(renderHeadersFile(PRODUCTION, { indexablePages: 0 })).toMatch(/X-Robots-Tag: noindex, nofollow/);
    expect(renderHeadersFile(PRODUCTION)).toMatch(/X-Robots-Tag: noindex, nofollow/);
    // It lifts on its own once a page genuinely passes the gate; it is never toggled by hand.
    expect(renderHeadersFile(PRODUCTION, { indexablePages: 1 })).not.toMatch(/X-Robots-Tag/);
  });

  it('sends HSTS in production only', () => {
    expect(renderHeadersFile(PRODUCTION, { indexablePages: 0 })).toMatch(/Strict-Transport-Security: max-age=31536000/);
    expect(renderHeadersFile({ environment: 'development', origin: null, indexingAllowed: false })).not.toMatch(/Strict-Transport-Security/);
  });
  it('includes baseline security headers', () => {
    const h = renderHeadersFile({ environment: 'development', origin: null, indexingAllowed: false });
    for (const name of ['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy']) {
      expect(h).toContain(name);
    }
  });
});
