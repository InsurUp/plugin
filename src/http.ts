/** Outbound HTTP types for the host-injected global {@link fetch}. */

/** Case-insensitive response headers. */
export interface PluginHeaders {
  /** Returns the value for `name` (case-insensitive), or `undefined` if absent. */
  get(name: string): string | undefined;
}

/**
 * A response from the host-injected global `fetch`. A deliberate subset of the WHATWG `Response` —
 * only the members the Jint host actually projects exist here.
 */
export interface PluginResponse {
  /** HTTP status code. */
  readonly status: number;
  /** True when {@link PluginResponse.status} is in the 2xx range. */
  readonly ok: boolean;
  /** Response headers. Case-insensitive lookup via {@link PluginHeaders.get}. */
  readonly headers: PluginHeaders;
  /** Reads the response body as text. */
  text(): Promise<string>;
  /** Parses the response body as JSON. */
  json<T = unknown>(): Promise<T>;
}

/** Options for the host-injected global {@link fetch}. */
export interface PluginRequestInit {
  /** HTTP method. Defaults to `GET`. */
  method?: string;
  /** Request headers. */
  headers?: Record<string, string>;
  /** Request body. */
  body?: string;
}

/** The signature of the host-injected global `fetch` (also exposed as `ctx.http.fetch`). */
export type Fetch = (url: string, options?: PluginRequestInit) => Promise<PluginResponse>;
