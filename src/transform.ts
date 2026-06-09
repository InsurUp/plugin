/**
 * Transformation hooks. Export a function named after the transformation point (e.g.
 * `transformCustomerCreate`) and the host runs it synchronously in the request path, letting the plugin
 * reshape the outbound input before the operation continues. The hook receives `(ctx, input)` and
 * returns the change it wants to make.
 *
 * Transformation is **fail-open**: a hook that returns nothing, returns an invalid shape, throws, or
 * times out simply contributes no change — it never blocks the operation. Annotate each export with
 * {@link TransformHook} so both `ctx` and the input are typed.
 *
 * Two families exist:
 * - **Customer** (`transformCustomerCreate` / `transformCustomerUpdate`) — return a
 *   {@link CustomerTransform}: the soft fields to overwrite. Identity number, tax number, and customer
 *   type can never be changed.
 * - **InsurGateway** (`transformIgw*`) — return {@link IgwKeyAdditions}: new keys to add to the outbound
 *   request. Additions only; existing and protected keys cannot be overwritten or removed.
 */

import type { Ctx } from './context';
import type {
  Channel,
  CustomerType,
  EducationStatus,
  Gender,
  Job,
  MaritalStatus,
  Nationality,
  ProductBranch,
} from './enums';

/** Input to `transformCustomerCreate`: the customer being created. Identity/tax/type/channel are read-only context. */
export interface CustomerCreateTransformInput {
  /** The customer subtype. Read-only. */
  customerType: CustomerType;
  /** National identity number, for individual/foreign customers. Read-only. */
  identityNumber: string | null;
  /** Tax number, for company customers. Read-only. */
  taxNumber: string | null;
  /** Full name, for individual/foreign customers. */
  fullName: string | null;
  /** Company title, for company customers. */
  title: string | null;
  /** Birth date (`yyyy-MM-dd`), for individual/foreign customers. */
  birthDate: string | null;
  /** Primary email address. */
  email: string | null;
  /** Primary phone number, in E.164 form. */
  phoneNumber: string | null;
  /** Gender, for individual/foreign customers. */
  gender: Gender | null;
  /** Marital status, for individual/foreign customers. */
  maritalStatus: MaritalStatus | null;
  /** Education status, for individual/foreign customers. */
  educationStatus: EducationStatus | null;
  /** Nationality, for individual/foreign customers. */
  nationality: Nationality | null;
  /** Job, for individual/foreign customers. */
  job: Job | null;
  /** The channel the customer is created through. Read-only. */
  channel: Channel;
}

/** Input to `transformCustomerUpdate`: the customer being updated. Id/type are read-only context. */
export interface CustomerUpdateTransformInput {
  /** The id of the customer being updated. Read-only. */
  customerId: string;
  /** The customer subtype. Read-only. */
  customerType: CustomerType;
  /** Full name, for individual/foreign customers. */
  fullName: string | null;
  /** Company title, for company customers. */
  title: string | null;
  /** Birth date (`yyyy-MM-dd`), for individual/foreign customers. */
  birthDate: string | null;
  /** Primary email address. */
  email: string | null;
  /** Primary phone number, in E.164 form. */
  phoneNumber: string | null;
  /** Gender, for individual/foreign customers. */
  gender: Gender | null;
  /** Marital status, for individual/foreign customers. */
  maritalStatus: MaritalStatus | null;
  /** Education status, for individual/foreign customers. */
  educationStatus: EducationStatus | null;
  /** Nationality, for individual/foreign customers. */
  nationality: Nationality | null;
  /** Job, for individual/foreign customers. */
  job: Job | null;
}

/**
 * What a customer transform hook returns: the soft fields to overwrite. Omit a field (or leave it
 * `undefined`) to leave it unchanged. Identity number, tax number, and customer type cannot be changed
 * and are not part of this shape; any field that fails the platform's own value-object rules is skipped.
 */
export interface CustomerTransform {
  /** New full name. */
  fullName?: string;
  /** New birth date (`yyyy-MM-dd`). */
  birthDate?: string;
  /** New primary email address. */
  email?: string;
  /** New primary phone number, in E.164 form. */
  phoneNumber?: string;
  /** New gender. */
  gender?: Gender;
  /** New marital status. */
  maritalStatus?: MaritalStatus;
  /** New education status. */
  educationStatus?: EducationStatus;
  /** New nationality. */
  nationality?: Nationality;
  /** New job. */
  job?: Job;
  /** New company title. */
  title?: string;
}

/**
 * Input to the `transformIgw*` hooks: the outbound InsurGateway request keys (protected keys already
 * stripped) plus light context. Each value is a list of strings.
 */
export interface IgwTransformInput {
  /** The current outbound request keys, by key name, with protected keys removed. */
  keys: Record<string, string[]>;
  /** The product branch this request is for, or null when not applicable. */
  productBranch: ProductBranch | null;
  /** The target insurance company id, or null when not applicable. */
  insuranceCompanyId: number | null;
}

/**
 * What an InsurGateway transform hook returns: the new keys to add to the outbound request, by key name.
 * Additions only — keys already present (or protected) are ignored, never overwritten.
 */
export type IgwKeyAdditions = Record<string, string[]>;

/**
 * The input and result type for each transform hook, keyed by the hook's export name.
 */
export interface TransformContracts {
  /** A customer is being created. */
  transformCustomerCreate: { input: CustomerCreateTransformInput; result: CustomerTransform };
  /** A customer is being updated. */
  transformCustomerUpdate: { input: CustomerUpdateTransformInput; result: CustomerTransform };
  /** An InsurGateway proposal-create request is being built. */
  transformIgwProposalCreate: { input: IgwTransformInput; result: IgwKeyAdditions };
  /** An InsurGateway policy-create request is being built. */
  transformIgwPolicyCreate: { input: IgwTransformInput; result: IgwKeyAdditions };
  /** An InsurGateway TRAMER query is being built. */
  transformIgwTramer: { input: IgwTransformInput; result: IgwKeyAdditions };
  /** An InsurGateway MERNIS query is being built. */
  transformIgwMernis: { input: IgwTransformInput; result: IgwKeyAdditions };
}

/** The name of a transform hook (one of the keys of {@link TransformContracts}). */
export type TransformName = keyof TransformContracts;

/**
 * The type of a transform-hook export. Annotate a named export with it so `ctx` and `input` are typed
 * and the return type is checked. Returning nothing (`return;` / `undefined`) means "no change" —
 * transforms are fail-open:
 *
 * @example
 * export const transformCustomerCreate: TransformHook<'transformCustomerCreate', Config> = (ctx, input) => {
 *   if (input.fullName === null) return;
 *   return { fullName: input.fullName.toLocaleUpperCase('tr-TR') };
 * };
 *
 * @example
 * export const transformIgwProposalCreate: TransformHook<'transformIgwProposalCreate', Config> = (ctx, input) => {
 *   return { AcenteRef: [ctx.config.agentRef] };
 * };
 */
export type TransformHook<T extends TransformName, Config = unknown> = (
  ctx: Ctx<Config>,
  input: TransformContracts[T]['input'],
) =>
  | TransformContracts[T]['result']
  | undefined
  | Promise<TransformContracts[T]['result'] | undefined>;
