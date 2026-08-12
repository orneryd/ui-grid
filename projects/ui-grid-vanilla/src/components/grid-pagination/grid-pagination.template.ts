import css from './grid-pagination.scss';
import { adoptStyles } from '../../adopt-styles';

const STYLE_KEY = {};

interface PaginationContext {
  rangeLabel: string;
  prevLabel: string;
  prevIconViewBox: string;
  prevIconPath: string;
  pageLabel: string;
  currentPage: string;
  ofLabel: string;
  totalPages: string;
  nextLabel: string;
  nextIconViewBox: string;
  nextIconPath: string;
  rowsLabel: string;
}

export function renderPagination(ctx: PaginationContext, shadowRoot: ShadowRoot): void {
  adoptStyles(shadowRoot, css, STYLE_KEY);
  shadowRoot.innerHTML =
    `<p>${ctx.rangeLabel}</p>` +
    `<div class="pagination-controls">` +
      `<button type="button" class="pagination-button" data-action="page-prev" aria-label="${ctx.prevLabel}">` +
        `<svg class="pagination-icon" viewBox="${ctx.prevIconViewBox}" aria-hidden="true" focusable="false"><path d="${ctx.prevIconPath}"></path></svg>` +
        `<span class="sr-only">${ctx.prevLabel}</span>` +
      `</button>` +
      `<span>${ctx.pageLabel} ${ctx.currentPage} ${ctx.ofLabel} ${ctx.totalPages}</span>` +
      `<button type="button" class="pagination-button" data-action="page-next" aria-label="${ctx.nextLabel}">` +
        `<svg class="pagination-icon" viewBox="${ctx.nextIconViewBox}" aria-hidden="true" focusable="false"><path d="${ctx.nextIconPath}"></path></svg>` +
        `<span class="sr-only">${ctx.nextLabel}</span>` +
      `</button>` +
      `<label class="pagination-size">` +
        `<span class="sr-only">${ctx.rowsLabel}</span>` +
        `<select class="page-size" data-role="page-size"></select>` +
      `</label>` +
    `</div>`;
}
