import { describe, expect, it } from 'vitest';
import type { GridControllerSnapshot } from './grid-controller';
import type { UiGridStandaloneElement } from './ui-grid-standalone.element';
import { renderPagination } from './render';

const icon = { path: 'M0 0', viewBox: '0 0 24 24' };
const el = { icons: { resolve: () => icon } } as unknown as UiGridStandaloneElement;

function snapshotWith(overrides: Partial<GridControllerSnapshot>): GridControllerSnapshot {
  return {
    options: { enablePagination: true, useExternalPagination: true, paginationPageSizes: [10] },
    labels: {
      paginationPage: 'Page',
      paginationOf: 'of',
      paginationPrevious: 'Previous',
      paginationNext: 'Next',
      paginationRows: 'Rows',
    },
    pipeline: { totalItems: 0 },
    currentPage: 1,
    totalPages: 1,
    firstRowIndex: 0,
    lastRowIndex: 0,
    pageSize: 10,
    ...overrides,
  } as unknown as GridControllerSnapshot;
}

describe('renderPagination range label', () => {
  it('shows "0 of 0" with previous and next disabled when there are no rows', () => {
    const markup = renderPagination(el, snapshotWith({}));

    expect(markup).toContain('data-range-label="0 of 0"');
    expect(markup).toContain('data-prev-disabled="true"');
    expect(markup).toContain('data-next-disabled="true"');
  });
});
