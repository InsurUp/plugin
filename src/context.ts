/** The `ctx` object passed as the first argument to every hook. */

import type { Fetch } from './http';
import type { User } from './user';
import type { CaseView, CustomerView, Metadata, PolicyView, ProductView, ProposalView } from './views';

/** Dual-sink logger (`ctx.log`). Writes to platform telemetry and the persisted invocation log. */
export interface Logger {
  /** Logs at debug level, with optional structured data. */
  debug(message: string, data?: unknown): void;
  /** Logs at info level, with optional structured data. */
  info(message: string, data?: unknown): void;
  /** Logs at warning level, with optional structured data. */
  warn(message: string, data?: unknown): void;
  /** Logs at error level, with optional structured data. */
  error(message: string, data?: unknown): void;
}

/**
 * Read-only, tenant-scoped data access (`ctx.data`). Each call is read-cap counted; a render hook has no
 * read budget at all and gets its entities in its input instead.
 */
export interface DataApi {
  /** Fetches a customer by id, or null if not found in the current tenant. */
  getCustomerById(id: string): Promise<CustomerView | null>;
  /** Fetches a case by its human-readable reference, or null if not found in the current tenant. */
  getCaseByRef(ref: string): Promise<CaseView | null>;
  /** Fetches a proposal by id, or null if not found in the current tenant. */
  getProposalById(id: string): Promise<ProposalView | null>;
  /** Fetches a policy by id, or null if not found in the current tenant. */
  getPolicyById(id: string): Promise<PolicyView | null>;
  /** Fetches a product by id, or null if not found. */
  getProductById(id: number): Promise<ProductView | null>;
}

/**
 * Metadata writes (`ctx.write`). Each call merges a patch into the entity's metadata (RFC 7396: a key set
 * to `null` is removed). Only event hooks may write, a few times per invocation; in every other hook a
 * call fails.
 */
export interface WriteApi {
  /** Merges a patch into a customer's metadata. */
  mergeCustomerMetadata(id: string, patch: Metadata): Promise<void>;
  /** Merges a patch into a case's metadata, by the case's human-readable reference. */
  mergeCaseMetadata(ref: string, patch: Metadata): Promise<void>;
  /** Merges a patch into a proposal's metadata. */
  mergeProposalMetadata(id: string, patch: Metadata): Promise<void>;
  /** Merges a patch into a policy's metadata. */
  mergePolicyMetadata(id: string, patch: Metadata): Promise<void>;
}

/** Outbound HTTP (`ctx.http`). An alias of the global `fetch`. */
export interface HttpApi {
  /** Same function as the global `fetch`. */
  fetch: Fetch;
}

/**
 * The host capabilities projected onto the hook's first argument. Parameterize with your config type
 * (`Infer<typeof configSchema>`) so `ctx.config` is fully typed.
 */
export interface Ctx<Config = unknown> {
  /** The agent (tenant) the invocation runs for. */
  readonly agentId: string;
  /** Invocation start time as an ISO-8601 string. */
  readonly now: string;
  /** The current user. */
  readonly user: User;
  /** Dual-sink logging. */
  readonly log: Logger;
  /** Read-only, tenant-scoped data access. */
  readonly data: DataApi;
  /** Metadata writes, for event hooks. */
  readonly write: WriteApi;
  /** Outbound HTTP (alias of the global `fetch`). */
  readonly http: HttpApi;
  /** This plugin's per-agent config, with schema defaults applied. */
  readonly config: Config;
}
