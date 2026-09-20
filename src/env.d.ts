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

/**
 * Minimal Cloudflare Workers runtime globals, declared here rather than pulling in the full
 * worker-types package. They exist only so the adapter's `handle()` signature resolves for
 * src/worker.ts; no binding is declared, because none is provisioned.
 */
interface Env {
  readonly [key: string]: unknown;
}
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
interface ExportedHandler<E = Env> {
  fetch?(request: Request, env: E, context: ExecutionContext): Promise<Response> | Response;
}
