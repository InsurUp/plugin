/**
 * Event hooks. Export a function named after the event (e.g. `onCustomerUpdated`) and the host
 * dispatches the matching business event to it. The hook receives `(ctx, event)` where `event` is the
 * payload directly (no envelope) — read `event.customerId`. Annotate each export with
 * {@link EventHook} so both `ctx` and the payload are typed.
 */

import type { Ctx } from './context';
import type {
  AgentInsuranceCompanyType,
  AssetType,
  CaseMainState,
  CaseSubState,
  CaseType,
  Channel,
  CustomerType,
  PaymentOption,
  ProductBranch,
} from './enums';

/**
 * The payload delivered to each event hook, keyed by the hook's export name. All ids are strings;
 * dates are `yyyy-MM-dd`, timestamps are ISO-8601.
 */
export interface EventPayloads {
  /** A proposal was created. */
  onProposalCreated: {
    proposalId: string;
    insuredCustomerId: string;
    insurerCustomerId: string;
    productBranch: ProductBranch;
    assetType: AssetType | null;
    assetId: string | null;
    channel: Channel;
  };
  /** A proposal product purchase was attempted. */
  onProposalProductPurchaseAttempted: {
    proposalId: string;
    proposalProductId: string;
    policyId: string | null;
    insuranceProductId: number;
    installmentNumber: number;
    success: boolean;
    errorMessage: string | null;
    channel: Channel;
    paymentOption: PaymentOption;
  };
  /** A premium was received for a proposal product. */
  onProposalProductPremiumReceived: {
    success: boolean;
    errorMessage: string | null;
    productId: number;
    insuranceCompanyId: number;
    insuranceProposalReference: string;
    needsInvestigationByCompany: boolean;
  };
  /** Coverage was received for a proposal product. */
  onProposalProductCoverageReceived: {
    productId: number;
    insuranceProposalReference: string;
  };
  /** A policy was created or updated. */
  onPolicyCreatedOrUpdated: {
    policyId: string;
    endorsementNumber: number;
    renewalNumber: number;
    isCancel: boolean;
    insuredCustomerId: string;
    insurerCustomerId: string;
    productBranch: ProductBranch;
    startDate: string;
    endDate: string;
  };
  /** A policy was received from the insurance company. */
  onPolicyReceived: {
    success: boolean;
    errorMessage: string | null;
    proposalId: string;
    productId: number;
    installmentNumber: number;
    insuranceCompanyId: number;
    productBranch: ProductBranch;
    policyId: string | null;
  };
  /** An async policy-creation request was responded to. */
  onAsyncPolicyCreationResponded: {
    success: boolean;
    errorMessage: string | null;
    proposalId: string;
    proposalProductId: string;
    installmentNumber: number;
    policyId: string | null;
  };
  /** A customer was updated. */
  onCustomerUpdated: {
    customerId: string;
    customerType: CustomerType;
  };
  /** An asset was created. */
  onAssetCreated: {
    customerId: string;
    assetId: string;
    assetType: AssetType;
  };
  /** An asset was updated. */
  onAssetUpdated: {
    customerId: string;
    assetId: string;
    assetType: AssetType;
  };
  /** An asset's policy coverage changed. */
  onAssetPolicyChanged: {
    customerId: string;
    assetId: string;
    assetType: AssetType;
    productBranch: ProductBranch;
    policyEndDate: string | null;
    policyInsuranceCompanyId: number | null;
  };
  /** A case was created. */
  onCaseCreated: {
    id: string;
    ref: string;
    customerId: string;
    type: CaseType;
    productBranch: ProductBranch | null;
  };
  /** A case changed state. */
  onCaseStateChanged: {
    id: string;
    ref: string;
    customerId: string;
    state: CaseMainState;
    subState: CaseSubState;
  };
  /** An agent's insurance-company link was updated. */
  onAgentInsuranceCompanyUpdated: {
    agentInsuranceCompanyId: string;
    insuranceCompanyId: number;
    type: AgentInsuranceCompanyType;
  };
  /** An agent's insurance-company link was removed. */
  onAgentInsuranceCompanyRemoved: {
    agentInsuranceCompanyId: string;
    insuranceCompanyReference: number;
    type: AgentInsuranceCompanyType;
  };
  /** An agent user was created. */
  onAgentUserCreated: {
    userId: string;
  };
}

/** The name of an event hook (one of the keys of {@link EventPayloads}). */
export type EventName = keyof EventPayloads;

/**
 * The type of an event-hook export. Annotate a named export with it so `ctx` and `event` are typed:
 *
 * @example
 * export const onCustomerUpdated: EventHook<'onCustomerUpdated', Config> = (ctx, event) => {
 *   ctx.log.info('updated', { id: event.customerId });
 * };
 */
export type EventHook<E extends EventName, Config = unknown> = (
  ctx: Ctx<Config>,
  event: EventPayloads[E],
) => void | Promise<void>;
