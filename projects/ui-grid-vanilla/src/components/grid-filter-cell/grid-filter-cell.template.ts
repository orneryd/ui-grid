import css from './grid-filter-cell.scss';
import { adoptStyles } from '../../adopt-styles';
import { escapeHtml } from '../../utils/dom';

const STYLE_KEY = {};

interface FilterCellContext {
  columnName: string;
  placeholder: string;
  value: string;
}

export function renderFilterCell(ctx: FilterCellContext, shadowRoot: ShadowRoot): void {
  adoptStyles(shadowRoot, css, STYLE_KEY);
  shadowRoot.innerHTML =
    `<input class="ui-grid-filter-input"` +
    ` data-role="filter"` +
    ` data-column="${escapeHtml(ctx.columnName)}"` +
    ` placeholder="${escapeHtml(ctx.placeholder)}"` +
    ` value="${escapeHtml(ctx.value)}">`;
}
