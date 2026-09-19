/// <reference types="astro/client" />

/** Injected at build time by astro.config.mjs from the validated environment (src/config/site.ts). */
declare const __SITE_CONFIG__: import('./config/site.ts').SiteConfig;

/**
 * Minimal declaration for the Cloudflare Workers runtime module. The real bindings/vars are
 * validated at runtime by src/lib/leads/activation.ts, which fails closed when they are absent
 * (including outside the Workers runtime, where this module does not exist).
 */
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
