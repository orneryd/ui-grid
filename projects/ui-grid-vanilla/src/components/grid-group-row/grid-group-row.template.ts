import css from './grid-group-row.scss';
import { adoptStyles } from '../../adopt-styles';

const STYLE_KEY = {};

interface GroupRowContext {
  iconViewBox: string;
  iconPath: string;
  disclosureLabel: string;
  field: string;
  label: string;
  count: string;
  rowsSuffix: string;
}

export function renderGroupRow(ctx: GroupRowContext, shadowRoot: ShadowRoot): void {
  adoptStyles(shadowRoot, css, STYLE_KEY);
  shadowRoot.innerHTML =
    `<svg class="toggle-icon group-disclosure-icon" viewBox="${ctx.iconViewBox}" aria-hidden="true" focusable="false"><path d="${ctx.iconPath}"></path></svg>` +
    `<span class="sr-only">${ctx.disclosureLabel}</span>` +
    `<strong>${ctx.field}: ${ctx.label}</strong>` +
    `<span>${ctx.count} ${ctx.rowsSuffix}</span>`;
}
