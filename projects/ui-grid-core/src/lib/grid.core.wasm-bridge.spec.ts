import { beforeAll, describe, expect, it } from 'vitest';

import { GridRow } from './grid.models';
import {
  clearGridFilterReasons,
  configureWasmSerializationAudit,
  headerLabel,
  initWasmCore,
  inspectWasmSerializationPayload,
  matchesGridRowFilters,
} from './grid.core.wasm-bridge';

describe('grid.core.wasm-bridge filtering/display helpers', () => {
  beforeAll(async () => {
    await initWasmCore();
  });

  it('routes clearGridFilterReasons without replacing the live GridRow instance', () => {
    const row = new GridRow('row-1', { name: 'Alice' }, 0);
    row.setThisRowInvisible('filter:name');
    row.setThisRowInvisible('group:team');

    clearGridFilterReasons(row);

    expect([...row.invisibleReasons]).toEqual(['group:team']);
    expect(row.visible).toBe(false);
  });

  it('preserves regex filter semantics via JS fallback when the filter operator is not wasm-serializable', () => {
    const row = new GridRow('row-1', { name: 'Alice' }, 0);
    const columns = [{ name: 'name', filter: { condition: /^Ali/ } }];
    const options = { id: 'grid-1', data: [], columnDefs: columns, enableFiltering: true };

    expect(matchesGridRowFilters(row, columns, options, { name: 'ignored' })).toBe(true);
    expect(row.visible).toBe(true);
  });

  it('resolves headerLabel through the wasm bridge for callback-free columns', () => {
    expect(headerLabel({ name: 'userName' })).toBe('User Name');
    expect(headerLabel({ name: 'ignored', displayName: 'Explicit Label' })).toBe('Explicit Label');
  });

  it('reports class-backed rows as complex wasm serialization payloads', () => {
    const row = new GridRow('row-1', { name: 'Alice' }, 0);
    const report = inspectWasmSerializationPayload([{ rows: [row] }]);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'arg0.rows[0]',
          kind: 'class-instance',
          constructorName: 'GridRow',
        }),
      ]),
    );
    expect(report.estimatedBytes).toBeGreaterThan(0);
  });

  it('lets callers enable the wasm serialization audit hook explicitly', () => {
    const options = configureWasmSerializationAudit({ enabled: true, sizeThresholdBytes: 32 });

    expect(options.enabled).toBe(true);
    expect(options.sizeThresholdBytes).toBe(32);

    configureWasmSerializationAudit({ enabled: false, sizeThresholdBytes: 8192 });
  });

  it('does not serialize row data for helper-only wasm option checks', () => {
    const options = {
      id: 'grid-1',
      data: Array.from({ length: 2000 }, (_, index) => ({ id: index, name: `Row ${index}` })),
      columnDefs: [{ name: 'name', enableSorting: true }],
      enableSorting: true,
    };

    const fullPayload = inspectWasmSerializationPayload([{ options, column: options.columnDefs[0] }]);
    const helperPayload = inspectWasmSerializationPayload([
      {
        options: {
          ...options,
          data: [],
        },
        column: options.columnDefs[0],
      },
    ]);

    expect(fullPayload.estimatedBytes).toBeGreaterThan(50_000);
    expect(fullPayload.estimatedBytes).toBeGreaterThan(helperPayload.estimatedBytes * 5);
    expect(helperPayload.estimatedBytes).toBeLessThan(10_000);
  });
});