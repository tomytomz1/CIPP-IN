import { describe, expect, it } from 'vitest';
import { checkStructuredData, serializeJsonLd } from '../../src/lib/seo/structured-data.ts';

describe('structured-data guardrails', () => {
  it('rejects prohibited business, review, rating, and address types', () => {
    for (const t of ['LocalBusiness', 'Plumber', 'AggregateRating', 'Review', 'PostalAddress']) {
      expect(checkStructuredData({ '@context': 'https://schema.org', '@type': t })).not.toEqual([]);
    }
    expect(checkStructuredData({ '@type': 'WebPage', author: { '@type': 'Plumber' } })).not.toEqual([]);
  });
  it('rejects unknown types and accepts permitted ones', () => {
    expect(checkStructuredData({ '@type': 'Product' })).not.toEqual([]);
    expect(checkStructuredData({ '@type': 'WebPage', breadcrumb: { '@type': 'BreadcrumbList' } })).toEqual([]);
  });
  it('escapes < when serializing', () => {
    expect(serializeJsonLd({ '@type': 'WebPage', name: '</script>' })).not.toContain('</script>');
    expect(() => serializeJsonLd({ '@type': 'LocalBusiness' })).toThrow();
  });
});
