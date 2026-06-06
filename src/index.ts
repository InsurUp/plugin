/**
 * `@insurup/plugin` — TypeScript authoring SDK for InsurUp plugins.
 *
 * Declare config with {@link defineConfig}, type `ctx.config` with {@link Infer}, and annotate each
 * event-hook export with {@link EventHook}. The host-injected global `fetch` is typed via the
 * `@insurup/plugin/globals` ambient declaration — add it to your tsconfig `types`.
 */

export { defineConfig } from './config';
export type { ConfigSchema, Infer } from './config';
export type { Ctx, DataApi, HttpApi, Logger } from './context';
export type { EventHook, EventName, EventPayloads } from './events';
export type { Fetch, PluginHeaders, PluginRequestInit, PluginResponse } from './http';
export type { User, UserType } from './user';
export type { CustomerType, CustomerView, PolicyView, ProductView, ProposalView } from './views';
