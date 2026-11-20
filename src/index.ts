/**
 * `@insurup/plugin` — TypeScript authoring SDK for InsurUp plugins.
 *
 * Declare config with {@link defineConfig}, type `ctx.config` with {@link Infer}, and annotate each
 * hook export with the matching type — {@link EventHook} (async, fire-and-forget), {@link ValidationHook}
 * (synchronous, fail-closed), {@link TransformHook} (synchronous, fail-open), or {@link RenderHook}
 * (synchronous, fail-open, side-effect-free). The host-injected global `fetch` is typed via the
 * `@insurup/plugin/globals` ambient declaration — add it to your tsconfig `types`.
 */

export { defineConfig } from './config';
export type { ConfigSchema, Infer } from './config';
export type { Ctx, DataApi, HttpApi, Logger, WriteApi } from './context';
export type { EventHook, EventName, EventPayloads } from './events';
export type { Fetch, PluginHeaders, PluginRequestInit, PluginResponse } from './http';
export type {
  CustomerCreateValidationInput, CustomerUpdateValidationInput, ProposalCreateValidationInput,
  ProposalProductPurchaseValidationInput, ProposalProductReviseValidationInput, ProposalVehicle,
  ValidationError, ValidationHook, ValidationName, ValidationPayloads, ValidationResult,
} from './validation';
export type {
  CustomerCreateTransformInput, CustomerExternalLookupTransformInput, CustomerTransform,
  CustomerUpdateTransformInput, IgwKeyAdditions, IgwTransformInput, TransformContracts, TransformHook,
  TransformName, VehicleCreateTransformInput, VehicleExternalLookupTransformInput, VehicleTransform,
} from './transform';
export type {
  RenderCell, RenderColumn, RenderColumnsInput, RenderColumnsResult, RenderContracts,
  RenderDetailResult, RenderDetailSection, RenderField, RenderHook, RenderName,
} from './render';
export type { User, UserType } from './user';
export type {
  AgentInsuranceCompanyType, AssetType, CaseMainState, CaseStatus, CaseSubState, CaseType, Channel,
  Currency, CustomerType, EducationStatus, Gender, Job, MaritalStatus, Nationality, PaymentOption,
  PolicyState, ProductBranch, ProposalErrorSource, ProposalState, VehicleFuelType, VehicleUtilizationStyle,
} from "./enums";
export type {
  CaseView, CustomerRef, CustomerView, Metadata, PolicyView, ProductView, ProposalView,
} from "./views";
