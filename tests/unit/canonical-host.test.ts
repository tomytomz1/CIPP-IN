/**
 * Canonical-host policy: the apex serves the site, and `www` only ever redirects to it.
 * Guards against `www` quietly becoming a second host serving the same content.
 */
import { describe, expect, it } from 'vitest';
import { APEX_HOST, PRODUCTION_ORIGIN } from '../../src/config/brand.ts';
import { CANONICAL_REDIRECT_STATUS, REDIRECTING_HOSTS, canonicalRedirect } from '../../src/lib/seo/canonical-host.ts';

describe('canonical host', () => {
  it('redirects www to the apex, preserving path and query', () => {
    expect(canonicalRedirect('https://www.indysewerresource.com/')).toBe('https://indysewerresource.com/');
    expect(canonicalRedirect('https://www.indysewerresource.com/lawrence-sewer-lateral-repair/')).toBe(
      'https://indysewerresource.com/lawrence-sewer-lateral-repair/',
    );
    expect(canonicalRedirect('https://www.indysewerresource.com/about/?ref=x#sources')).toBe(
      'https://indysewerresource.com/about/?ref=x#sources',
    );
    // An http request to www still lands on https at the apex.
    expect(canonicalRedirect('http://www.indysewerresource.com/about/')).toBe('https://indysewerresource.com/about/');
  });

  it('leaves the canonical host on https alone', () => {
    expect(canonicalRedirect('https://indysewerresource.com/')).toBeNull();
    expect(canonicalRedirect('https://indysewerresource.com/about/')).toBeNull();
  });

  it('upgrades plain http on the apex to https', () => {
    expect(canonicalRedirect('http://indysewerresource.com/')).toBe('https://indysewerresource.com/');
    expect(canonicalRedirect('http://indysewerresource.com/about/?x=1')).toBe('https://indysewerresource.com/about/?x=1');
  });

  it('does not redirect hosts it does not own, and never crashes on a bad URL', () => {
    expect(canonicalRedirect('https://example.invalid/')).toBeNull();
    expect(canonicalRedirect('https://indysewerresource.com.evil.invalid/')).toBeNull();
    expect(canonicalRedirect('https://wwwindysewerresource.com/')).toBeNull();
    expect(canonicalRedirect('not a url')).toBeNull();
  });

  it('uses a permanent redirect and stays consistent with the locked brand origin', () => {
    expect(CANONICAL_REDIRECT_STATUS).toBe(301);
    expect(PRODUCTION_ORIGIN).toBe(`https://${APEX_HOST}`);
    expect(REDIRECTING_HOSTS).toEqual([`www.${APEX_HOST}`]);
  });
});
