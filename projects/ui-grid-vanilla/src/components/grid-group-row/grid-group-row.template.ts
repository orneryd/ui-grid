import css from './grid-group-row.scss';
import { adoptStyles } from '../../adopt-styles';
import { escapeHtml } from '../../utils/dom';

const STYLE_KEY = {};

interface GroupRowContext {
  iconViewBox: string;
  iconPath: string;
  disclosureLabel: string;
  field: string;
  columnLabel: string;
  label: string;
  count: string;
  rowsSuffix: string;
}

export function renderGroupRow(ctx: GroupRowContext, shadowRoot: ShadowRoot): void {
  adoptStyles(shadowRoot, css, STYLE_KEY);
  shadowRoot.innerHTML =
    `<svg class="toggle-icon group-disclosure-icon" viewBox="${escapeHtml(ctx.iconViewBox)}" aria-hidden="true" focusable="false"><path d="${escapeHtml(ctx.iconPath)}"></path></svg>` +
    `<span class="sr-only">${escapeHtml(ctx.disclosureLabel)}</span>` +
    `<strong>${escapeHtml(ctx.columnLabel || ctx.field)}: ${escapeHtml(ctx.label)}</strong>` +
    `<span>${escapeHtml(ctx.count)} ${escapeHtml(ctx.rowsSuffix)}</span>`;
}
