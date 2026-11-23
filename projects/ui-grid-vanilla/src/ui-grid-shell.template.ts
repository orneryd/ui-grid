import shellCss from './ui-grid-shell.scss';
import { adoptStyles } from './adopt-styles';
import { COLUMN_HEADER_ROW_INDEX } from './utils/aria';

const STYLE_KEY = {};

interface ShellContext {
  shadowRoot?: ShadowRoot | null;
  slotRegistry: string;
  gridTitle: string;
  /** Total rows the grid announces (header rows + display items). */
  gridRowCount: number;
  /** Total columns the grid announces (visible columns). */
  gridColCount: number;
  gridTableStyle: string;
  templateColumns: string;
  headerContent: string;
  filterRowContent: string;
  bodyViewportStyle: string;
  bodyContent: string;
  paginationContent: string;
}

export default function gridShellTemplate(ctx: ShellContext) {
  return {
    connect(root?: ShadowRoot): void {
      const target = root ?? ctx.shadowRoot;
      if (!target) return;
      adoptStyles(target, shellCss, STYLE_KEY);
      target.innerHTML =
        `${ctx.slotRegistry}` +
        `<section class="grid-frame ui-grid" part="grid-frame" role="grid" aria-label="${ctx.gridTitle}" aria-rowcount="${ctx.gridRowCount}" aria-colcount="${ctx.gridColCount}">` +
          `<div class="grid-table ui-grid-contents-wrapper" style="${ctx.gridTableStyle}">` +
            `<div class="grid-header-strip">` +
              `<div class="header-grid ui-grid-header ui-grid-header-canvas" part="header" role="row" aria-rowindex="${COLUMN_HEADER_ROW_INDEX}" style="grid-template-columns:${ctx.templateColumns}">` +
                ctx.headerContent +
              `</div>` +
            `</div>` +
            `<div class="grid-filter-strip">` +
              ctx.filterRowContent +
            `</div>` +
            `<div class="grid-body-viewport" style="${ctx.bodyViewportStyle}">` +
              ctx.bodyContent +
            `</div>` +
            ctx.paginationContent +
          `</div>` +
        `</section>`;
    },
  };
}
