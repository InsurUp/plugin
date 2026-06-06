/**
 * Typed config builder. `defineConfig` yields BOTH a TypeScript type (via {@link Infer}) and, at
 * runtime, the JSON Schema the InsurUp plugin host reads. The CLI's bundler inlines this package, so
 * at runtime `configSchema` *is* the plain JSON Schema object — exactly what the host serializes with
 * `JSON.stringify(configSchema)`.
 */

type Json = Record<string, unknown>;

/** Base for every config field. Carries a phantom `_type` for inference and a JSON Schema fragment. */
abstract class Field<T> {
  /** The accumulated JSON Schema fragment for this field (a plain object — no class leaks into output). */
  readonly schema: Json;
  /** True once {@link Field.default} has been called; drives whether the field is `required`. */
  hasDefault = false;
  /** Phantom carrier for the inferred value type. Never present at runtime. */
  declare readonly _type: T;

  constructor(type: string) {
    this.schema = { type };
  }

  /** Adds a human-readable description (JSON Schema `description`). */
  describe(description: string): this {
    this.schema.description = description;
    return this;
  }

  /** Sets a default value. Defaulted fields are optional for the agent — the host fills them at runtime. */
  default(value: T): this {
    this.schema.default = value;
    this.hasDefault = true;
    return this;
  }
}

/** A string field. */
class StringField extends Field<string> {
  constructor() {
    super('string');
  }

  /** Minimum length (JSON Schema `minLength`). */
  min(length: number): this {
    this.schema.minLength = length;
    return this;
  }

  /** Maximum length (JSON Schema `maxLength`). */
  max(length: number): this {
    this.schema.maxLength = length;
    return this;
  }

  /** A regex the value must match (JSON Schema `pattern`). */
  pattern(regex: string): this {
    this.schema.pattern = regex;
    return this;
  }

  /** Marks the field secret (`writeOnly`). The host encrypts it at rest and masks it in responses. */
  secret(): this {
    this.schema.writeOnly = true;
    return this;
  }
}

/** A number field. */
class NumberField extends Field<number> {
  constructor() {
    super('number');
  }

  /** Minimum value (JSON Schema `minimum`). */
  min(value: number): this {
    this.schema.minimum = value;
    return this;
  }

  /** Maximum value (JSON Schema `maximum`). */
  max(value: number): this {
    this.schema.maximum = value;
    return this;
  }

  /** Restricts to integers (JSON Schema `type: "integer"`). */
  int(): this {
    this.schema.type = 'integer';
    return this;
  }
}

/** A boolean field. */
class BooleanField extends Field<boolean> {
  constructor() {
    super('boolean');
  }
}

/** A string-enum field. */
class EnumField<T extends string> extends Field<T> {
  constructor(values: readonly T[]) {
    super('string');
    this.schema.enum = [...values];
  }
}

/** The builder handed to {@link defineConfig}. */
interface Builder {
  /** A string field. */
  string(): StringField;
  /** A number field. */
  number(): NumberField;
  /** A boolean field. */
  boolean(): BooleanField;
  /** A secret string field (`writeOnly`) — encrypted at rest, masked in responses. */
  secret(): StringField;
  /** A string field constrained to a fixed set of literal values. */
  enum<const T extends readonly string[]>(values: T): EnumField<T[number]>;
}

const builder: Builder = {
  string: () => new StringField(),
  number: () => new NumberField(),
  boolean: () => new BooleanField(),
  secret: () => new StringField().secret(),
  enum<const T extends readonly string[]>(values: T): EnumField<T[number]> {
    return new EnumField<T[number]>(values);
  },
};

type Shape = Record<string, Field<unknown>>;
type InferShape<S extends Shape> = { [K in keyof S]: S[K]['_type'] };

/** A JSON Schema for a plugin's config, branded with the inferred config type for {@link Infer}. */
export interface ConfigSchema<T> {
  readonly type: 'object';
  readonly properties: Record<string, Json>;
  readonly required?: readonly string[];
  /** Phantom carrier for the inferred config type. Never present at runtime. */
  readonly __config?: T;
}

/** Extracts the `ctx.config` type from a {@link ConfigSchema}. */
export type Infer<S> = S extends ConfigSchema<infer T> ? T : never;

/**
 * Declares a plugin's config. Returns the JSON Schema the host reads; pair with {@link Infer} to get
 * the typed `ctx.config`. Fields without a `.default()` are emitted as `required`.
 *
 * @example
 * export const configSchema = defineConfig((c) => ({
 *   apiKey:   c.secret().describe('Acme API key'),
 *   minScore: c.number().min(0).max(1).default(0.5),
 *   mode:     c.enum(['fast', 'thorough']),
 * }));
 * type Config = Infer<typeof configSchema>;
 */
export function defineConfig<S extends Shape>(build: (c: Builder) => S): ConfigSchema<InferShape<S>> {
  const shape = build(builder);
  const properties: Record<string, Json> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    properties[key] = field.schema;
    if (!field.hasDefault) {
      required.push(key);
    }
  }

  return required.length > 0
    ? { type: 'object', properties, required }
    : { type: 'object', properties };
}
