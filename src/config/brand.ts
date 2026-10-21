/**
 * Locked brand strings and site navigation (docs/05 → Domain / Brand).
 *
 * The brand is an independent resource, never a plumbing company and never a government body.
 * Navigation lives here so routes stay centrally defined rather than hand-written per page
 * (docs/05 → Routes).
 */
export const SITE_NAME = 'Indy Sewer Resource';
export const SITE_TAGLINE = 'Independent sewer information for Indianapolis-area homeowners';
/** Short descriptor shown beside the wordmark. Describes the publication, never a service. */
export const SITE_DESCRIPTOR = 'Independent homeowner guide';

/** The production domain, registered by the operator and live since 2026-09-20. */
export const PRODUCTION_ORIGIN = 'https://indysewerresource.com';
/** The only host that serves this site. Everything else redirects to it. */
export const APEX_HOST = 'indysewerresource.com';

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/lawrence-sewer-lateral-repair/', label: 'Lawrence guide' },
  { href: '/about/', label: 'Methodology' },
];
