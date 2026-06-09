/**
 * Validation hooks. Export a function named after the validation point (e.g. `validateCustomerCreate`)
 * and the host runs it synchronously in the request path, before the operation is persisted. The hook
 * receives `(ctx, input)` and must return a {@link ValidationResult}.
 *
 * Validation is **fail-closed**: the operation proceeds only when every matching plugin returns
 * `{ ok: true }`. A returned `{ ok: false }`, a thrown error, a timeout, or a plugin that can't run all
 * block the operation (HTTP 422). Annotate each export with {@link ValidationHook} so both `ctx` and the
 * input are typed.
 */

import type { Ctx } from './context';
import type { Channel, CustomerType, Nationality, ProductBranch } from './enums';

/** Input to `validateCustomerCreate`: the customer being created (carries PII; stays in-process). */
export interface CustomerCreateValidationInput {
  /** The customer subtype. */
  customerType: CustomerType;
  /** National identity number, for individual/foreign customers. */
  identityNumber: string | null;
  /** Tax number, for company customers. */
  taxNumber: string | null;
  /** Full name, for individual/foreign customers. */
  fullName: string | null;
  /** Company title, for company customers. */
  title: string | null;
  /** Birth date (`yyyy-MM-dd`), for individual/foreign customers. */
  birthDate: string | null;
  /** Primary email address, if supplied. */
  email: string | null;
  /** Primary phone number, if supplied. */
  phoneNumber: string | null;
  /** Nationality, for individual/foreign customers. */
  nationality: Nationality | null;
  /** The channel the customer is created through. */
  channel: Channel;
}

/** Input to `validateCustomerUpdate`: the customer being updated (carries PII; stays in-process). */
export interface CustomerUpdateValidationInput {
  /** The id of the customer being updated. */
  customerId: string;
  /** The customer subtype. */
  customerType: CustomerType;
  /** Full name, for individual/foreign customers. */
  fullName: string | null;
  /** Company title, for company customers. */
  title: string | null;
  /** Birth date (`yyyy-MM-dd`), for individual/foreign customers. */
  birthDate: string | null;
  /** Primary email address, if supplied. */
  email: string | null;
  /** Primary phone number, if supplied. */
  phoneNumber: string | null;
  /** Nationality, for individual/foreign customers. */
  nationality: Nationality | null;
}

/** Input to `validateProposalCreate`: the proposal being created. */
export interface ProposalCreateValidationInput {
  /** The product branch (e.g. `KASKO`, `TRAFIK`, `DASK`). */
  productBranch: ProductBranch;
  /** The insured customer's id. */
  insuredCustomerId: string;
  /** The insurer (policyholder) customer's id. */
  insurerCustomerId: string;
  /** The channel the proposal is created through. */
  channel: Channel;
  /** The selected coverage group ids, if any. */
  coverageGroupIds: string[] | null;
  /** The requested policy start date (`yyyy-MM-dd`), if supplied. */
  policyStartDate: string | null;
}

/** Input to `validateProposalProductRevise`: the proposal product being revised. */
export interface ProposalProductReviseValidationInput {
  /** The proposal's id. */
  proposalId: string;
  /** The proposal product's id being revised. */
  proposalProductId: string;
  /** The proposal's product branch. */
  productBranch: ProductBranch;
  /** The insurance product id of the product being revised. */
  insuranceProductId: number;
  /** The insurance company id of the product being revised. */
  insuranceCompanyId: number;
}

/**
 * The input delivered to each validation hook, keyed by the hook's export name. All ids are strings;
 * dates are `yyyy-MM-dd`.
 */
export interface ValidationPayloads {
  /** A customer is being created. */
  validateCustomerCreate: CustomerCreateValidationInput;
  /** A customer is being updated. */
  validateCustomerUpdate: CustomerUpdateValidationInput;
  /** A proposal is being created. */
  validateProposalCreate: ProposalCreateValidationInput;
  /** A proposal product is being revised. */
  validateProposalProductRevise: ProposalProductReviseValidationInput;
}

/** The name of a validation hook (one of the keys of {@link ValidationPayloads}). */
export type ValidationName = keyof ValidationPayloads;

/** A single validation failure. Surfaced to the caller as part of the 422 response. */
export interface ValidationError {
  /** The offending field, if the error is field-specific. */
  field?: string;
  /** A human-readable reason the input was rejected. */
  message: string;
  /** An optional machine-readable code. */
  code?: string;
}

/**
 * The verdict a validation hook returns. `{ ok: true }` approves; `{ ok: false, errors }` rejects and
 * blocks the operation. Returning nothing (or throwing) is treated as a failure and also blocks.
 */
export interface ValidationResult {
  /** Whether the input is approved. */
  ok: boolean;
  /** The reasons for rejection, when `ok` is `false`. */
  errors?: ValidationError[];
}

/**
 * The type of a validation-hook export. Annotate a named export with it so `ctx` and `input` are typed,
 * and so the compiler enforces that you return a {@link ValidationResult} (validation is fail-closed):
 *
 * @example
 * export const validateCustomerCreate: ValidationHook<'validateCustomerCreate', Config> = (ctx, input) => {
 *   if (input.email !== null && input.email.endsWith('@blocked.example')) {
 *     return { ok: false, errors: [{ field: 'email', message: 'This email domain is not allowed' }] };
 *   }
 *   return { ok: true };
 * };
 */
export type ValidationHook<V extends ValidationName, Config = unknown> = (
  ctx: Ctx<Config>,
  input: ValidationPayloads[V],
) => ValidationResult | Promise<ValidationResult>;
