/**
 * Build-time loader for Astro pages. Validates every publication record and the operator
 * approval registry, then evaluates indexability once per build. Invalid data fails the build.
 */
import approvals from '../../../governance/index-approvals.json';
import { buildRegistry, type PageRegistry } from './registry.ts';

const recordModules = import.meta.glob<unknown>('../../../content/publication-records/*.json', {
  eager: true,
  import: 'default',
});

let cached: PageRegistry | undefined;

export function getRegistry(): PageRegistry {
  cached ??= buildRegistry(
    Object.entries(recordModules).map(([source, data]) => ({ source, data })),
    approvals,
    { now: new Date() },
  );
  return cached;
}

export const siteConfig = __SITE_CONFIG__;
