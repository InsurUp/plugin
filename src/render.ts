/**
 * Render hooks. Export a function named after the render point (e.g. `renderCustomerColumns`) and the host
 * runs it synchronously while the agent panel loads a grid page or a detail page, adding the plugin's own
 * columns or sections to it. The hook receives `(ctx, input)` and returns what to show.
 *
 * Two families exist, one pair per entity (customer, case, proposal, policy):
 * - **Columns** (`render*Columns`) — receive the rows of the grid page and return a
 *   {@link RenderColumnsResult}: the columns to add and one cell per row and column.
 * - **Detail** (`render*Detail`) — receive the entity and return a {@link RenderDetailSection}, or several.
 *
 * Rendering is **fail-open** and **side-effect-free**: a hook that throws, times out, or returns an
 * invalid shape simply contributes nothing, and nothing it returns is stored. A render hook has no
 * `ctx.data`, `ctx.write` or `fetch` budget — everything it may use is in its input — and a tighter time
 * limit than the other hooks. Annotate each export with {@link RenderHook} so both `ctx` and the input are
 * typed.
 *
 * The `html` a hook returns is sanitized by the host before it is shown:
 * - Tags: `a`, `b`, `strong`, `i`, `em`, `s`, `u`, `small`, `code`, `span`, `br`, `ul`, `ol`, `li`, and
 *   `<icon name="..." size="16" variant="regular" color="...">` for a Fluent UI icon.
 * - Classes: `iu-p-badge`, `iu-p-badge-success`, `iu-p-badge-warning`, `iu-p-badge-error`,
 *   `iu-p-badge-info`, `iu-p-muted`, `iu-p-strong`, `iu-p-mono`.
 * - Inline `style`: `color`, `background-color`, `font-weight`, `font-style`, `text-decoration` only.
 * Anything else is stripped. One value may be up to 8 KB; a plugin may add up to 16 columns to a grid and
 * up to 8 sections of 32 fields each to a detail page, and an output over a limit is dropped whole.
 */

import type { Ctx } from './context';
import type { CaseView, CustomerView, PolicyView, ProposalView } from './views';

/** Input to a `render*Columns` hook: the rows of the grid page the host could resolve. */
export interface RenderColumnsInput<Row> {
  /** One view per grid row, at most 100. */
  rows: Row[];
}

/** A grid column a plugin adds. */
export interface RenderColumn {
  /** A key, unique within the plugin, that the column's cells refer to. */
  key: string;
  /** The column's header. */
  title: string;
  /** An optional CSS width for the column. */
  width?: string;
  /** Whether the column stays hidden until a user turns it on. */
  hiddenByDefault?: boolean;
}

/** One cell of a plugin's column. */
export interface RenderCell {
  /** The `id` of the row the cell belongs to. */
  rowId: string;
  /** The `key` of the column the cell belongs to. */
  key: string;
  /** The cell's content, as HTML. */
  html: string;
}

/** What a `render*Columns` hook returns: the columns it adds and their cells. */
export interface RenderColumnsResult {
  /** The columns to add. */
  columns: RenderColumn[];
  /** The cells: one per row and column the plugin has something to show in. */
  cells: RenderCell[];
}

/** One field of a detail section. */
export interface RenderField {
  /** A key, unique within the plugin, that identifies the field. */
  key: string;
  /** The field's label. */
  title: string;
  /** The field's content, as HTML. */
  html: string;
}

/** A section a plugin adds to a detail page. */
export interface RenderDetailSection {
  /** The section's heading. */
  title?: string;
  /** The name of a Fluent UI icon for the section. */
  icon?: string;
  /** The section's fields. */
  fields: RenderField[];
}

/** What a `render*Detail` hook returns: one section, or several. */
export type RenderDetailResult = RenderDetailSection | RenderDetailSection[];

/** The input and result type for each render hook, keyed by the hook's export name. */
export interface RenderContracts {
  /** A page of the customer grid is being loaded. */
  renderCustomerColumns: { input: RenderColumnsInput<CustomerView>; result: RenderColumnsResult };
  /** A customer's detail page is being loaded. */
  renderCustomerDetail: { input: { customer: CustomerView }; result: RenderDetailResult };
  /** A page of the case grid is being loaded. */
  renderCaseColumns: { input: RenderColumnsInput<CaseView>; result: RenderColumnsResult };
  /** A case's detail page is being loaded. */
  renderCaseDetail: { input: { case: CaseView }; result: RenderDetailResult };
  /** A page of the proposal grid is being loaded. */
  renderProposalColumns: { input: RenderColumnsInput<ProposalView>; result: RenderColumnsResult };
  /** A proposal's detail page is being loaded. */
  renderProposalDetail: { input: { proposal: ProposalView }; result: RenderDetailResult };
  /** A page of the policy grid is being loaded. */
  renderPolicyColumns: { input: RenderColumnsInput<PolicyView>; result: RenderColumnsResult };
  /** A policy's detail page is being loaded. */
  renderPolicyDetail: { input: { policy: PolicyView }; result: RenderDetailResult };
}

/** The name of a render hook (one of the keys of {@link RenderContracts}). */
export type RenderName = keyof RenderContracts;

/**
 * The type of a render-hook export. Annotate a named export with it so `ctx` and `input` are typed and
 * the return type is checked. Returning nothing means "nothing to show" — rendering is fail-open:
 *
 * @example
 * export const renderCustomerColumns: RenderHook<'renderCustomerColumns', Config> = (ctx, input) => ({
 *   columns: [{ key: 'segment', title: 'Segment' }],
 *   cells: input.rows.map((row) => ({
 *     rowId: row.id,
 *     key: 'segment',
 *     html: row.policyCount > 2 ? '<span class="iu-p-badge iu-p-badge-success">Loyal</span>' : '',
 *   })),
 * });
 *
 * @example
 * export const renderPolicyDetail: RenderHook<'renderPolicyDetail', Config> = (ctx, input) => {
 *   const code = input.policy.metadata?.campaignCode;
 *   return {
 *     title: 'Campaign',
 *     fields: [{ key: 'code', title: 'Code', html: typeof code === 'string' ? code : '-' }],
 *   };
 * };
 */
export type RenderHook<R extends RenderName, Config = unknown> = (
  ctx: Ctx<Config>,
  input: RenderContracts[R]['input'],
) => RenderContracts[R]['result'] | undefined | Promise<RenderContracts[R]['result'] | undefined>;
