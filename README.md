# @insurup/plugin

TypeScript authoring SDK for InsurUp plugins. Gives you a typed `ctx`, typed payloads for every hook
(events, validation, and transformation), a typed config (that doubles as the JSON Schema the host
reads), and the host-injected global `fetch` — all hand-written, zero runtime except {@link defineConfig}.

> Plugins run server-side, in-process, on the Jint JS engine, per agent. This package is the contract
> authors write against; the host inlines it at build time.

## Install

```sh
bun add @insurup/plugin
```

Add the ambient `fetch` typing to your plugin's `tsconfig.json`, and keep the DOM lib out so the only
`fetch`/`Response` in scope is the host's narrowed one:

```jsonc
{
  "compilerOptions": {
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["@insurup/plugin/globals"], // injects the global `fetch`
    "strict": true
  }
}
```

## Authoring a plugin

A plugin is an ES module. Export a `configSchema` (optional) and one function per hook, named after the
hook. The host derives the hooks from the export names — `on*` for events, `validate*` for validation,
`transform*` for transformation.

```ts
import { defineConfig, type EventHook, type Infer } from '@insurup/plugin';

// Declare config once. `configSchema` IS the JSON Schema the host reads; `Infer` gives you the type.
export const configSchema = defineConfig((c) => ({
  apiKey: c.secret().describe('Acme API key'), //   → { type: "string", writeOnly: true }
  minScore: c.number().min(0).max(1).default(0.5), // → { type: "number", minimum, maximum, default }
  mode: c.enum(['fast', 'thorough']), //            → { type: "string", enum: [...] }
  enabled: c.boolean().default(true), //            → { type: "boolean", default: true }
}));
type Config = Infer<typeof configSchema>;

// Named export = the hook. `event` is the payload directly. `ctx.config` is your typed config.
export const onCustomerUpdated: EventHook<'onCustomerUpdated', Config> = async (ctx, event) => {
  if (!ctx.config.enabled) return;

  const customer = await ctx.data.getCustomerById(event.customerId);
  if (customer === null) return;

  const res = await fetch(`https://acme.example/score/${event.customerId}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${ctx.config.apiKey}` },
    body: JSON.stringify({ name: customer.name, mode: ctx.config.mode }),
  });

  if (res.ok) {
    const { score } = await res.json<{ score: number }>();
    ctx.log.info('scored', { score, passed: score >= ctx.config.minScore });
  }
};
```

### Config

`defineConfig` yields **both** the TypeScript type (via `Infer`) and, at runtime, the JSON Schema the
host reads. A field without `.default()` is emitted as `required`. The host applies `.default()`s at
runtime, so defaulted fields are always present in `ctx.config`. `.secret()` fields are encrypted at
rest and masked in API responses.

| Builder | JSON Schema |
| --- | --- |
| `c.string().min(3).max(20).pattern('^[a-z]+$')` | `{ type: "string", minLength, maxLength, pattern }` |
| `c.number().int().min(0).max(1)` | `{ type: "integer", minimum, maximum }` |
| `c.boolean()` | `{ type: "boolean" }` |
| `c.secret()` | `{ type: "string", writeOnly: true }` |
| `c.enum(['a', 'b'])` | `{ type: "string", enum: ["a", "b"] }` |
| `.describe('…')` | `description` |
| `.default(v)` | `default`, and drops the field from `required` |

### Events

Export a function named after the event. Each receives `(ctx, event)`; annotate with
`EventHook<'onEventName', Config>`. See `EventPayloads` for every event and its payload shape. Event
hooks run **asynchronously** after the operation commits — they cannot block or change it.

### Validation hooks

Export `validateCustomerCreate`, `validateCustomerUpdate`, `validateProposalCreate`, or
`validateProposalProductRevise`. Each runs **synchronously in the request path** and must return a
`ValidationResult` (`{ ok }` or `{ ok: false, errors }`). Validation is **fail-closed**: the operation
proceeds only when every matching plugin approves — a rejection, a thrown error, a timeout, or a plugin
that can't run all block the operation (HTTP 422). Annotate with `ValidationHook<'validateX', Config>`.

```ts
import { type ValidationHook } from '@insurup/plugin';

export const validateCustomerCreate: ValidationHook<'validateCustomerCreate', Config> = (ctx, input) => {
  if (input.email !== null && input.email.endsWith('@blocked.example')) {
    return { ok: false, errors: [{ field: 'email', message: 'This email domain is not allowed' }] };
  }
  return { ok: true };
};
```

### Transformation hooks

Export `transformCustomerCreate` / `transformCustomerUpdate` (reshape the customer's soft fields) or one
of the `transformIgw*` hooks (add keys to an outbound InsurGateway request). Each runs **synchronously in
the request path** and returns the change to apply — or nothing, for no change. Transformation is
**fail-open**: a hook that throws, times out, or returns an invalid shape simply contributes no change and
never blocks. Annotate with `TransformHook<'transformX', Config>`.

- **Customer** hooks return a `CustomerTransform` — only the soft fields you want to overwrite. Identity
  number, tax number, and customer type can never be changed.
- **InsurGateway** hooks return `IgwKeyAdditions` (`Record<string, string[]>`) — new keys only; existing
  and protected keys are never overwritten or removed.

```ts
import { type TransformHook } from '@insurup/plugin';

export const transformCustomerCreate: TransformHook<'transformCustomerCreate', Config> = (ctx, input) => {
  if (input.fullName === null) return; // no change
  return { fullName: input.fullName.toLocaleUpperCase('tr-TR') };
};
```

### `ctx`

| Member | Type |
| --- | --- |
| `ctx.agentId` | `string` |
| `ctx.now` | `string` (ISO-8601) |
| `ctx.user` | `User` |
| `ctx.config` | your `Config` |
| `ctx.log` | `debug \| info \| warn \| error(message, data?)` |
| `ctx.data` | `getCustomerById` · `getProposalById` · `getPolicyById` · `getProductById` |
| `ctx.http.fetch` | alias of the global `fetch` |

### `fetch`

The host injects a browser/Node-style global `fetch(url, options)` returning a narrowed `Response`:
`{ status, ok, headers.get(name), text(), json<T>() }`. Headers lookup is case-insensitive. Only http(s)
to public hosts is allowed; calls are capped and time-bounded by the host.

## npm packages

Plugins are bundled (the CLI inlines this package and your dependencies into one ES module). Pure
ECMAScript dependencies work; anything needing Node built-ins (`fs`, `crypto`, `Buffer`, `process`),
native addons, DOM, or timers does not — the sandbox provides standard ES built-ins plus the injected
`fetch` only. Keep bundles small; each invocation is bounded by statement/memory/wall-clock limits.

## Develop

```sh
bun install
bun test          # defineConfig → JSON Schema
bun run typecheck # library + tests
bun run lint
```

## Scope

Three hook categories, all derived from the export name:

| Category | Exports | Timing | Failure mode |
| --- | --- | --- | --- |
| **Event** | `on*` (e.g. `onCustomerUpdated`) | async, after commit | fire-and-forget |
| **Validation** | `validateCustomerCreate` · `validateCustomerUpdate` · `validateProposalCreate` · `validateProposalProductRevise` | sync, in request path | fail-closed (blocks on anything but `{ ok: true }`) |
| **Transformation** | `transformCustomerCreate` · `transformCustomerUpdate` · `transformIgwProposalCreate` · `transformIgwPolicyCreate` · `transformIgwTramer` · `transformIgwMernis` | sync, in request path | fail-open (no change on failure) |
