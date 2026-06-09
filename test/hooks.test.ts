import { describe, expect, test } from 'bun:test';

import type { Ctx } from '../src/context';
import type { TransformHook } from '../src/transform';
import type { ValidationHook } from '../src/validation';

interface Config {
  blockedDomain: string;
}

// The hooks never touch ctx in these tests; a cast keeps the focus on the hook contract.
const ctx = {} as Ctx<Config>;

describe('ValidationHook', () => {
  const validateCustomerCreate: ValidationHook<'validateCustomerCreate', Config> = (_ctx, input) => {
    if (input.email?.endsWith('@blocked.example')) {
      return { ok: false, errors: [{ field: 'email', message: 'blocked' }] };
    }
    return { ok: true };
  };

  test('approves a clean input', async () => {
    const verdict = await validateCustomerCreate(ctx, {
      customerType: 'INDIVIDUAL',
      identityNumber: '11111111111',
      taxNumber: null,
      fullName: 'Ada Lovelace',
      title: null,
      birthDate: '1990-01-01',
      email: 'ada@example.com',
      phoneNumber: null,
      nationality: 'TURK',
      channel: 'WEBSITE',
    });

    expect(verdict).toEqual({ ok: true });
  });

  test('rejects a blocked email with a field error', async () => {
    const verdict = await validateCustomerCreate(ctx, {
      customerType: 'INDIVIDUAL',
      identityNumber: null,
      taxNumber: null,
      fullName: null,
      title: null,
      birthDate: null,
      email: 'spam@blocked.example',
      phoneNumber: null,
      nationality: null,
      channel: 'WEBSITE',
    });

    expect(verdict).toEqual({ ok: false, errors: [{ field: 'email', message: 'blocked' }] });
  });
});

describe('TransformHook', () => {
  test('customer transform returns only the changed soft fields', async () => {
    const transformCustomerCreate: TransformHook<'transformCustomerCreate', Config> = (_ctx, input) => {
      if (input.fullName === null) return; // fail-open: no change
      return { fullName: input.fullName.toLocaleUpperCase('en-US') };
    };

    expect(
      await transformCustomerCreate(ctx, {
        customerType: 'INDIVIDUAL',
        identityNumber: null,
        taxNumber: null,
        fullName: 'ada',
        title: null,
        birthDate: null,
        email: null,
        phoneNumber: null,
        gender: null,
        maritalStatus: null,
        educationStatus: null,
        nationality: null,
        job: null,
        channel: 'WEBSITE',
      }),
    ).toEqual({ fullName: 'ADA' });
  });

  test('igw transform returns additions-only keys', async () => {
    const transformIgwProposalCreate: TransformHook<'transformIgwProposalCreate', Config> = () => ({
      AcenteRef: ['42'],
    });

    expect(await transformIgwProposalCreate(ctx, { keys: {}, productBranch: 'KASKO', insuranceCompanyId: null })).toEqual(
      { AcenteRef: ['42'] },
    );
  });
});
