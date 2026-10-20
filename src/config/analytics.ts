import type { SiteConfig } from './site.ts';
import { PRODUCTION_ORIGIN } from './brand.ts';
/** Explicit release switch. A production host or a GA4 property alone never enables tracking. */
export function analyticsEnabled(site: SiteConfig, enabled: string | undefined): boolean {
  return enabled === 'true' && site.environment === 'production' && site.origin === PRODUCTION_ORIGIN;
}
