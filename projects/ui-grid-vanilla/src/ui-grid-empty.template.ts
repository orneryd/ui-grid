import shellCss from './ui-grid-shell.scss';
import { adoptStyles } from './adopt-styles';

const STYLE_KEY = {};

interface EmptyContext {
  message: string;
}

export default function emptyTemplate(ctx: EmptyContext) {
  return {
    connect(root?: ShadowRoot): void {
      if (!root) return;
      adoptStyles(root, shellCss, STYLE_KEY);
      root.innerHTML =
        `<section class="grid-shell ui-grid-shell">` +
          `<div class="empty-state ui-grid-no-row-overlay">` +
            `<strong>${ctx.message}</strong>` +
          `</div>` +
        `</section>`;
    },
  };
}
