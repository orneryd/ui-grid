/**
 * Framework-rendered slot bridge for the vanilla grid element.
 *
 * The vanilla grid renders every cell / header / filter / group / expandable
 * / empty-state via string-interpolated templates by default. When a
 * framework wrapper (Angular, React, or any other consumer) wants to own
 * rendering of a slot with its own templating engine, it calls
 * `setFrameworkRenderedSlots()` on the element to flip slot kinds into
 * "slot placeholder" mode.
 *
 * In that mode the element emits `<slot name="…">` placeholders at the
 * usual render sites. The wrapper listens for the `*SlotsChanged` event
 * this module dispatches and inserts light-DOM nodes with matching `slot`
 * attributes carrying its framework-rendered content. Slot projection then
 * composes the wrapper's view back into the shadow tree without the
 * wrapper ever touching the shadow DOM directly.
 *
 * Slot naming conventions:
 *   - `cell-<columnName>-<rowId>`     per-cell (one slot per rendered body cell)
 *   - `header-<columnName>`           per-column, singleton
 *   - `filter-<columnName>`           per-column, singleton
 *   - `group-row-<groupId>`           per-group
 *   - `expandable-row-<rowId>`        per-row
 *   - `empty`                         singleton
 */

import {
  buildGridHeaderContext,
  getCellValue,
  type GridCellTemplateContext,
  type GridColumnDef,
  type GridExpandableTemplateContext,
  type GridHeaderTemplateContext,
  type GridLabels,
  type GridRecord,
  type GridRow,
  type GroupItem,
} from '@ornery/ui-grid-core';

/** Which slot kinds the element should render as `<slot>` placeholders. */
export interface FrameworkRenderedSlotsConfig {
  /** Column names whose body cells are framework-rendered. Everything else
   * continues to use the vanilla interpolation path. */
  cells?: readonly string[];
  /** Column names whose header cells are framework-rendered. */
  headers?: readonly string[];
  /** Column names whose filter cells are framework-rendered. */
  filters?: readonly string[];
  /** When true, group rows are emitted as slot placeholders. */
  groupRow?: boolean;
  /** When true, expandable detail rows are emitted as slot placeholders. */
  expandableRow?: boolean;
  /** When true, the empty-state panel is emitted as a slot placeholder. */
  emptyState?: boolean;
}

export interface FrameworkCellSlot {
  slotName: string;
  columnName: string;
  rowId: string;
  rowIndex: number;
  context: GridCellTemplateContext;
}

export interface FrameworkHeaderSlot {
  slotName: string;
  columnName: string;
  context: GridHeaderTemplateContext;
}

export interface FrameworkFilterSlot {
  slotName: string;
  columnName: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  column: GridColumnDef;
}

export interface FrameworkGroupRowSlot {
  slotName: string;
  groupId: string;
  field: string;
  label: string;
  count: number;
  depth: number;
  collapsed: boolean;
}

export interface FrameworkExpandableRowSlot {
  slotName: string;
  rowId: string;
  rowIndex: number;
  context: GridExpandableTemplateContext;
}

export interface FrameworkEmptyStateSlot {
  slotName: 'empty';
  heading: string;
  description: string;
  labels: GridLabels;
}

export interface FrameworkSlotDelta<TSlot> {
  added: TSlot[];
  removed: TSlot[];
}

export function cellSlotName(column: GridColumnDef): string {
  return `cell-${column.name}`;
}

export function cellSlotNameForRow(column: GridColumnDef, row: GridRow): string {
  return `cell-${column.name}-${row.id}`;
}

export function headerSlotName(column: GridColumnDef): string {
  return `header-${column.name}`;
}

export function filterSlotName(column: GridColumnDef): string {
  return `filter-${column.name}`;
}

export function groupRowSlotName(group: GroupItem): string {
  return `group-row-${group.id}`;
}

export function expandableRowSlotName(row: GridRow): string {
  return `expandable-row-${row.id}`;
}

/**
 * Bridge state + behavior. The element creates one instance, reads the
 * `has*` methods during render to decide which path to take, calls the
 * `stage*` methods as it emits slot placeholders, and calls `flush()` at
 * the end of each render pass to emit the add/remove delta.
 */
export class FrameworkSlotBridge {
  private flaggedCells = new Set<string>();
  private flaggedHeaders = new Set<string>();
  private flaggedFilters = new Set<string>();
  private flaggedGroupRow = false;
  private flaggedExpandableRow = false;
  private flaggedEmptyState = false;

  private lastCellSlots = new Map<string, FrameworkCellSlot>();
  private lastExpandableRowSlots = new Map<string, FrameworkExpandableRowSlot>();
  private lastGroupRowSlots = new Map<string, FrameworkGroupRowSlot>();
  private lastHeaderSlots = new Map<string, FrameworkHeaderSlot>();
  private lastFilterSlots = new Map<string, FrameworkFilterSlot>();
  private lastEmptyStateSlot: FrameworkEmptyStateSlot | null = null;

  private pendingCellSlots = new Map<string, FrameworkCellSlot>();
  private pendingExpandableRowSlots = new Map<string, FrameworkExpandableRowSlot>();
  private pendingGroupRowSlots = new Map<string, FrameworkGroupRowSlot>();
  private pendingHeaderSlots = new Map<string, FrameworkHeaderSlot>();
  private pendingFilterSlots = new Map<string, FrameworkFilterSlot>();
  private pendingEmptyStateSlot: FrameworkEmptyStateSlot | null = null;

  constructor(private readonly host: EventTarget) {}

  /**
   * Apply a slots config. Returns true when the structural set changed (and
   * therefore a re-render is required), false when the config is a no-op.
   */
  configure(config: FrameworkRenderedSlotsConfig): boolean {
    let structureChanged = false;

    if (config.cells !== undefined) {
      const next = new Set(config.cells);
      if (!setsEqual(next, this.flaggedCells)) {
        this.flaggedCells = next;
        structureChanged = true;
      }
    }

    if (config.headers !== undefined) {
      const next = new Set(config.headers);
      if (!setsEqual(next, this.flaggedHeaders)) {
        this.flaggedHeaders = next;
        structureChanged = true;
      }
    }

    if (config.filters !== undefined) {
      const next = new Set(config.filters);
      if (!setsEqual(next, this.flaggedFilters)) {
        this.flaggedFilters = next;
        structureChanged = true;
      }
    }

    if (config.groupRow !== undefined && config.groupRow !== this.flaggedGroupRow) {
      this.flaggedGroupRow = config.groupRow;
      structureChanged = true;
    }

    if (
      config.expandableRow !== undefined &&
      config.expandableRow !== this.flaggedExpandableRow
    ) {
      this.flaggedExpandableRow = config.expandableRow;
      structureChanged = true;
    }

    if (config.emptyState !== undefined && config.emptyState !== this.flaggedEmptyState) {
      this.flaggedEmptyState = config.emptyState;
      structureChanged = true;
    }

    return structureChanged;
  }

  // Flag predicates — used by the render path to decide whether to emit a
  // `<slot>` placeholder or run the default string-interpolation template.

  hasCell(columnName: string): boolean {
    return this.flaggedCells.has(columnName);
  }

  hasHeader(columnName: string): boolean {
    return this.flaggedHeaders.has(columnName);
  }

  hasFilter(columnName: string): boolean {
    return this.flaggedFilters.has(columnName);
  }

  hasGroupRow(): boolean {
    return this.flaggedGroupRow;
  }

  hasExpandableRow(): boolean {
    return this.flaggedExpandableRow;
  }

  hasEmptyState(): boolean {
    return this.flaggedEmptyState;
  }

  // Staging methods — called as the render path emits slot placeholders.
  // Each call records one slot descriptor into `pending*`. At the end of
  // the render pass, `flush()` diffs pending vs. last and emits events.

  stageCell(column: GridColumnDef, row: GridRow, rowIndex: number): void {
    const slotName = cellSlotNameForRow(column, row);
    const value = getCellValue(row.entity as GridRecord, column);
    this.pendingCellSlots.set(slotName, {
      slotName,
      columnName: column.name,
      rowId: row.id,
      rowIndex,
      context: {
        $implicit: value,
        value,
        row: row.entity as GridRecord,
        column,
        rowIndex,
      },
    });
  }

  /**
   * Carry forward every previously-known cell slot for `rowId` into the
   * current pending set. Used by the structural patch path when a row's
   * fingerprint matches the previous render's: `stageCell` would normally
   * re-record the slot during cell rendering, but the fingerprint
   * short-circuit skips the render pass for unchanged rows. Without this,
   * `flush()` would diff pending (missing the row's slots) against last
   * (containing them) and emit a spurious `removed` for every cell of the
   * unchanged row, destroying the framework wrappers' projected content.
   */
  carryRowCells(rowId: string): void {
    for (const [slotName, slot] of this.lastCellSlots) {
      if (slot.rowId === rowId) {
        this.pendingCellSlots.set(slotName, slot);
      }
    }
  }

  stageExpandableRow(row: GridRow, rowIndex: number): void {
    const slotName = expandableRowSlotName(row);
    this.pendingExpandableRowSlots.set(slotName, {
      slotName,
      rowId: row.id,
      rowIndex,
      context: {
        $implicit: row.entity as GridRecord,
        row: row.entity as GridRecord,
        expanded: row.expanded,
        rowIndex,
      },
    });
  }

  stageGroupRow(group: GroupItem): void {
    const slotName = groupRowSlotName(group);
    this.pendingGroupRowSlots.set(slotName, {
      slotName,
      groupId: group.id,
      field: group.field,
      label: group.label,
      count: group.count,
      depth: group.depth,
      collapsed: group.collapsed,
    });
  }

  stageHeader(column: GridColumnDef): void {
    const slotName = headerSlotName(column);
    this.pendingHeaderSlots.set(slotName, {
      slotName,
      columnName: column.name,
      context: buildGridHeaderContext(column),
    });
  }

  stageFilter(
    column: GridColumnDef,
    value: string,
    placeholder: string,
    disabled: boolean,
  ): void {
    const slotName = filterSlotName(column);
    this.pendingFilterSlots.set(slotName, {
      slotName,
      columnName: column.name,
      value,
      placeholder,
      disabled,
      column,
    });
  }

  stageEmptyState(heading: string, description: string, labels: GridLabels): void {
    this.pendingEmptyStateSlot = {
      slotName: 'empty',
      heading,
      description,
      labels,
    };
  }

  /**
   * Diff pending vs. last, dispatch `*SlotsChanged` events for every kind
   * that moved, then swap last = pending and reset pending. Called at the
   * end of every render pass.
   */
  flush(): void {
    this.diffAndEmit(this.lastCellSlots, this.pendingCellSlots, 'cellSlotsChanged');
    this.lastCellSlots = this.pendingCellSlots;
    this.pendingCellSlots = new Map();

    this.diffAndEmit(
      this.lastExpandableRowSlots,
      this.pendingExpandableRowSlots,
      'expandableRowSlotsChanged',
    );
    this.lastExpandableRowSlots = this.pendingExpandableRowSlots;
    this.pendingExpandableRowSlots = new Map();

    this.diffAndEmit(
      this.lastGroupRowSlots,
      this.pendingGroupRowSlots,
      'groupRowSlotsChanged',
    );
    this.lastGroupRowSlots = this.pendingGroupRowSlots;
    this.pendingGroupRowSlots = new Map();

    this.diffAndEmit(this.lastHeaderSlots, this.pendingHeaderSlots, 'headerSlotsChanged');
    this.lastHeaderSlots = this.pendingHeaderSlots;
    this.pendingHeaderSlots = new Map();

    this.diffAndEmit(this.lastFilterSlots, this.pendingFilterSlots, 'filterSlotsChanged');
    this.lastFilterSlots = this.pendingFilterSlots;
    this.pendingFilterSlots = new Map();

    this.diffAndEmitSingleton(
      this.lastEmptyStateSlot,
      this.pendingEmptyStateSlot,
      'emptyStateSlotChanged',
    );
    this.lastEmptyStateSlot = this.pendingEmptyStateSlot;
    this.pendingEmptyStateSlot = null;
  }

  /**
   * Data-only patch variant: merge pending entries into last without firing
   * events, since the slot structure hasn't changed (only cell contexts
   * refreshed). Wrappers that need context updates subscribe to
   * `rowsVisibleChanged`.
   */
  mergePendingIntoLast(): void {
    for (const [key, slot] of this.pendingCellSlots) this.lastCellSlots.set(key, slot);
    this.pendingCellSlots = new Map();
    this.pendingExpandableRowSlots = new Map();
    this.pendingGroupRowSlots = new Map();
    this.pendingHeaderSlots = new Map();
    this.pendingFilterSlots = new Map();
    this.pendingEmptyStateSlot = null;
  }

  /**
   * On element teardown, emit `removed` for every remaining slot so wrappers
   * can destroy their views.
   */
  flushRemovals(): void {
    this.flush(); // pending maps are empty → every `last` entry becomes a removal.
  }

  private diffAndEmit<TSlot extends { slotName: string }>(
    previous: Map<string, TSlot>,
    current: Map<string, TSlot>,
    eventName: string,
  ): void {
    const added: TSlot[] = [];
    const removed: TSlot[] = [];
    for (const [key, slot] of current) {
      if (!previous.has(key)) added.push(slot);
    }
    for (const [key, slot] of previous) {
      if (!current.has(key)) removed.push(slot);
    }
    if (added.length === 0 && removed.length === 0) return;
    this.host.dispatchEvent(
      new CustomEvent<FrameworkSlotDelta<TSlot>>(eventName, {
        detail: { added, removed },
        bubbles: false,
        composed: false,
      }),
    );
  }

  private diffAndEmitSingleton<TSlot>(
    previous: TSlot | null,
    current: TSlot | null,
    eventName: string,
  ): void {
    if (previous === current) return;
    if (!previous && !current) return;
    const added: TSlot[] = current ? [current] : [];
    const removed: TSlot[] = previous ? [previous] : [];
    this.host.dispatchEvent(
      new CustomEvent<FrameworkSlotDelta<TSlot>>(eventName, {
        detail: { added, removed },
        bubbles: false,
        composed: false,
      }),
    );
  }
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}
