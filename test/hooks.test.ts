import { describe, expect, test } from 'bun:test';

import type { Ctx } from '../src/context';
import type { EventHook } from '../src/events';
import type { RenderHook } from '../src/render';
import type { TransformHook } from '../src/transform';
import type { ValidationHook } from '../src/validation';
import type { CustomerView, PolicyView } from '../src/views';

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

describe('ValidationHook for a purchase', () => {
  const sold = ['KASKO', 'TRAFIK'];
  const validateProposalProductPurchase: ValidationHook<'validateProposalProductPurchase', Config> = (_ctx, input) =>
    sold.includes(input.productBranch)
      ? { ok: true }
      : { ok: false, errors: [{ field: 'productBranch', message: `${input.productBranch} is not sold here` }] };

  const purchase = {
    proposalId: 'proposal-1',
    proposalProductId: 'product-1',
    insuranceProductId: 7,
    insuranceCompanyId: 45,
    channel: 'MANUAL',
    installmentNumber: 3,
    paymentOption: 'SYNC_OPEN_ACCOUNT',
  } as const;

  test('approves a branch that is sold', async () => {
    const verdict = await validateProposalProductPurchase(ctx, { ...purchase, productBranch: 'KASKO' });

    expect(verdict).toEqual({ ok: true });
  });

  test('refuses another branch with a field error', async () => {
    const verdict = await validateProposalProductPurchase(ctx, { ...purchase, productBranch: 'TSS' });

    expect(verdict).toEqual({ ok: false, errors: [{ field: 'productBranch', message: 'TSS is not sold here' }] });
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
        cityReference: null,
        districtReference: null,
        channel: 'WEBSITE',
      }),
    ).toEqual({ fullName: 'ADA' });
  });

  test('vehicle lookup answers with the fields it knows', async () => {
    const transformVehicleExternalLookup: TransformHook<'transformVehicleExternalLookup', Config> = (_ctx, input) =>
      input.plateCode === null ? undefined : { modelYear: 2021, fuelType: 'DIESEL' };

    const lookup = {
      customerType: 'INDIVIDUAL',
      identityNumber: '11111111111',
      taxNumber: null,
      plateCity: 34,
      documentSerialCode: null,
      documentSerialNumber: null,
    } as const;

    expect(await transformVehicleExternalLookup(ctx, { ...lookup, plateCode: 'ABC123' })).toEqual({
      modelYear: 2021,
      fuelType: 'DIESEL',
    });
    expect(await transformVehicleExternalLookup(ctx, { ...lookup, plateCode: null })).toBeUndefined();
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

describe('RenderHook', () => {
  const customer: CustomerView = {
    id: 'customer-1',
    type: 'INDIVIDUAL',
    name: 'Ada Lovelace',
    city: null,
    district: null,
    policyCount: 3,
    proposalCount: 5,
    createdAt: '2026-01-01T00:00:00+00:00',
    metadata: { segment: 'gold' },
  };

  test('columns hook returns one cell per row', async () => {
    const renderCustomerColumns: RenderHook<'renderCustomerColumns', Config> = (_ctx, input) => ({
      columns: [{ key: 'segment', title: 'Segment', hiddenByDefault: true }],
      cells: input.rows.map((row) => {
        const segment = row.metadata?.segment;
        return { rowId: row.id, key: 'segment', html: typeof segment === 'string' ? segment : '' };
      }),
    });

    expect(await renderCustomerColumns(ctx, { rows: [customer] })).toEqual({
      columns: [{ key: 'segment', title: 'Segment', hiddenByDefault: true }],
      cells: [{ rowId: 'customer-1', key: 'segment', html: 'gold' }],
    });
  });

  test('detail hook reads the entity and its customer from the input', async () => {
    const policy: PolicyView = {
      id: 'policy-1',
      productBranch: 'KASKO',
      insuredCustomerId: 'customer-1',
      insurerCustomerId: 'customer-1',
      insuredCustomer: { id: 'customer-1', name: 'Ada Lovelace', metadata: null },
      insurerCustomer: null,
      insuranceCompanyId: null,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      netPremium: 100,
      grossPremium: 118,
      currency: 'TURKISH_LIRA',
      channel: 'WEBSITE',
      state: 'ACTIVE',
      metadata: null,
    };
    const renderPolicyDetail: RenderHook<'renderPolicyDetail', Config> = (_ctx, input) => ({
      title: 'Owner',
      fields: [{ key: 'insured', title: 'Insured', html: input.policy.insuredCustomer?.name ?? '-' }],
    });

    expect(await renderPolicyDetail(ctx, { policy })).toEqual({
      title: 'Owner',
      fields: [{ key: 'insured', title: 'Insured', html: 'Ada Lovelace' }],
    });
  });
});

describe('EventHook', () => {
  test('onCustomerCreated carries the email and the creation channel', async () => {
    const seen: string[] = [];
    const onCustomerCreated: EventHook<'onCustomerCreated', Config> = (_ctx, event) => {
      seen.push(`${event.customerId} ${event.email ?? '-'} ${event.creationChannel}`);
    };

    await onCustomerCreated(ctx, {
      customerId: 'customer-1',
      customerType: 'INDIVIDUAL',
      email: null,
      creationChannel: 'WEBSITE',
    });

    expect(seen).toEqual(['customer-1 - WEBSITE']);
  });
});
