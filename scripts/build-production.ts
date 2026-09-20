/**
 * Production build plus the production-mode post-build checks.
 *
 *   node scripts/build-production.ts
 *
 * Runs the same Astro build as `npm run build`, but with `SITE_ENV=production`, so the build
 * uses the real canonical origin (https://indysewerresource.com) and the production branch of
 * every firewall decision. The post-build checks run in the same environment, so what is
 * verified is exactly what would be deployed.
 *
 * This does NOT deploy. Deployment is a separate, explicit step (see docs/05 -> Deployment).
 * A production build still fails if any page is in lifecycle `draft`, and it still emits
 * `noindex` for every page that has not passed the Indexing Gate with operator approval.
 */
import { spawnSync } from 'node:child_process';

const env = {
  ...process.env,
  SITE_ENV: 'production',
  // The registered canonical origin; src/config/brand.ts holds the value used when unset.
  ...(process.env['PUBLIC_SITE_ORIGIN'] ? { PUBLIC_SITE_ORIGIN: process.env['PUBLIC_SITE_ORIGIN'] } : {}),
};

const steps: [string, string[]][] = [
  ['astro', ['build']],
  ['node', ['scripts/check-dist.ts']],
  ['node', ['scripts/check-budgets.ts']],
  ['node', ['scripts/similarity-qa.ts']],
];

for (const [command, args] of steps) {
  console.log(`\n> SITE_ENV=production ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\nproduction build FAILED at: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\nProduction build complete. Nothing has been deployed.');
