import shellCss from './ui-grid-shell.scss';
import { adoptStyles } from './adopt-styles';

const STYLE_KEY = {};

interface ShellContext {
  shadowRoot?: ShadowRoot | null;
  slotRegistry: string;
  gridTitle: string;
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
        `<section class="grid-frame ui-grid" role="grid" aria-label="${ctx.gridTitle}">` +
          `<div class="grid-table ui-grid-contents-wrapper" style="${ctx.gridTableStyle}">` +
            `<div class="grid-header-strip">` +
              `<div class="header-grid ui-grid-header ui-grid-header-canvas" style="grid-template-columns:${ctx.templateColumns}">` +
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
