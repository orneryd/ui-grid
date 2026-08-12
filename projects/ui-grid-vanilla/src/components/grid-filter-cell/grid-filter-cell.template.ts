import css from './grid-filter-cell.scss';
import { adoptStyles } from '../../adopt-styles';

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
    ` data-column="${ctx.columnName}"` +
    ` placeholder="${ctx.placeholder}"` +
    ` value="${ctx.value}">`;
}
