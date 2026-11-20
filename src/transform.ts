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
 * Three families exist:
 * - **Customer** (`transformCustomerCreate` / `transformCustomerUpdate` /
 *   `transformCustomerExternalLookup`) — return a {@link CustomerTransform}: the soft fields to overwrite.
 *   Identity number, tax number, and customer type can never be changed.
 * - **Vehicle** (`transformVehicleCreate` / `transformVehicleExternalLookup`) — return a
 *   {@link VehicleTransform}: the vehicle fields to overwrite. The owning customer and the plate can never
 *   be changed.
 * - **InsurGateway** (`transformIgw*`) — return {@link IgwKeyAdditions}: new keys to add to the outbound
 *   request. Additions only; existing and protected keys cannot be overwritten or removed.
 *
 * The two `*ExternalLookup` hooks run when an agent looks a customer or a vehicle up before filling the
 * form: the plugin answers from an outside system, and its fields win over the MERNIS / TRAMER answer,
 * which only fills what the plugins left empty.
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
  VehicleFuelType,
  VehicleUtilizationStyle,
} from './enums';
import type { Metadata } from './views';

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
  /** City insurance-parameter reference. */
  cityReference: string | null;
  /** District insurance-parameter reference. */
  districtReference: string | null;
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
  /** City insurance-parameter reference. */
  cityReference: string | null;
  /** District insurance-parameter reference. */
  districtReference: string | null;
}

/**
 * Input to `transformCustomerExternalLookup`: the identity an agent is looking up before filling the
 * customer form. Carries PII; stays in-process.
 */
export interface CustomerExternalLookupTransformInput {
  /** The looked-up customer's subtype. */
  customerType: CustomerType;
  /** National identity number, for individual/foreign customers. */
  identityNumber: string | null;
  /** Tax number, for company customers. */
  taxNumber: string | null;
  /** The birth date (`yyyy-MM-dd`) the agent typed, when there is one. */
  birthDate: string | null;
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
  /** New city insurance-parameter reference. */
  cityReference?: string;
  /** New district insurance-parameter reference. Applied only together with the city it belongs to. */
  districtReference?: string;
  /**
   * A merge patch (RFC 7396) for the customer's metadata. Applied by `transformCustomerCreate` only: an
   * update hook's customer already exists, and a lookup saves nothing.
   */
  metadata?: Metadata;
}

/**
 * Input to `transformVehicleCreate`: the vehicle being added and the owning customer's identity, so the
 * plugin can look the vehicle up in an outside system. Carries PII; stays in-process.
 */
export interface VehicleCreateTransformInput {
  /** The id of the customer the vehicle is added to. Read-only. */
  customerId: string;
  /** The owning customer's subtype. Read-only. */
  customerType: CustomerType;
  /** The owning customer's national identity number, for individual/foreign customers. Read-only. */
  identityNumber: string | null;
  /** The owning customer's tax number, for company customers. Read-only. */
  taxNumber: string | null;
  /** The plate's city code (1–81). Read-only. */
  plateCity: number;
  /** The plate's letters-and-digits part, or null for a plate without one. Read-only. */
  plateCode: string | null;
  /** Model year. */
  modelYear: number | null;
  /** Brand insurance-parameter reference. */
  brandReference: string | null;
  /** Model insurance-parameter reference. */
  modelTypeReference: string | null;
  /** Utilization style. */
  utilizationStyle: VehicleUtilizationStyle;
  /** Fuel type. */
  fuelType: VehicleFuelType | null;
  /** Engine number. */
  engineNumber: string | null;
  /** Chassis number (VIN). */
  chassisNumber: string | null;
  /** Registration-document serial letters. */
  documentSerialCode: string | null;
  /** Registration-document serial number. */
  documentSerialNumber: string | null;
  /** Registration date (`yyyy-MM-dd`) of the current ownership. */
  registrationDate: string | null;
  /** First-ever registration date (`yyyy-MM-dd`). */
  firstRegistrationDate: string | null;
  /** Seat count. */
  seatNumber: number | null;
}

/**
 * Input to `transformVehicleExternalLookup`: the plate an agent is looking up before filling the vehicle
 * form, and the owning customer's identity. Carries PII; stays in-process.
 */
export interface VehicleExternalLookupTransformInput {
  /** The owning customer's subtype. */
  customerType: CustomerType;
  /** The owning customer's national identity number, for individual/foreign customers. */
  identityNumber: string | null;
  /** The owning customer's tax number, for company customers. */
  taxNumber: string | null;
  /** The plate's city code (1–81). */
  plateCity: number;
  /** The plate's letters and digits after the city code; empty for an unplated vehicle. */
  plateCode: string | null;
  /** The registration-document serial letters the agent typed, when there are any. */
  documentSerialCode: string | null;
  /** The registration-document serial number the agent typed, when there is one. */
  documentSerialNumber: string | null;
}

/**
 * What a vehicle transform hook returns: the fields to overwrite. Omit a field (or leave it `undefined`)
 * to leave it unchanged. The owning customer and the plate cannot be changed and are not part of this
 * shape; any field that fails the platform's own value-object rules is skipped.
 */
export interface VehicleTransform {
  /** New model year. The model is set only when the year, brand and model references are all there. */
  modelYear?: number;
  /** New brand insurance-parameter reference. */
  brandReference?: string;
  /** New model insurance-parameter reference. */
  modelTypeReference?: string;
  /** New utilization style. */
  utilizationStyle?: VehicleUtilizationStyle;
  /** New fuel type. A custom LPG setting already on the vehicle is kept. */
  fuelType?: VehicleFuelType;
  /** New engine number. */
  engineNumber?: string;
  /** New chassis number (VIN). */
  chassisNumber?: string;
  /** New registration-document serial letters. Applied only together with `documentSerialNumber`. */
  documentSerialCode?: string;
  /** New registration-document serial number. Applied only together with `documentSerialCode`. */
  documentSerialNumber?: string;
  /** New registration date (`yyyy-MM-dd`) of the current ownership. */
  registrationDate?: string;
  /** New first-ever registration date (`yyyy-MM-dd`). */
  firstRegistrationDate?: string;
  /** New seat count. */
  seatNumber?: number;
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
  /** A customer is being looked up before the form is filled. */
  transformCustomerExternalLookup: { input: CustomerExternalLookupTransformInput; result: CustomerTransform };
  /** A vehicle is being added to a customer. */
  transformVehicleCreate: { input: VehicleCreateTransformInput; result: VehicleTransform };
  /** A vehicle is being looked up before the form is filled. */
  transformVehicleExternalLookup: { input: VehicleExternalLookupTransformInput; result: VehicleTransform };
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
