import type { Fetch } from './http';

declare global {
  /**
   * Browser/Node-style global injected by the InsurUp plugin host. A narrowed `fetch` whose
   * `Response` is the subset the Jint runtime projects (see {@link Fetch}). Also available as
   * `ctx.http.fetch`.
   */
  const fetch: Fetch;
}

export {};
