/**
 * Read-only data views returned by `ctx.data`. Each mirrors a host-side view record; dates and ids
 * are projected as strings (ISO-8601 for timestamps, `yyyy-MM-dd` for dates).
 */

import type { CustomerType, ProductBranch, ProposalState } from "./enums";

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
}

/** A proposal, from `ctx.data.getProposalById`. */
export interface ProposalView {
  readonly id: string;
  readonly productBranch: ProductBranch;
  readonly state: ProposalState;
  readonly insuredCustomerId: string;
  readonly insurerCustomerId: string;
  readonly lowestPremium: number | null;
  readonly highestPremium: number | null;
  /** ISO-8601 timestamp. */
  readonly createdAt: string;
}

/** A policy, from `ctx.data.getPolicyById`. */
export interface PolicyView {
  readonly id: string;
  readonly productBranch: ProductBranch;
  readonly insuredCustomerId: string;
  readonly insurerCustomerId: string;
  readonly insuranceCompanyId: number;
  /** `yyyy-MM-dd`, or null. */
  readonly startDate: string | null;
  /** `yyyy-MM-dd`, or null. */
  readonly endDate: string | null;
}

/** A product, from `ctx.data.getProductById`. */
export interface ProductView {
  readonly id: number;
  readonly name: string | null;
  readonly insuranceCompanyId: number;
  readonly productBranch: ProductBranch | null;
}
