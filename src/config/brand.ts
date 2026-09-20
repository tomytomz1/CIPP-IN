/**
 * Locked brand strings and site navigation (docs/05 → Domain / Brand).
 *
 * The brand is an independent resource, never a plumbing company and never a government body.
 * Navigation lives here so routes stay centrally defined rather than hand-written per page
 * (docs/05 → Routes).
 */
export const SITE_NAME = 'Indy Sewer Resource';
export const SITE_TAGLINE = 'Independent sewer information for Indianapolis-area homeowners';

/** The production domain, registered by the operator. Nothing is deployed to it. */
export const PRODUCTION_ORIGIN = 'https://indysewerresource.com';

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/lawrence-sewer-lateral-repair/', label: 'Lawrence sewer laterals' },
  { href: '/about/', label: 'How this works' },
];
