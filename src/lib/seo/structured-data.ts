/**
 * Structured-data guardrails (docs/05 → Schema / Structured Data).
 * Only truthful, permitted types may be emitted. Business/contractor/review types that
 * would misrepresent the independent resource are prohibited outright.
 * No structured data is emitted in Phase 2A.
 */
export const PERMITTED_TYPES = ['WebSite', 'WebPage', 'Article', 'BreadcrumbList', 'Person', 'Organization', 'ListItem'] as const;

/** Types that must never appear anywhere in the built site. */
export const PROHIBITED_TYPES = [
  'LocalBusiness',
  'Plumber',
  'HomeAndConstructionBusiness',
  'ProfessionalService',
  'AggregateRating',
  'Review',
  'Rating',
  'PostalAddress',
] as const;

export interface StructuredDataIssue {
  path: string;
  message: string;
}

/** Recursively checks a JSON-LD value for prohibited or unknown @type values. */
export function checkStructuredData(value: unknown, path = '$'): StructuredDataIssue[] {
  const issues: StructuredDataIssue[] = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => issues.push(...checkStructuredData(v, `${path}[${i}]`)));
    return issues;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const types = obj['@type'] === undefined ? [] : Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
    for (const t of types) {
      if (typeof t !== 'string') {
        issues.push({ path, message: '@type must be a string' });
      } else if ((PROHIBITED_TYPES as readonly string[]).includes(t)) {
        issues.push({ path, message: `prohibited structured-data type "${t}"` });
      } else if (!(PERMITTED_TYPES as readonly string[]).includes(t)) {
        issues.push({ path, message: `structured-data type "${t}" is not on the permitted list` });
      }
    }
    for (const [k, v] of Object.entries(obj)) issues.push(...checkStructuredData(v, `${path}.${k}`));
  }
  return issues;
}

/** Serializes JSON-LD safely for embedding in a <script> element, after validation. */
export function serializeJsonLd(value: unknown): string {
  const issues = checkStructuredData(value);
  if (issues.length) throw new Error(`invalid structured data: ${issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`);
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
