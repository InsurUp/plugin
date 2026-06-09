/**
 * `@insurup/plugin` — TypeScript authoring SDK for InsurUp plugins.
 *
 * Declare config with {@link defineConfig}, type `ctx.config` with {@link Infer}, and annotate each
 * hook export with the matching type — {@link EventHook} (async, fire-and-forget), {@link ValidationHook}
 * (synchronous, fail-closed), or {@link TransformHook} (synchronous, fail-open). The host-injected global
 * `fetch` is typed via the `@insurup/plugin/globals` ambient declaration — add it to your tsconfig `types`.
 */

export { defineConfig } from './config';
export type { ConfigSchema, Infer } from './config';
export type { Ctx, DataApi, HttpApi, Logger } from './context';
export type { EventHook, EventName, EventPayloads } from './events';
export type { Fetch, PluginHeaders, PluginRequestInit, PluginResponse } from './http';
export type {
  CustomerCreateValidationInput, CustomerUpdateValidationInput, ProposalCreateValidationInput,
  ProposalProductReviseValidationInput, ValidationError, ValidationHook, ValidationName,
  ValidationPayloads, ValidationResult,
} from './validation';
export type {
  CustomerCreateTransformInput, CustomerTransform, CustomerUpdateTransformInput, IgwKeyAdditions,
  IgwTransformInput, TransformContracts, TransformHook, TransformName,
} from './transform';
export type { User, UserType } from './user';
export type {
  AgentInsuranceCompanyType, AssetType, CaseMainState, CaseSubState, CaseType, Channel, CustomerType,
  EducationStatus, Gender, Job, MaritalStatus, Nationality, PaymentOption, ProductBranch, ProposalState,
} from "./enums";
export type { CustomerView, PolicyView, ProductView, ProposalView } from "./views";
