import { renderPagination } from './grid-pagination.template';

/**
 * `<ui-grid-pagination>` — Pagination controls element.
 *
 * Mounts once via `template(this).connect()` in `connectedCallback`; subsequent
 * attribute changes patch the existing DOM in place (text labels, button disabled
 * flags, select options). The parent grid re-uses a single `<ui-grid-pagination>`
 * node and just sets data-attributes on it, so nothing inside ever loses focus.
 */
export class UIGridPagination extends HTMLElement {
  static readonly TAG = 'ui-grid-pagination';

  rangeLabel = '';
  currentPage = '1';
  totalPages = '1';
  pageLabel = '';
  ofLabel = '';
  prevLabel = '';
  nextLabel = '';
  rowsLabel = '';
  prevIconPath = '';
  prevIconViewBox = '0 0 24 24';
  nextIconPath = '';
  nextIconViewBox = '0 0 24 24';

  private mounted = false;
  private rangeEl: HTMLElement | null = null;
  private pageCounterEl: HTMLElement | null = null;
  private prevBtn: HTMLButtonElement | null = null;
  private nextBtn: HTMLButtonElement | null = null;
  private prevIconPathEl: SVGPathElement | null = null;
  private nextIconPathEl: SVGPathElement | null = null;
  private prevLabelSr: HTMLElement | null = null;
  private nextLabelSr: HTMLElement | null = null;
  private rowsLabelSr: HTMLElement | null = null;
  private sizeSelect: HTMLSelectElement | null = null;
  private lastPageSizesKey = '';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return ['data-range-label', 'data-current-page', 'data-total-pages',
            'data-page-label', 'data-of-label', 'data-prev-label', 'data-next-label',
            'data-rows-label', 'data-prev-icon-path', 'data-prev-icon-view-box',
            'data-next-icon-path', 'data-next-icon-view-box',
            'data-page-sizes', 'data-page-size', 'data-prev-disabled', 'data-next-disabled'];
  }

  connectedCallback(): void {
    if (!this.mounted) {
      this.captureTemplateBindings();
      renderPagination(this, this.shadowRoot!);
      this.cacheElements();
      this.attachSelectListener();
      this.mounted = true;
    }
    this.sync();
  }

  attributeChangedCallback(): void {
    if (this.mounted) {
      this.sync();
    }
  }

  private captureTemplateBindings(): void {
    this.rangeLabel = this.getAttribute('data-range-label') ?? '';
    this.currentPage = this.getAttribute('data-current-page') ?? '1';
    this.totalPages = this.getAttribute('data-total-pages') ?? '1';
    this.pageLabel = this.getAttribute('data-page-label') ?? '';
    this.ofLabel = this.getAttribute('data-of-label') ?? '';
    this.prevLabel = this.getAttribute('data-prev-label') ?? '';
    this.nextLabel = this.getAttribute('data-next-label') ?? '';
    this.rowsLabel = this.getAttribute('data-rows-label') ?? '';
    this.prevIconPath = this.getAttribute('data-prev-icon-path') ?? '';
    this.prevIconViewBox = this.getAttribute('data-prev-icon-view-box') ?? '0 0 24 24';
    this.nextIconPath = this.getAttribute('data-next-icon-path') ?? '';
    this.nextIconViewBox = this.getAttribute('data-next-icon-view-box') ?? '0 0 24 24';
  }

  private cacheElements(): void {
    const shadow = this.shadowRoot!;
    this.rangeEl = shadow.querySelector('p');
    this.prevBtn = shadow.querySelector('[data-action="page-prev"]');
    this.nextBtn = shadow.querySelector('[data-action="page-next"]');
    this.pageCounterEl = shadow.querySelector('.pagination-controls > span');
    this.prevIconPathEl = this.prevBtn?.querySelector('path') ?? null;
    this.nextIconPathEl = this.nextBtn?.querySelector('path') ?? null;
    this.prevLabelSr = this.prevBtn?.querySelector('.sr-only') ?? null;
    this.nextLabelSr = this.nextBtn?.querySelector('.sr-only') ?? null;
    this.rowsLabelSr = shadow.querySelector('.pagination-size .sr-only');
    this.sizeSelect = shadow.querySelector('select[data-role="page-size"]');
  }

  private attachSelectListener(): void {
    const select = this.sizeSelect;
    if (!select) return;
    select.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('grid-page-size', {
        bubbles: true,
        composed: true,
        detail: { pageSize: Number.parseInt(select.value, 10) },
      }));
    });
  }

  private sync(): void {
    this.className = 'pagination-bar ui-grid-pagination';

    const rangeLabel = this.getAttribute('data-range-label') ?? '';
    const currentPage = this.getAttribute('data-current-page') ?? '1';
    const totalPages = this.getAttribute('data-total-pages') ?? '1';
    const pageLabel = this.getAttribute('data-page-label') ?? '';
    const ofLabel = this.getAttribute('data-of-label') ?? '';
    const prevLabel = this.getAttribute('data-prev-label') ?? '';
    const nextLabel = this.getAttribute('data-next-label') ?? '';
    const rowsLabel = this.getAttribute('data-rows-label') ?? '';
    const prevIconPath = this.getAttribute('data-prev-icon-path') ?? '';
    const prevIconViewBox = this.getAttribute('data-prev-icon-view-box') ?? '0 0 24 24';
    const nextIconPath = this.getAttribute('data-next-icon-path') ?? '';
    const nextIconViewBox = this.getAttribute('data-next-icon-view-box') ?? '0 0 24 24';
    const pageSizesAttr = this.getAttribute('data-page-sizes') ?? '[10,25,50,100]';
    const pageSize = parseInt(this.getAttribute('data-page-size') ?? '25', 10);
    const prevDisabled = this.getAttribute('data-prev-disabled') === 'true';
    const nextDisabled = this.getAttribute('data-next-disabled') === 'true';

    if (this.rangeEl && this.rangeEl.textContent !== rangeLabel) {
      this.rangeEl.textContent = rangeLabel;
    }

    if (this.pageCounterEl) {
      const pageText = `${pageLabel} ${currentPage} ${ofLabel} ${totalPages}`;
      if (this.pageCounterEl.textContent !== pageText) {
        this.pageCounterEl.textContent = pageText;
      }
    }

    if (this.prevBtn) {
      if (this.prevBtn.getAttribute('aria-label') !== prevLabel) {
        this.prevBtn.setAttribute('aria-label', prevLabel);
      }
      if (this.prevBtn.disabled !== prevDisabled) {
        this.prevBtn.disabled = prevDisabled;
      }
    }
    if (this.prevIconPathEl && this.prevIconPathEl.getAttribute('d') !== prevIconPath) {
      this.prevIconPathEl.setAttribute('d', prevIconPath);
    }
    const prevSvg = this.prevBtn?.querySelector('svg');
    if (prevSvg && prevSvg.getAttribute('viewBox') !== prevIconViewBox) {
      prevSvg.setAttribute('viewBox', prevIconViewBox);
    }
    if (this.prevLabelSr && this.prevLabelSr.textContent !== prevLabel) {
      this.prevLabelSr.textContent = prevLabel;
    }

    if (this.nextBtn) {
      if (this.nextBtn.getAttribute('aria-label') !== nextLabel) {
        this.nextBtn.setAttribute('aria-label', nextLabel);
      }
      if (this.nextBtn.disabled !== nextDisabled) {
        this.nextBtn.disabled = nextDisabled;
      }
    }
    if (this.nextIconPathEl && this.nextIconPathEl.getAttribute('d') !== nextIconPath) {
      this.nextIconPathEl.setAttribute('d', nextIconPath);
    }
    const nextSvg = this.nextBtn?.querySelector('svg');
    if (nextSvg && nextSvg.getAttribute('viewBox') !== nextIconViewBox) {
      nextSvg.setAttribute('viewBox', nextIconViewBox);
    }
    if (this.nextLabelSr && this.nextLabelSr.textContent !== nextLabel) {
      this.nextLabelSr.textContent = nextLabel;
    }

    if (this.rowsLabelSr && this.rowsLabelSr.textContent !== rowsLabel) {
      this.rowsLabelSr.textContent = rowsLabel;
    }

    const select = this.sizeSelect;
    if (select) {
      const pageSizesKey = `${pageSizesAttr}|${pageSize}`;
      if (pageSizesKey !== this.lastPageSizesKey) {
        const pageSizes = JSON.parse(pageSizesAttr) as number[];
        select.innerHTML = pageSizes
          .map((size) => `<option value="${size}" ${size === pageSize ? 'selected' : ''}>${size}</option>`)
          .join('');
        this.lastPageSizesKey = pageSizesKey;
      } else if (select.value !== String(pageSize)) {
        select.value = String(pageSize);
      }
    }
  }

  static define(tagName = UIGridPagination.TAG): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, UIGridPagination);
    }
  }
}
