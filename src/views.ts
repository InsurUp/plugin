/**
 * Read-only data views returned by `ctx.data` and handed to the render hooks. Each mirrors a host-side
 * view record; dates and ids are projected as strings (ISO-8601 for timestamps, `yyyy-MM-dd` for dates).
 */

import type {
  CaseMainState,
  CaseStatus,
  CaseSubState,
  CaseType,
  Channel,
  Currency,
  CustomerType,
  PolicyState,
  ProductBranch,
  ProposalState,
} from "./enums";

/**
 * Custom metadata attached to an entity: a free-form JSON object. Its shape is whatever the writers put
 * there (a plugin through `ctx.write`, or an API caller), so read a key defensively.
 */
export type Metadata = Record<string, unknown>;

/** A customer, from `ctx.data.getCustomerById`. */
export interface CustomerView {
  readonly id: string;
  readonly type: CustomerType;
  readonly name: string | null;
  readonly city: string | null;
  readonly district: string | null;
  readonly policyCount: number;
  readonly proposalCount: number;
  /** ISO-8601 timestamp. */
  readonly createdAt: string;
  /** Custom metadata attached to the customer, or null when there is none. */
  readonly metadata: Metadata | null;
}

/**
 * The customer behind a case, proposal or policy, attached by the host so a render hook — which cannot
 * call `ctx.data` — can still read the customer's name and metadata. Deliberately minimal.
 */
export interface CustomerRef {
  readonly id: string;
  readonly name: string | null;
  /** Custom metadata attached to the customer, or null when there is none. */
  readonly metadata: Metadata | null;
}

/** A case, from `ctx.data.getCaseByRef`. */
export interface CaseView {
  readonly id: string;
  /** The human-readable case reference. */
  readonly ref: string;
  readonly status: CaseStatus;
  readonly type: CaseType;
  readonly mainState: CaseMainState;
  readonly subState: CaseSubState;
  readonly customerId: string;
  /** The case's customer, or null when it no longer exists or could not be read. */
  readonly customer: CustomerRef | null;
  /** The product branch the case is centred on, if any. */
  readonly baseProductBranch: ProductBranch | null;
  /** ISO-8601 timestamp. */
  readonly createdAt: string;
  /** Custom metadata attached to the case, or null when there is none. */
  readonly metadata: Metadata | null;
}

/** A proposal, from `ctx.data.getProposalById`. */
export interface ProposalView {
  readonly id: string;
  readonly productBranch: ProductBranch;
  readonly state: ProposalState;
  readonly insuredCustomerId: string;
  readonly insurerCustomerId: string;
  /** The insured customer, or null when it no longer exists or could not be read. */
  readonly insuredCustomer: CustomerRef | null;
  /** The insurer (policyholder) customer, or null when it no longer exists or could not be read. */
  readonly insurerCustomer: CustomerRef | null;
  readonly lowestPremium: number | null;
  readonly highestPremium: number | null;
  /** ISO-8601 timestamp. */
  readonly createdAt: string;
  /** Custom metadata attached to the proposal, or null when there is none. */
  readonly metadata: Metadata | null;
}

/** A policy, from `ctx.data.getPolicyById`. */
export interface PolicyView {
  readonly id: string;
  readonly productBranch: ProductBranch;
  readonly insuredCustomerId: string;
  readonly insurerCustomerId: string;
  /** The insured customer, or null when it no longer exists or could not be read. */
  readonly insuredCustomer: CustomerRef | null;
  /** The insurer (policyholder) customer, or null when it no longer exists or could not be read. */
  readonly insurerCustomer: CustomerRef | null;
  /** Null for an external policy. */
  readonly insuranceCompanyId: number | null;
  /** `yyyy-MM-dd`, or null. */
  readonly startDate: string | null;
  /** `yyyy-MM-dd`, or null. */
  readonly endDate: string | null;
  /** Net premium in {@link PolicyView.currency}, or null when the policy carries none. */
  readonly netPremium: number | null;
  /** Gross premium in {@link PolicyView.currency}, or null when the policy carries none. */
  readonly grossPremium: number | null;
  /** The currency both premiums are in. */
  readonly currency: Currency;
  /** The channel the policy came from. */
  readonly channel: Channel;
  /** Lets a plugin skip a policy that is not in force. */
  readonly state: PolicyState;
  /** Metadata the caller attached at purchase time, verbatim, or null when there is none. */
  readonly metadata: Metadata | null;
}

/** A product, from `ctx.data.getProductById`. */
export interface ProductView {
  readonly id: number;
  readonly name: string | null;
  readonly insuranceCompanyId: number;
  readonly productBranch: ProductBranch | null;
}
