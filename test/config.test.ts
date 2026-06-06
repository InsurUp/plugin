import { describe, expect, test } from 'bun:test';

import { defineConfig } from '../src/config';

describe('defineConfig', () => {
  test('emits the JSON Schema the host reads', () => {
    const schema = defineConfig((c) => ({
      apiKey: c.secret().describe('Acme API key'),
      minScore: c.number().min(0).max(1).default(0.5),
      mode: c.enum(['fast', 'thorough']),
      enabled: c.boolean().default(true),
    }));

    // Exactly what the host serializes via JSON.stringify(configSchema).
    expect(JSON.parse(JSON.stringify(schema))).toEqual({
      type: 'object',
      properties: {
        apiKey: { type: 'string', writeOnly: true, description: 'Acme API key' },
        minScore: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
        mode: { type: 'string', enum: ['fast', 'thorough'] },
        enabled: { type: 'boolean', default: true },
      },
      required: ['apiKey', 'mode'],
    });
  });

  test('marks only fields without a default as required', () => {
    const schema = defineConfig((c) => ({
      a: c.string(),
      b: c.string().default('x'),
    }));

    expect(schema.required).toEqual(['a']);
  });

  test('omits required entirely when every field has a default', () => {
    const schema = defineConfig((c) => ({ x: c.number().default(1) }));

    expect('required' in schema).toBe(false);
  });

  test('supports integers and string constraints', () => {
    const schema = defineConfig((c) => ({
      count: c.number().int().min(1),
      slug: c.string().min(3).max(20).pattern('^[a-z]+$'),
    }));

    expect(schema.properties).toEqual({
      count: { type: 'integer', minimum: 1 },
      slug: { type: 'string', minLength: 3, maxLength: 20, pattern: '^[a-z]+$' },
    });
  });
});
