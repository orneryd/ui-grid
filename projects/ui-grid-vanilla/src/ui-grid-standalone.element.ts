import {
  canGridMoveColumns,
  interpolateGridTemplate,
  type DisplayItem,
  type GridColumnDef,
  type GridOptions,
  type GridRecord,
  type GridRow,
  type GroupItem,
} from '@ornery/ui-grid-core';
import {
  FrameworkSlotBridge,
  type FrameworkRenderedSlotsConfig,
} from './framework-slots';
export type {
  FrameworkRenderedSlotsConfig,
  FrameworkCellSlot,
  FrameworkHeaderSlot,
  FrameworkFilterSlot,
  FrameworkGroupRowSlot,
  FrameworkExpandableRowSlot,
  FrameworkEmptyStateSlot,
  FrameworkSlotDelta,
} from './framework-slots';
import {
  OBSERVED_GRID_ATTRIBUTES,
  parseGridAttributeOptions,
} from './attribute-bridge';
import {
  getTemplateMarkup as getTemplateMarkupFromLightDom,
  renderBodyCell,
  renderCellTemplate,
  renderCellTemplateFromMarkup,
  renderDisplayItem,
  renderEmptyState,
  renderExpandableTemplate,
  renderFilterCell,
  renderHeaderCell,
  renderPagination,
  renderSlotRegistry,
} from './render';
import {
  fingerprintItems,
  patchBodyCell,
  patchCells,
  patchExistingRows,
  patchFilterCells,
  patchGroupRow,
  patchPagination,
  reconcileBodyRoot,
  reconcilePagination,
  renderPatch,
} from './patch';
import {
  applyFocusedCellClass,
  commitAndMove,
  focusCellElement,
  handleRowHeaderCheckboxClick,
  handleRowSelectionClick,
  matchesKeyOverride,
  measureAutoColumnWidth,
  moveGridFocus,
  scrollFocusedRowIntoView,
  type GridMoveDirection,
} from './focus';
import {
  bindEvents,
  maybeTriggerInfiniteScroll,
  observeTemplateSlots,
  syncHeaderHorizontalScroll,
} from './events';
import { bodyCellClass } from './utils/cell-class';
import { asGroupItem, isRowItem } from './utils/display-items';
import { escapeHtml } from './utils/dom';
import {
  IconRegistry,
  type UiGridControlIconKey,
  type UiGridIconDefinition,
  type UiGridIconOverrides,
} from './icons';
export type { UiGridControlIconKey, UiGridIconDefinition, UiGridIconOverrides } from './icons';
import {
  createVanillaGridController,
  type GridControllerSnapshot,
  type GridSaveState,
  type VanillaGridController,
} from './grid-controller';
import emptyTemplate from './ui-grid-empty.template';
import gridShellTemplate from './ui-grid-shell.template';
import {
  bodyStaticMarkup,
  bodyVirtualMarkup,
  emptyDataMarkup,
  filterRowMarkup,
} from './templates';
import { UIGridFilterCell } from './components/grid-filter-cell';
import { UIGridGroupRow } from './components/grid-group-row';
import { UIGridPagination } from './components/grid-pagination';
import { UIGridBodyCell } from './components/grid-body-cell';
import { UIGridHeaderCell } from './components/grid-header-cell';
import { UIGridTemplate } from './components/grid-template';
import { UIGridCellEditor } from './components/grid-cell-editor';

export type VanillaUiGridElement = HTMLElement & {
  options: GridOptions;
  getState(): GridSaveState | null;
  setState(state: Partial<GridSaveState>): void;
  /**
   * Fast-path data update: patches only visible cell content in the existing
   * shadow DOM. Does NOT rebuild the scroll container or header, so scrolling
   * remains completely smooth while data ticks in the background.
   */
  setData(rows: GridRecord[]): void;
  /**
   * Declare which slots the grid should emit as `<slot>` placeholders for a
   * framework wrapper to project into. See `FrameworkSlotBridge` for the
   * full contract.
   */
  setFrameworkRenderedSlots(config: FrameworkRenderedSlotsConfig): void;
};

type VanillaGridOptions = GridOptions & {
  iconOverrides?: UiGridIconOverrides;
};

export class UiGridStandaloneElement extends HTMLElement {
  // Internal fields. Marked `public` (no access modifier) rather than
  // `private` because the render / patch / events / focus modules live in
  // their own files and read this state directly. TypeScript has no real
  // "module-internal" visibility, so we use `@internal` JSDoc to flag
  // fields that aren't part of the public API. Consumers of the web
  // component see only `options`, `controlIcons`, `setFrameworkRenderedSlots`,
  // and the template-facing strings (`gridTitle`, etc.).
  /** @internal */ controller: VanillaGridController | null = null;
  /** @internal */ snapshot: GridControllerSnapshot | null = null;
  /** @internal */ unsubscribe: (() => void) | null = null;
  /** @internal */ activeOptions: VanillaGridOptions | null = null;
  /** @internal */ attributeOptions: Partial<GridOptions> = {};
  /** @internal */ attributeSyncScheduled = false;
  /** @internal Owns the SVG-icon registry: defaults merged with consumer
   * overrides plus rendering helpers. See `./icons.ts`. */
  icons = new IconRegistry();
  /** @internal */ templateObserver: MutationObserver | null = null;
  /** @internal */ openPinMenuColumn: string | null = null;
  /** @internal */ focusedCell: { rowId: string; columnName: string } | null = null;
  /** @internal */ draggedColumnName: string | null = null;
  /** @internal */ dropTargetColumnName: string | null = null;
  /** @internal */ scrollPosition = 0;
  /** @internal */ horizontalScrollPosition = 0;
  /** @internal */ scrollFrame: number | null = null;
  /** @internal */ suppressScrollEvent = false;
  /** @internal */ lastVirtualStartIndex = -1;
  /** @internal */ measuredHeaderStickyHeight = 0;
  /** @internal */ measuredFilterStickyHeight = 0;
  /** @internal */ stickyHeightRelayoutQueued = false;
  /** @internal */ benchmarkAverage = '—';
  /** @internal */ skipNextRender = false;
  /** @internal */ autoResizeObserver: ResizeObserver | null = null;
  /** @internal */ autoResizeDebounceHandle: number | null = null;

  // Template-facing properties for the grid shell template
  gridTitle = 'Data grid';
  gridTableStyle = '';
  bodyViewportStyle = '';
  templateColumns = '';
  slotRegistry = '';
  headerContent = '';
  filterRowContent = '';
  bodyContent = '';
  paginationContent = '';
  /** @internal */ dataFrame: number | null = null;
  /** @internal */ pendingPatchedRowIds: Set<string> | null = null;
  /** @internal */ pendingDataRefreshMode: 'patch' | 'virtual' | 'full' | null = null;
  /** @internal */ lastScrollActivityAt = 0;
  /** @internal */ lastStructureKey: string | null = null;
  /** @internal */ lastItemsFingerprint: string | null = null;
  /** @internal */ lastVirtualOffset = 0;
  /** @internal */ lastTotalVirtualHeight = 0;
  /**
   * @internal Per-row visual-state fingerprint from the previous patch pass.
   * The patch path uses this to skip cells whose row state hasn't changed
   * (selection, expand, dirty/saving/error flags) when the structure
   * fingerprint matches. Cleared on full re-render.
   */
  lastRowStateFingerprints = new Map<string, { fingerprint: string; entity: unknown }>();
  /** @internal */ lastEditingCellKey: string | null = null;
  /** @internal */ lastFocusedCellKey: string | null = null;

  /**
   * @internal Framework-rendered slot bridge. See `./framework-slots.ts`.
   */
  frameworkSlots = new FrameworkSlotBridge(this);

  static get observedAttributes(): string[] {
    return [...OBSERVED_GRID_ATTRIBUTES];
  }

  get options(): GridOptions {
    if (this.activeOptions !== null) {
      return this.buildEffectiveOptions(this.activeOptions);
    }
    // No imperative options set yet: safe defaults with attributes taking priority.
    return {
      id: '__ui-grid-pending__',
      data: [],
      columnDefs: [],
      ...this.attributeOptions,
    } as GridOptions;
  }

  set options(value: GridOptions) {
    this.activeOptions = value as VanillaGridOptions;
    this.icons.setOverrides(this.activeOptions.iconOverrides ?? {});
    this.ensureController(this.buildEffectiveOptions(this.activeOptions));
  }

  /**
   * Declare which slots are framework-rendered. When a slot is flagged, the
   * element renders a `<slot name="…">` placeholder at the usual site instead
   * of running its string-interpolation template, and dispatches
   * `*SlotsChanged` events so a wrapper can insert light-DOM content with a
   * matching `slot` attribute.
   *
   * Pass an empty object (or `{}`) to revert every slot kind back to the
   * default interpolation path. Individual fields behave the same way:
   * omitting `cells` means the cells list is unchanged; passing
   * `cells: []` clears it.
   *
   * This is the bridge the Angular / React wrappers use to project native
   * templates (ng-template, JSX render props) into the grid. Consumers of
   * the web component directly can ignore this method — the default
   * `<template slot="cell-columnName">` workflow still works.
   */
  setFrameworkRenderedSlots(config: FrameworkRenderedSlotsConfig): void {
    if (this.frameworkSlots.configure(config)) {
      // The set of slot placeholders changed — force a structural re-render
      // so framework-rendered slots transition to `<slot>` nodes (or the
      // reverse, when a slot is revoked). Also bust the per-row patch
      // fingerprint cache, because the cell-shell content depends on
      // hasCell() / hasHeader() / etc. — values not captured by the
      // row-level fingerprint.
      this.lastRowStateFingerprints.clear();
      this.render();
    }
  }

  attributeChangedCallback(
    _name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ): void {
    // Debounce multiple rapid attribute changes via microtask.
    if (!this.attributeSyncScheduled) {
      this.attributeSyncScheduled = true;
      queueMicrotask(() => {
        this.attributeSyncScheduled = false;
        this.syncAttributesToOptions();
      });
    }
  }

  private syncAttributesToOptions(): void {
    this.attributeOptions = parseGridAttributeOptions(this);

    // Re-render with the merged options. Both paths funnel through
    // buildEffectiveOptions so derived fields (e.g. the default
    // `expandableRowTemplate` when `enableExpandable` is true) are applied
    // regardless of whether options came from an imperative `grid.options =`
    // assignment or purely from HTML attributes.
    if (this.activeOptions !== null) {
      this.ensureController(this.buildEffectiveOptions(this.activeOptions));
    } else {
      // Purely declarative path: the attribute-only options are already
      // populated on `this.attributeOptions` (including `data` / `columnDefs`
      // when the consumer set `[attr.data]` / `[attr.column-defs]`). Pass
      // the minimum identity so `buildEffectiveOptions`'s merge doesn't
      // clobber attribute-provided arrays with empty fallbacks — the
      // attribute values always win because the spread order is
      // `{ ...attributeOptions, ...options }`.
      const fallbackId = this.attributeOptions.id ?? '__ui-grid-pending__';
      this.ensureController(
        this.buildEffectiveOptions({
          id: fallbackId,
          data: this.attributeOptions.data ?? [],
          columnDefs: this.attributeOptions.columnDefs ?? [],
        } as VanillaGridOptions),
      );
    }
  }

  get controlIcons(): UiGridIconOverrides {
    return this.icons.getOverrides();
  }

  set controlIcons(value: UiGridIconOverrides) {
    this.icons.setOverrides(value);
    this.render();
  }

  private resolveIcon(key: UiGridControlIconKey): UiGridIconDefinition {
    return this.icons.resolve(key);
  }

  // ─────────────────────────────────────────────────────────────────
  // Individual property accessors (mirrors of HTML attributes)
  // ─────────────────────────────────────────────────────────────────

  get gridId(): string {
    return this.options.id ?? '';
  }
  set gridId(value: string) {
    this.activeOptions = { ...this.activeOptions, id: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  // @ts-ignore: Intentional override of HTMLElement.title
  get title(): string {
    return this.options.title ?? '';
  }
  // @ts-ignore: Intentional override of HTMLElement.title
  set title(value: string) {
    this.activeOptions = { ...this.activeOptions, title: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get rowHeight(): number {
    return this.options.rowHeight ?? 40;
  }
  set rowHeight(value: number) {
    this.activeOptions = { ...this.activeOptions, rowHeight: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get headerRowHeight(): number {
    return this.options.headerRowHeight ?? 50;
  }
  set headerRowHeight(value: number) {
    this.activeOptions = { ...this.activeOptions, headerRowHeight: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get paginationPageSize(): number {
    return this.options.paginationPageSize ?? 25;
  }
  set paginationPageSize(value: number) {
    this.activeOptions = { ...this.activeOptions, paginationPageSize: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get paginationCurrentPage(): number {
    return this.options.paginationCurrentPage ?? 1;
  }
  set paginationCurrentPage(value: number) {
    this.activeOptions = { ...this.activeOptions, paginationCurrentPage: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get totalItems(): number | undefined {
    return this.options.totalItems;
  }
  set totalItems(value: number | undefined) {
    this.activeOptions = { ...this.activeOptions, totalItems: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get virtualizationThreshold(): number {
    return this.options.virtualizationThreshold ?? 40;
  }
  set virtualizationThreshold(value: number) {
    this.activeOptions = { ...this.activeOptions, virtualizationThreshold: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get treeChildrenField(): string {
    return this.options.treeChildrenField ?? 'children';
  }
  set treeChildrenField(value: string) {
    this.activeOptions = { ...this.activeOptions, treeChildrenField: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get treeIndent(): number {
    return this.options.treeIndent ?? 20;
  }
  set treeIndent(value: number) {
    this.activeOptions = { ...this.activeOptions, treeIndent: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get expandableRowHeight(): number {
    return this.options.expandableRowHeight ?? 150;
  }
  set expandableRowHeight(value: number) {
    this.activeOptions = { ...this.activeOptions, expandableRowHeight: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get expandableRowHeaderWidth(): number {
    return this.options.expandableRowHeaderWidth ?? 40;
  }
  set expandableRowHeaderWidth(value: number) {
    this.activeOptions = { ...this.activeOptions, expandableRowHeaderWidth: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get emptyMessage(): string {
    // Fall back to the grid's label pack so consumers can re-localize the
    // empty heading through `options.labels.emptyHeading` rather than
    // hardcoding an English string here.
    return this.options.emptyMessage ?? this.snapshot?.labels.emptyHeading ?? '';
  }
  set emptyMessage(value: string) {
    this.activeOptions = { ...this.activeOptions, emptyMessage: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get infiniteScrollRowsFromEnd(): number {
    return this.options.infiniteScrollRowsFromEnd ?? 10;
  }
  set infiniteScrollRowsFromEnd(value: number) {
    this.activeOptions = { ...this.activeOptions, infiniteScrollRowsFromEnd: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get columnDefs(): readonly GridColumnDef[] {
    return this.options.columnDefs;
  }
  set columnDefs(value: readonly GridColumnDef[]) {
    this.activeOptions = { ...this.activeOptions, columnDefs: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get data(): readonly GridRecord[] {
    return this.options.data;
  }
  set data(value: readonly GridRecord[]) {
    this.activeOptions = { ...this.activeOptions, data: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableSorting(): boolean {
    return this.options.enableSorting ?? true;
  }
  set enableSorting(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableSorting: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableFiltering(): boolean {
    return this.options.enableFiltering ?? true;
  }
  set enableFiltering(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableFiltering: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableGrouping(): boolean {
    return this.options.enableGrouping ?? true;
  }
  set enableGrouping(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableGrouping: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enablePinning(): boolean {
    return this.options.enablePinning ?? true;
  }
  set enablePinning(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enablePinning: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableColumnMoving(): boolean {
    return this.options.enableColumnMoving ?? true;
  }
  set enableColumnMoving(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableColumnMoving: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableColumnResizing(): boolean {
    return (this.options as any).enableColumnResizing ?? true;
  }
  set enableColumnResizing(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableColumnResizing: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableCellEdit(): boolean {
    return this.options.enableCellEdit ?? false;
  }
  set enableCellEdit(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableCellEdit: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableCellEditOnFocus(): boolean {
    return this.options.enableCellEditOnFocus ?? false;
  }
  set enableCellEditOnFocus(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableCellEditOnFocus: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enablePagination(): boolean {
    return this.options.enablePagination ?? false;
  }
  set enablePagination(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enablePagination: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enablePaginationControls(): boolean {
    return this.options.enablePaginationControls ?? true;
  }
  set enablePaginationControls(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enablePaginationControls: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get useExternalPagination(): boolean {
    return this.options.useExternalPagination ?? false;
  }
  set useExternalPagination(value: boolean) {
    this.activeOptions = { ...this.activeOptions, useExternalPagination: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableExpandable(): boolean {
    return this.options.enableExpandable ?? false;
  }
  set enableExpandable(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableExpandable: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableTreeView(): boolean {
    return this.options.enableTreeView ?? false;
  }
  set enableTreeView(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableTreeView: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get showTreeExpandNoChildren(): boolean {
    return this.options.showTreeExpandNoChildren ?? false;
  }
  set showTreeExpandNoChildren(value: boolean) {
    this.activeOptions = { ...this.activeOptions, showTreeExpandNoChildren: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get treeRowHeaderAlwaysVisible(): boolean {
    return this.options.treeRowHeaderAlwaysVisible ?? false;
  }
  set treeRowHeaderAlwaysVisible(value: boolean) {
    this.activeOptions = { ...this.activeOptions, treeRowHeaderAlwaysVisible: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableAutoResize(): boolean {
    return this.options.enableAutoResize ?? false;
  }
  set enableAutoResize(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableAutoResize: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get enableVirtualization(): boolean {
    return this.options.enableVirtualization ?? true;
  }
  set enableVirtualization(value: boolean) {
    this.activeOptions = { ...this.activeOptions, enableVirtualization: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get infiniteScrollUp(): boolean {
    return this.options.infiniteScrollUp ?? false;
  }
  set infiniteScrollUp(value: boolean) {
    this.activeOptions = { ...this.activeOptions, infiniteScrollUp: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get infiniteScrollDown(): boolean {
    return this.options.infiniteScrollDown ?? false;
  }
  set infiniteScrollDown(value: boolean) {
    this.activeOptions = { ...this.activeOptions, infiniteScrollDown: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get grouping(): unknown {
    return this.options.grouping;
  }
  set grouping(value: unknown) {
    this.activeOptions = { ...this.activeOptions, grouping: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  get paginationPageSizes(): number[] | null | undefined {
    return this.options.paginationPageSizes;
  }
  set paginationPageSizes(value: number[] | null | undefined) {
    this.activeOptions = { ...this.activeOptions, paginationPageSizes: value } as any;
    this.ensureController(this.buildEffectiveOptions(this.activeOptions as VanillaGridOptions));
  }

  getState(): GridSaveState | null {
    return this.controller?.getState() ?? null;
  }

  setState(state: Partial<GridSaveState>): void {
    this.controller?.setState(state);
  }

  /**
   * Fast-path: update only row data without rebuilding the shadow DOM.
   * The pipeline is updated synchronously; DOM patching is deferred to the
   * next animation frame so it never interrupts an in-progress scroll paint.
   * If multiple ticks arrive before the frame fires, only the latest wins.
   * If a scroll-triggered full render fires first, the frame is cancelled
   * (the fresh innerHTML already reflects the latest data).
   */
  setData(rows: GridRecord[]): void {
    const controller = this.controller;
    if (!controller) {
      return;
    }

    const previousSnapshot = this.snapshot;

    // Update the pipeline synchronously (cheap, no DOM work).
    this.skipNextRender = true;
    controller.refreshData(rows);
    this.skipNextRender = false;

    const { mode, changedRowIds } = this.classifyDataRefresh(previousSnapshot, this.snapshot);
    if (mode === null) {
      return;
    }

    this.pendingDataRefreshMode = mode;
    this.pendingPatchedRowIds = changedRowIds;

    // Schedule DOM patching on the next paint — latest call wins.
    if (this.dataFrame !== null) {
      cancelAnimationFrame(this.dataFrame);
    }
    this.dataFrame = requestAnimationFrame(() => {
      this.flushPendingDataRefresh();
    });
  }

  private flushPendingDataRefresh(): void {
    this.dataFrame = null;

    const mode = this.pendingDataRefreshMode;
    if (mode === null) {
      return;
    }

    if (Date.now() - this.lastScrollActivityAt < 80) {
      this.dataFrame = requestAnimationFrame(() => {
        this.flushPendingDataRefresh();
      });
      return;
    }

    const changedRowIds = this.pendingPatchedRowIds;
    this.pendingDataRefreshMode = null;
    this.pendingPatchedRowIds = null;

    if (mode === 'patch') {
      this.patchCells(changedRowIds ?? undefined);
      return;
    }

    if (mode === 'virtual') {
      this.renderVirtualBody();
      return;
    }

    this.render();
  }

  private patchCells(changedRowIds?: ReadonlySet<string>): void {
    patchCells(this, changedRowIds);
  }

  connectedCallback(): void {
    this.ensureShadowRoot();
    this.bindEvents();
    this.observeTemplateSlots();
    this.setupAutoResize();

    if (this.activeOptions) {
      this.ensureController(this.buildEffectiveOptions(this.activeOptions));
    } else {
      this.render();
    }
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.templateObserver?.disconnect();
    this.templateObserver = null;
    this.teardownAutoResize();
    if (this.scrollFrame !== null) {
      cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = null;
    }
    this.controller?.setBenchmarkHandler(null);
    // Emit `removed` events for every framework-rendered slot so wrappers
    // can destroy their views.
    this.frameworkSlots.flushRemovals();
  }

  private benchmarkRender(iterations?: number) {
    const controller = this.controller;
    const snapshot = this.snapshot;
    if (!controller || !snapshot) {
      return Promise.resolve({
        iterations: 0,
        totalMs: 0,
        averageMs: 0,
        visibleRows: 0,
        renderedItems: 0,
      });
    }

    const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());
    const nextFrame = () =>
      new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame === 'undefined') {
          setTimeout(resolve, 0);
          return;
        }
        requestAnimationFrame(() => resolve());
      });
    const loops = Math.max(1, iterations ?? controller.getOptions().benchmark?.iterations ?? 25);
    return (async () => {
      const started = now();

      for (let index = 0; index < loops; index += 1) {
        this.render();
        await nextFrame();
      }

      const currentSnapshot = this.snapshot ?? snapshot;
      const totalMs = now() - started;
      const result = {
        iterations: loops,
        totalMs,
        averageMs: totalMs / loops,
        visibleRows: currentSnapshot.pipeline.visibleRows.length,
        renderedItems: currentSnapshot.pipeline.displayItems.length,
      };

      controller.gridApi.core.raise.benchmarkComplete(result);
      return result;
    })();
  }

  /** @internal */
  ensureShadowRoot(): ShadowRoot {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    return this.shadowRoot as ShadowRoot;
  }

  /** @internal */
  ensureController(options: VanillaGridOptions): void {
    if (this.controller) {
      this.controller.setBenchmarkHandler((iterations) => this.benchmarkRender(iterations));
      if (this.clientWidth > 0) {
        this.controller.setViewportWidth(this.clientWidth);
      }
      this.controller.setOptions(options);
      return;
    }

    this.controller = createVanillaGridController(options);
    this.controller.setBenchmarkHandler((iterations) => this.benchmarkRender(iterations));
    if (this.clientWidth > 0) {
      this.controller.setViewportWidth(this.clientWidth);
    }
    // Let the controller's cellNav.scrollToFocus delegate into our
    // element's scroll-and-focus helpers.
    this.controller.setCellNavScrollHandler((rowId, columnName) => {
      if (!rowId || !columnName) return;
      this.scrollFocusedRowIntoView(rowId);
      this.focusCellElement(rowId, columnName);
    });
    // Infinite-scroll resetScroll() brings the viewport back to the top.
    this.controller.setInfiniteScrollResetHandler(() => {
      const bodyViewport = this.shadowRoot?.querySelector<HTMLElement>('.grid-body-viewport');
      if (bodyViewport) {
        bodyViewport.scrollTop = 0;
        this.scrollPosition = 0;
      }
    });
    // saveState scroll capture/restore — element owns the DOM element, so
    // it provides the accessors the controller uses when save()/setState()
    // handle scroll-position fields.
    this.controller.setSaveStateScrollHandlers(
      () => ({ scrollTop: this.scrollPosition, scrollLeft: this.horizontalScrollPosition }),
      (scrollTop, scrollLeft) => {
        const bodyViewport = this.shadowRoot?.querySelector<HTMLElement>('.grid-body-viewport');
        if (!bodyViewport) return;
        // Defer to a rAF so the body has finished laying out after refresh.
        requestAnimationFrame(() => {
          bodyViewport.scrollTop = scrollTop;
          bodyViewport.scrollLeft = scrollLeft;
          this.scrollPosition = scrollTop;
          this.horizontalScrollPosition = scrollLeft;
          // Keep header/filter strips aligned after a restore.
          this.syncHeaderHorizontalScroll(scrollLeft);
        });
      },
    );
    // Importer file-picker: the element mounts a hidden <input type="file">
    // the first time the controller asks for one, then keeps it around so
    // subsequent imports reuse it. The controller stays DOM-free.
    this.controller.setImporterFilePickerHandler(() => {
      this.openImporterFilePicker();
    });
    this.unsubscribe = this.controller.subscribe((snapshot) => {
      this.snapshot = snapshot;
      this.render();
    });
  }

  /** Hidden file input used by `gridApi.importer.importAFile()`. Lazily
   * created on first use and reused thereafter. */
  private importerFileInput: HTMLInputElement | null = null;

  private openImporterFilePicker(): void {
    if (!this.controller) return;
    if (!this.importerFileInput) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.json,text/csv,application/json,text/plain';
      input.style.display = 'none';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file && this.controller) {
          void this.controller.gridApi.importer.importThisFile(file);
        }
        // Clear so the same file can be re-imported.
        input.value = '';
      });
      this.appendChild(input);
      this.importerFileInput = input;
    }
    this.importerFileInput.click();
  }

  private observeTemplateSlots(): void {
    observeTemplateSlots(this);
  }

  private bindEvents(): void {
    bindEvents(this);
  }

  private syncHeaderHorizontalScroll(scrollLeft: number): void {
    syncHeaderHorizontalScroll(this, scrollLeft);
  }

  private maybeTriggerInfiniteScroll(): void {
    maybeTriggerInfiniteScroll(this);
  }

  /** @internal */
  buildEffectiveOptions(options: VanillaGridOptions): VanillaGridOptions {
    // Merge: attributes are overridden by explicit JS property values.
    // JS property always wins: { ...attributeOptions, ...options }
    const merged = {
      ...this.attributeOptions,
      ...options,
    } as VanillaGridOptions;

    if (merged.enableExpandable && !merged.expandableRowTemplate) {
      merged.expandableRowTemplate = {
        createEmbeddedView: () => undefined,
      };
    }

    return merged;
  }

  /**
   * Ask the controller to evaluate whether the current scroll position
   * should request more data at the top or bottom — ports the old grid's
   * handleScroll → loadData check. The controller does the actual
   * needLoadMoreData / needLoadMoreDataTop raise.
   */
  /**
   * Mirror horizontal scroll from the body viewport onto the header + filter
   * strips by setting `scrollLeft` on them. Because those strips are real
   * scroll containers (with their scrollbars hidden), `position: sticky` on
   * pinned header / filter cells anchors to the strip's scroll position the
   * same way body cells anchor to `.grid-body-viewport`. This is the
   * imperative sync strategy the old ui-grid used in ui-grid-viewport.js.
   */
  /**
   * Targeted update for virtual scroll: replaces only the rendered rows inside
   * the existing `.grid-virtual-body` without touching the scroll container.
   * This preserves momentum/inertia scrolling because the `.grid-table` element
   * is never destroyed.
   */
  /** @internal */
  renderVirtualBody(): void {
    const snapshot = this.snapshot;
    if (!snapshot?.pipeline.virtualizationEnabled) {
      this.render();
      return;
    }

    const root = this.shadowRoot;
    const virtualBody = root?.querySelector<HTMLElement>('.grid-virtual-body');
    if (!root || !virtualBody) {
      this.render();
      return;
    }

    // Cancel any pending cell-only patch — the fresh rows we are about to
    // render already reflect the latest snapshot data.
    if (this.dataFrame !== null) {
      cancelAnimationFrame(this.dataFrame);
      this.dataFrame = null;
    }

    const bodyViewport = root?.querySelector<HTMLElement>('.grid-body-viewport');
    const bodyViewportHeight = bodyViewport
      ? Math.max(snapshot.rowSize, bodyViewport.clientHeight)
      : Math.max(snapshot.rowSize, (snapshot.options.minRowsToShow ?? 10) * snapshot.rowSize);
    const overscan = 4;
    const startIndex = Math.max(0, Math.floor(this.scrollPosition / snapshot.rowSize) - overscan);
    this.lastVirtualStartIndex = startIndex;
    const visibleCount = Math.ceil(bodyViewportHeight / snapshot.rowSize) + overscan * 2;
    const itemsToRender = snapshot.pipeline.displayItems.slice(
      startIndex,
      Math.min(snapshot.pipeline.displayItems.length, startIndex + visibleCount),
    );
    const virtualOffset = startIndex * snapshot.rowSize;

    virtualBody.style.top = `${virtualOffset}px`;
    virtualBody.innerHTML = itemsToRender
      .map((item, index) => this.renderDisplayItem(item, startIndex + index))
      .join('');
    // The body fingerprint now reflects the freshly-rendered slice so the
    // next full render() can take the fast per-cell patch path.
    this.lastItemsFingerprint = this.fingerprintItems(itemsToRender);
    this.lastVirtualOffset = virtualOffset;

    this.frameworkSlots.flush();
  }

  /** @internal */
  render(): void {
    if (this.skipNextRender) {
      return;
    }
    // A full render already incorporates the latest data — cancel any pending
    // frame-based updates to avoid redundant DOM mutations immediately after.
    if (this.dataFrame !== null) {
      cancelAnimationFrame(this.dataFrame);
      this.dataFrame = null;
    }
    if (this.scrollFrame !== null) {
      cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = null;
    }
    const root = this.ensureShadowRoot();
    const snapshot = this.snapshot;
    const previousViewport = root.querySelector<HTMLElement>('.grid-body-viewport');
    if (previousViewport && !this.suppressScrollEvent) {
      this.scrollPosition = previousViewport.scrollTop;
      this.horizontalScrollPosition = previousViewport.scrollLeft;
    }

    if (!snapshot) {
      this.lastStructureKey = null;
      this.lastItemsFingerprint = null;
      this.lastRowStateFingerprints.clear();
      this.lastEditingCellKey = null;
      this.lastFocusedCellKey = null;
      emptyTemplate({ message: 'No grid options provided.' }).connect(root);
      return;
    }

    const plan = this.buildRenderPlan(snapshot);

    // The shadow-DOM structure is only safe to patch when the set of sub-regions,
    // the visible column identity/order, and the pin/virt/filter/pagination
    // toggles are unchanged. Otherwise the existing nodes don't line up with the
    // new snapshot — fall back to a full re-mount.
    const canPatch =
      this.lastStructureKey !== null &&
      this.lastStructureKey === plan.structureKey &&
      root.querySelector('.grid-frame') !== null;

    if (canPatch) {
      this.renderPatch(plan, root);
    } else {
      this.renderFull(plan, root);
    }
    this.lastStructureKey = plan.structureKey;

    const bodyViewport = root.querySelector<HTMLElement>('.grid-body-viewport');
    if (bodyViewport && (this.scrollPosition > 0 || this.horizontalScrollPosition > 0)) {
      this.suppressScrollEvent = true;
      if (this.scrollPosition > 0) {
        bodyViewport.scrollTop = this.scrollPosition;
      }
      if (this.horizontalScrollPosition > 0) {
        bodyViewport.scrollLeft = this.horizontalScrollPosition;
      }
      // Keep the header/filter strips in sync on the first paint too.
      this.syncHeaderHorizontalScroll(this.horizontalScrollPosition);
      requestAnimationFrame(() => {
        this.suppressScrollEvent = false;
      });
    }

    const headerGrid = root.querySelector<HTMLElement>('.header-grid');
    const filterGrid = root.querySelector<HTMLElement>('.filter-grid');
    const nextHeaderStickyHeight = headerGrid?.offsetHeight ?? 0;
    const nextFilterStickyHeight = filterGrid?.offsetHeight ?? 0;
    const stickyHeightsChanged =
      nextHeaderStickyHeight !== this.measuredHeaderStickyHeight ||
      nextFilterStickyHeight !== this.measuredFilterStickyHeight;

    this.measuredHeaderStickyHeight = nextHeaderStickyHeight;
    this.measuredFilterStickyHeight = nextFilterStickyHeight;

    if (stickyHeightsChanged && !this.stickyHeightRelayoutQueued) {
      this.stickyHeightRelayoutQueued = true;
      requestAnimationFrame(() => {
        this.stickyHeightRelayoutQueued = false;
        if (!this.snapshot) {
          return;
        }
        this.render();
      });
    }

    this.autoAdjustHeight(snapshot);
  }

  /** @internal */
  private inAutoAdjust = false;
  private lastAutoHeight = 0;

  private autoAdjustHeight(snapshot: GridControllerSnapshot): void {
    if (this.inAutoAdjust) return;
    const options = snapshot.options;
    if (options.enableMinHeightCheck === false) return;

    const rowHeight = snapshot.rowSize;
    const minRows = options.minRowsToShow ?? 10;
    const headerHeight = this.measuredHeaderStickyHeight || options.headerRowHeight || 50;
    const filterHeight = this.measuredFilterStickyHeight;
    const paginationHeight = this.measuredPaginationHeight();
    const minHeight = headerHeight + filterHeight + paginationHeight + (minRows * rowHeight);

    if (this.clientHeight < minHeight || (paginationHeight > 0 && this.lastAutoHeight !== minHeight)) {
      this.lastAutoHeight = minHeight;
      this.style.height = `${minHeight}px`;
      this.inAutoAdjust = true;
      this.render();
      this.inAutoAdjust = false;
    }
  }

  measuredPaginationHeight(): number {
    const paginationEl = this.shadowRoot?.querySelector<HTMLElement>('ui-grid-pagination');
    if (!paginationEl) return 0;
    return paginationEl.offsetHeight || 44;
  }

  /** @internal */
  setupAutoResize(): void {
    if (this.autoResizeObserver) return;
    if (typeof ResizeObserver === 'undefined') return;

    this.autoResizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const newWidth = entry.contentRect.width;
      if (this.controller && newWidth > 0) {
        this.controller.setViewportWidth(newWidth);
      }

      if (this.autoResizeDebounceHandle !== null) {
        cancelAnimationFrame(this.autoResizeDebounceHandle);
      }
      this.autoResizeDebounceHandle = requestAnimationFrame(() => {
        this.autoResizeDebounceHandle = null;
        if (!this.snapshot) return;
        this.render();
      });
    });

    this.autoResizeObserver.observe(this);
  }

  /** @internal */
  teardownAutoResize(): void {
    if (this.autoResizeObserver) {
      this.autoResizeObserver.disconnect();
      this.autoResizeObserver = null;
    }
    if (this.autoResizeDebounceHandle !== null) {
      cancelAnimationFrame(this.autoResizeDebounceHandle);
      this.autoResizeDebounceHandle = null;
    }
  }

  private buildRenderPlan(snapshot: GridControllerSnapshot): {
    snapshot: GridControllerSnapshot;
    options: GridOptions;
    labels: GridControllerSnapshot['labels'];
    templateColumns: string;
    sortEnabled: boolean;
    filterEnabled: boolean;
    groupingEnabled: boolean;
    pinningEnabled: boolean;
    paginationEnabled: boolean;
    showPagination: boolean;
    virtualizationEnabled: boolean;
    itemsToRender: readonly DisplayItem[];
    startIndex: number;
    virtualOffset: number;
    totalVirtualHeight: number;
    structureKey: string;
  } {
    const controller = this.controller!;
    const options = snapshot.options;
    const labels = snapshot.labels;
    const templateColumns = snapshot.gridTemplateColumns;
    const sortEnabled = controller.isSortingEnabled();
    const filterEnabled = controller.isFilteringEnabled();
    const groupingEnabled = controller.isGroupingEnabled();
    const pinningEnabled = controller.isPinningEnabled();
    const paginationEnabled = controller.isPaginationEnabled();
    const showPagination = controller.shouldShowPaginationControls();
    const virtualizationEnabled = snapshot.pipeline.virtualizationEnabled;
    // Measure the body viewport from the DOM when available; on first paint
    // fall back to a reasonable default so virtualisation has something to
    // slice against until the element is measured.
    const bodyViewport = this.shadowRoot?.querySelector<HTMLElement>('.grid-body-viewport');
    const bodyViewportHeight = bodyViewport
      ? Math.max(snapshot.rowSize, bodyViewport.clientHeight)
      : Math.max(snapshot.rowSize, (options.minRowsToShow ?? 10) * snapshot.rowSize);

    let startIndex = 0;
    let itemsToRender: readonly DisplayItem[] = snapshot.pipeline.displayItems;
    let virtualOffset = 0;
    const totalVirtualHeight = snapshot.pipeline.displayItems.length * snapshot.rowSize;

    if (virtualizationEnabled) {
      const overscan = 4;
      startIndex = Math.max(0, Math.floor(this.scrollPosition / snapshot.rowSize) - overscan);
      this.lastVirtualStartIndex = startIndex;
      const visibleCount = Math.ceil(bodyViewportHeight / snapshot.rowSize) + overscan * 2;
      itemsToRender = snapshot.pipeline.displayItems.slice(
        startIndex,
        Math.min(snapshot.pipeline.displayItems.length, startIndex + visibleCount),
      );
      virtualOffset = startIndex * snapshot.rowSize;
    } else {
      this.lastVirtualStartIndex = -1;
    }

    // Structure key: only the outer-shell layout. Things that swap the body
    // container (virtualization flip, empty state, viewport scroll) or the
    // pagination element appearance are handled *inside* the patch path so a
    // filter keystroke that crosses the virtualization threshold doesn't
    // tear down the focused filter input.
    const columnFingerprint = snapshot.visibleColumns
      .map(
        (c) =>
          `${c.name}:${controller.isPinned(c) ? 'p' : ''}${controller.isPinnedLeftLast(c) ? 'L' : ''}${controller.isPinnedRightFirst(c) ? 'R' : ''}`,
      )
      .join('|');
    const structureKey = [
      columnFingerprint,
      filterEnabled ? '1' : '0',
      paginationEnabled ? '1' : '0',
    ].join('#');

    return {
      snapshot,
      options,
      labels,
      templateColumns,
      sortEnabled,
      filterEnabled,
      groupingEnabled,
      pinningEnabled,
      paginationEnabled,
      showPagination,
      virtualizationEnabled,
      itemsToRender,
      startIndex,
      virtualOffset,
      totalVirtualHeight,
      structureKey,
    };
  }

  private renderFull(
    plan: ReturnType<UiGridStandaloneElement['buildRenderPlan']>,
    _root: ShadowRoot,
  ): void {
    const {
      snapshot,
      options,
      labels,
      templateColumns,
      sortEnabled,
      filterEnabled,
      groupingEnabled,
      pinningEnabled,
      paginationEnabled,
      showPagination,
      virtualizationEnabled,
      itemsToRender,
      startIndex,
      virtualOffset,
      totalVirtualHeight,
    } = plan;

    const slotRegistry = this.renderSlotRegistry(snapshot.visibleColumns);
    const header = snapshot.visibleColumns
      .map((column) =>
        this.renderHeaderCell(column, sortEnabled, groupingEnabled, pinningEnabled, options),
      )
      .join('');

    const filterRow = filterEnabled
      ? filterRowMarkup(
          templateColumns,
          snapshot.visibleColumns.map((column) => this.renderFilterCell(column)).join(''),
        )
      : '';

    const bodyContent = itemsToRender
      .map((item, index) => this.renderDisplayItem(item, startIndex + index))
      .join('');

    const body =
      snapshot.pipeline.displayItems.length > 0
        ? virtualizationEnabled
          ? bodyVirtualMarkup(templateColumns, totalVirtualHeight, virtualOffset, bodyContent)
          : bodyStaticMarkup(templateColumns, bodyContent)
        : this.renderEmptyState(
            options.emptyMessage ?? labels.emptyHeading,
            labels.emptyDescription,
          );

    const pagination = paginationEnabled && showPagination ? this.renderPagination(snapshot) : '';

    this.gridTitle = escapeHtml(options.title ?? 'Data grid');
    const stickyTop = this.measuredHeaderStickyHeight || options.headerRowHeight || 50;
    const paginationHeight = this.measuredPaginationHeight();
    const tableHeight = this.clientHeight || ((options.minRowsToShow ?? 10) * snapshot.rowSize + (this.measuredHeaderStickyHeight || options.headerRowHeight || 50) + this.measuredFilterStickyHeight + paginationHeight);
    this.gridTableStyle = `--ui-grid-header-sticky-top:${stickyTop}px;height:${tableHeight}px;`;
    this.bodyViewportStyle = '';
    this.templateColumns = templateColumns;
    this.slotRegistry = slotRegistry;
    this.headerContent = header;
    this.filterRowContent = filterRow;
    this.bodyContent = body;
    this.paginationContent = pagination;

    gridShellTemplate(this).connect();

    // Flush framework-rendered slot deltas — dispatches cellSlotsChanged /
    // expandableRowSlotsChanged / groupRowSlotsChanged / headerSlotsChanged /
    // filterSlotsChanged / emptyStateSlotChanged with the adds + removes
    // relative to the previous render.
    this.frameworkSlots.flush();

    // After a full mount, the new DOM exactly matches the current item set —
    // seed the fingerprint so the next render can take the fast patch path.
    this.lastItemsFingerprint = this.fingerprintItems(plan.itemsToRender);
    this.lastVirtualOffset = plan.virtualOffset;
    this.lastTotalVirtualHeight = plan.totalVirtualHeight;
    // The row-state cache is keyed against the patched DOM. A full remount
    // wipes it; the next patch pass will repopulate as it walks rows.
    this.lastRowStateFingerprints.clear();
    this.lastEditingCellKey = this.controller?.getEditingCellKey() ?? null;
    this.lastFocusedCellKey = this.focusedCell
      ? `${this.focusedCell.rowId} ${this.focusedCell.columnName}`
      : null;
  }

  private renderPatch(
    plan: ReturnType<UiGridStandaloneElement['buildRenderPlan']>,
    root: ShadowRoot,
  ): void {
    renderPatch(this, plan, root);
  }

  private reconcileBodyRoot(
    root: ShadowRoot,
    kind: 'empty' | 'virtual' | 'static',
    options: GridOptions,
    labels: GridControllerSnapshot['labels'],
    templateColumns: string,
    virtualOffset: number,
    totalVirtualHeight: number,
  ): HTMLElement | null {
    return reconcileBodyRoot(this, root, kind, options, labels, templateColumns, virtualOffset, totalVirtualHeight);
  }

  private reconcilePagination(
    root: ShadowRoot,
    snapshot: GridControllerSnapshot,
    shouldShow: boolean,
  ): void {
    reconcilePagination(this, root, snapshot, shouldShow);
  }

  private patchFilterCells(filterGrid: HTMLElement, snapshot: GridControllerSnapshot): void {
    patchFilterCells(this, filterGrid, snapshot);
  }

  private fingerprintItems(items: readonly DisplayItem[]): string {
    return fingerprintItems(items);
  }

  private patchExistingRows(
    bodyContainer: HTMLElement,
    snapshot: GridControllerSnapshot,
    itemsToRender: readonly DisplayItem[],
    startIndex: number,
  ): void {
    patchExistingRows(this, bodyContainer, snapshot, itemsToRender, startIndex);
  }

  private patchGroupRow(el: HTMLElement, group: GroupItem): void {
    patchGroupRow(this, el, group);
  }

  private patchBodyCell(
    cell: HTMLElement,
    row: GridRow,
    column: GridColumnDef,
    displayIndex: number,
    templateMarkupMap: Map<string, string | null>,
  ): void {
    patchBodyCell(this, cell, row, column, displayIndex, templateMarkupMap);
  }

  private patchPagination(paginationEl: HTMLElement, snapshot: GridControllerSnapshot): void {
    patchPagination(this, paginationEl, snapshot);
  }

  private renderHeaderCell(
    column: GridColumnDef,
    sortEnabled: boolean,
    groupingEnabled: boolean,
    pinningEnabled: boolean,
    options: GridOptions,
  ): string {
    return renderHeaderCell(this, column, sortEnabled, groupingEnabled, pinningEnabled, options);
  }

  private renderFilterCell(column: GridColumnDef): string {
    return renderFilterCell(this, column);
  }

  /**
   * Commit the in-flight edit, then move keyboard focus relative to the
   * committed cell. Splits commit + focus across two paint frames: commit
   * runs synchronously (editor unmounts, cell re-renders with the new value),
   * then focus moves to the adjacent cell. Scheduling the focus in a
   * microtask avoids racing the blur handler's re-entry guard and ensures
   * the destination cell is fully reattached in the DOM.
   *
   * If the source cell was being edited, the destination cell enters edit
   * mode too (provided the destination column is editable). This keeps
   * Tab/Enter nav inside an edit session continuous — you keep editing as
   * you move. Arrow nav outside an edit session does NOT auto-enter edit.
   */
  private commitAndMove(
    fromRowId: string | null,
    fromColumnName: string | null,
    direction: 'left' | 'right' | 'up' | 'down',
  ): void {
    commitAndMove(this, fromRowId, fromColumnName, direction);
  }

  private moveGridFocus(
    direction: GridMoveDirection,
    rowId: string | null,
    columnName: string | null,
    opts: { resumeEdit?: boolean } = {},
  ): void {
    moveGridFocus(this, direction, rowId, columnName, opts);
  }

  private scrollFocusedRowIntoView(rowId: string): void {
    scrollFocusedRowIntoView(this, rowId);
  }

  private handleRowSelectionClick(rowId: string, columnName: string, event: Event): void {
    handleRowSelectionClick(this, rowId, columnName, event);
  }

  private handleRowHeaderCheckboxClick(rowId: string, event: Event): void {
    handleRowHeaderCheckboxClick(this, rowId, event);
  }

  private matchesKeyOverride(
    override: {
      keyCode?: number;
      key?: string;
      shiftKey?: boolean;
      ctrlKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    },
    event: KeyboardEvent,
  ): boolean {
    return matchesKeyOverride(override, event);
  }

  private applyFocusedCellClass(
    previous: { rowId: string; columnName: string } | null,
    next: { rowId: string; columnName: string } | null,
  ): void {
    applyFocusedCellClass(this, previous, next);
  }

  private focusCellElement(rowId: string | null, columnName: string | null): void {
    focusCellElement(this, rowId, columnName);
  }

  private measureAutoColumnWidth(columnName: string): number {
    return measureAutoColumnWidth(this, columnName);
  }

  private renderDisplayItem(item: DisplayItem, displayIndex: number): string {
    return renderDisplayItem(this, item, displayIndex);
  }

  private renderBodyCell(row: GridRow, column: GridColumnDef, displayIndex: number): string {
    return renderBodyCell(this, row, column, displayIndex);
  }

  private renderPagination(snapshot: GridControllerSnapshot): string {
    return renderPagination(this, snapshot);
  }

  private renderSlotRegistry(columns: readonly GridColumnDef[]): string {
    return renderSlotRegistry(columns);
  }

  private renderCellTemplate(row: GridRow, column: GridColumnDef, displayIndex: number): string {
    return renderCellTemplate(this, row, column, displayIndex);
  }

  private renderCellTemplateFromMarkup(
    row: GridRow,
    column: GridColumnDef,
    displayIndex: number,
    templateMarkup: string | null,
  ): string {
    return renderCellTemplateFromMarkup(this, row, column, displayIndex, templateMarkup);
  }

  private renderExpandableTemplate(row: GridRow): string {
    return renderExpandableTemplate(this, row);
  }

  private getTemplateMarkup(slotName: string): string | null {
    return getTemplateMarkupFromLightDom(this, slotName);
  }

  /** @internal Used by the render module to interpolate consumer templates. */
  interpolateTemplate(templateMarkup: string, context: Record<string, unknown>): string {
    return interpolateGridTemplate(templateMarkup, context, escapeHtml);
  }

  private rowIndexFor(row: GridRow, fallback = 0): number {
    return (
      this.snapshot?.pipeline.visibleRows.findIndex((candidate) => candidate.id === row.id) ??
      fallback
    );
  }

  private classifyDataRefresh(
    previousSnapshot: GridControllerSnapshot | null,
    nextSnapshot: GridControllerSnapshot | null,
  ): { mode: 'patch' | 'virtual' | 'full' | null; changedRowIds: Set<string> | null } {
    if (!nextSnapshot) {
      return { mode: 'full', changedRowIds: null };
    }

    if (!previousSnapshot) {
      return {
        mode: nextSnapshot.pipeline.virtualizationEnabled ? 'virtual' : 'full',
        changedRowIds: null,
      };
    }

    if (previousSnapshot.visibleColumns.length !== nextSnapshot.visibleColumns.length) {
      return { mode: 'full', changedRowIds: null };
    }

    for (let index = 0; index < previousSnapshot.visibleColumns.length; index += 1) {
      if (
        previousSnapshot.visibleColumns[index]?.name !== nextSnapshot.visibleColumns[index]?.name
      ) {
        return { mode: 'full', changedRowIds: null };
      }
    }

    const previousWindow = this.getRenderedDisplayWindow(previousSnapshot);
    const nextWindow = this.getRenderedDisplayWindow(nextSnapshot);
    if (
      previousWindow.startIndex !== nextWindow.startIndex ||
      previousWindow.items.length !== nextWindow.items.length
    ) {
      return {
        mode: nextSnapshot.pipeline.virtualizationEnabled ? 'virtual' : 'full',
        changedRowIds: null,
      };
    }

    const changedRowIds = new Set<string>();
    for (let index = 0; index < previousWindow.items.length; index += 1) {
      const previousItem = previousWindow.items[index];
      const nextItem = nextWindow.items[index];

      if (!previousItem || !nextItem || previousItem.kind !== 'row' || nextItem.kind !== 'row') {
        return {
          mode: nextSnapshot.pipeline.virtualizationEnabled ? 'virtual' : 'full',
          changedRowIds: null,
        };
      }

      if (previousItem.row.id !== nextItem.row.id) {
        return {
          mode: nextSnapshot.pipeline.virtualizationEnabled ? 'virtual' : 'full',
          changedRowIds: null,
        };
      }

      if (previousItem.row.entity !== nextItem.row.entity) {
        changedRowIds.add(nextItem.row.id);
      }
    }

    return {
      mode: changedRowIds.size > 0 ? 'patch' : null,
      changedRowIds: changedRowIds.size > 0 ? changedRowIds : null,
    };
  }

  private getRenderedDisplayWindow(snapshot: GridControllerSnapshot): {
    startIndex: number;
    items: readonly DisplayItem[];
  } {
    if (!snapshot.pipeline.virtualizationEnabled) {
      return {
        startIndex: 0,
        items: snapshot.pipeline.displayItems,
      };
    }

    const bodyViewport = this.shadowRoot?.querySelector<HTMLElement>('.grid-body-viewport');
    const bodyViewportHeight = bodyViewport
      ? Math.max(snapshot.rowSize, bodyViewport.clientHeight)
      : Math.max(snapshot.rowSize, (snapshot.options.minRowsToShow ?? 10) * snapshot.rowSize);
    const overscan = 4;
    const startIndex = Math.max(0, Math.floor(this.scrollPosition / snapshot.rowSize) - overscan);
    const visibleCount = Math.ceil(bodyViewportHeight / snapshot.rowSize) + overscan * 2;

    return {
      startIndex,
      items: snapshot.pipeline.displayItems.slice(
        startIndex,
        Math.min(snapshot.pipeline.displayItems.length, startIndex + visibleCount),
      ),
    };
  }

  private cellSlotName(column: GridColumnDef): string {
    return `cell-${column.name}`;
  }

  private renderEmptyState(headingRaw: string, descriptionRaw: string): string {
    return renderEmptyState(this, headingRaw, descriptionRaw);
  }

  /** @internal */
  downloadCsv(
    rowType: 'all' | 'visible' | 'selected' = 'visible',
    colType: 'all' | 'visible' = 'visible',
  ): void {
    if (!this.controller) {
      return;
    }
    this.controller.gridApi.exporter.csvExport(rowType, colType);
  }

  private renderControlIcon(key: UiGridControlIconKey): string {
    return this.icons.renderControlIcon(key);
  }

  private renderIconWithClass(svgClass: string, key: UiGridControlIconKey): string {
    return this.icons.renderIconWithClass(svgClass, key);
  }
}

export async function defineStandaloneUiGridElement(tagName = 'ui-grid-element'): Promise<void> {
  UIGridFilterCell.define();
  UIGridGroupRow.define();
  UIGridPagination.define();
  UIGridBodyCell.define();
  UIGridHeaderCell.define();
  UIGridTemplate.define();
  UIGridCellEditor.define();
  if (!customElements.get(tagName)) {
    customElements.define(tagName, UiGridStandaloneElement);
  }
}
