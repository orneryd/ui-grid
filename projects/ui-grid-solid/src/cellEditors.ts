import { createErrorBoundary, createSignal, runWithOwner, untrack, type Owner } from 'solid-js';
import { render, type JSX } from '@solidjs/web';
import { getCellValue, type GridCellTemplateContext, type GridOptions, type GridRecord, type UiGridApi } from '@ornery/ui-grid-core';
import type { UiGridStandaloneElement } from '@ornery/ui-grid-vanilla';

export interface UiGridCellEditorContext extends GridCellTemplateContext {
  setValue: (value: string) => void;
  commit: () => void;
  cancel: () => void;
}

export interface UiGridCellEditors {
  [columnName: string]: (context: UiGridCellEditorContext) => JSX.Element;
}

interface EditorEntry {
  row: GridRecord;
  columnName: string;
  wrapper: HTMLSpanElement;
  nativeInput: HTMLInputElement;
  renderer: UiGridCellEditors[string];
  isFailed: () => boolean;
  update: (context: GridCellTemplateContext) => void;
  dispose: () => void;
}

export function createCellEditorBridge(
  element: UiGridStandaloneElement,
  owner: Owner | null,
  reportRendererError: (error: unknown) => void,
) {
  let entry: EditorEntry | undefined;
  let editors: UiGridCellEditors = {};
  let options: GridOptions;
  let api: UiGridApi | undefined;
  let unsubscribe: Array<() => void> = [];

  function remove() {
    if (!entry) return;
    const current = entry;
    entry = undefined;
    current.wrapper.querySelector<HTMLElement>('input,select,textarea,[tabindex]')?.blur();
    current.dispose();
    current.wrapper.remove();
    current.nativeInput.style.removeProperty('display');
    current.nativeInput.dataset['role'] = 'editor';
  }

  function rowId(row: GridRecord): string {
    const index = options.data.indexOf(row);
    return options.rowIdentity?.(row, index) ?? `${options.id}-${index}`;
  }

  function contextFor(row: GridRecord, columnName: string): GridCellTemplateContext | undefined {
    const column = options.columnDefs.find((candidate) => candidate.name === columnName);
    if (!column || !api) return undefined;
    const index = api.core.getVisibleRows().findIndex((candidate) => candidate.id === rowId(row));
    const value = getCellValue(row, column);
    return { $implicit: value, value, row, column, rowIndex: index };
  }

  function mount(row: GridRecord, columnName: string) {
    queueMicrotask(() => {
      const renderer = editors[columnName];
      const context = contextFor(row, columnName);
      const editorHost = [...(element.shadowRoot?.querySelectorAll<HTMLElement>('ui-grid-cell-editor') ?? [])]
        .find((candidate) => candidate.dataset['row'] === rowId(row) && candidate.dataset['column'] === columnName);
      const nativeInput = editorHost?.querySelector<HTMLInputElement>('input[data-role="editor"]');
      if (!renderer || !context || !editorHost || !nativeInput) return;
      remove();
      nativeInput.dataset['role'] = 'solid-editor-proxy';
      nativeInput.style.display = 'none';
      const wrapper = document.createElement('span');
      wrapper.dataset['solidEditor'] = columnName;
      const bounds = editorHost.getBoundingClientRect();
      wrapper.style.cssText = `position:fixed;z-index:2147483647;left:${bounds.left}px;top:${bounds.top}px;width:${bounds.width}px;height:${bounds.height}px`;
      wrapper.addEventListener('keydown', (event) => {
        if (event.defaultPrevented) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          api?.edit.endCellEdit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          api?.edit.cancelCellEdit();
        }
      });
      wrapper.addEventListener('focusout', (event) => {
        if (event.relatedTarget instanceof Node && wrapper.contains(event.relatedTarget)) return;
        api?.edit.endCellEdit();
      });
      element.parentElement?.appendChild(wrapper);
      let failed = false;
      let update!: EditorEntry['update'];
      const dispose = runWithOwner(owner, () => render(() => {
        const [current, setCurrent] = createSignal(context);
        update = setCurrent;
        const props: UiGridCellEditorContext = {
          get $implicit() { return current().$implicit; },
          get value() { return current().value; },
          get row() { return current().row; },
          get column() { return current().column; },
          get rowIndex() { return current().rowIndex; },
          setValue(value) {
            setCurrent((previous) => ({ ...previous, $implicit: value, value }));
            nativeInput.value = value;
            nativeInput.dataset['role'] = 'editor';
            nativeInput.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
            nativeInput.dataset['role'] = 'solid-editor-proxy';
          },
          commit() { api?.edit.endCellEdit(); },
          cancel() { api?.edit.cancelCellEdit(); },
        };
        return createErrorBoundary(
          () => renderer(props),
          (error) => {
            failed = true;
            queueMicrotask(() => untrack(() => reportRendererError(error())));
            return undefined;
          },
        )();
      }, wrapper));
      entry = { row, columnName, wrapper, nativeInput, renderer, isFailed: () => failed, update, dispose };
      queueMicrotask(() => wrapper.querySelector<HTMLElement>('input,select,textarea,[tabindex]')?.focus());
    });
  }

  function refresh() {
    if (!entry) return;
    const context = contextFor(entry.row, entry.columnName);
    if (context) entry.update(context);
  }

  return {
    registerApi(next: UiGridApi) {
      if (api === next) return;
      unsubscribe.forEach((dispose) => dispose());
      unsubscribe = [];
      api = next;
      unsubscribe.push(
        next.edit.on.beginCellEdit((row, column) => mount(row, column.name)),
        next.edit.on.afterCellEdit(() => remove()),
        next.edit.on.cancelCellEdit(() => remove()),
      );
    },
    configure(nextOptions: GridOptions, nextEditors: UiGridCellEditors = {}) {
      options = nextOptions;
      editors = nextEditors;
      if (!entry) return;
      const renderer = editors[entry.columnName];
      if (!renderer) {
        api?.edit.cancelCellEdit();
      } else if (renderer !== entry.renderer || entry.isFailed()) {
        const { row, columnName } = entry;
        remove();
        mount(row, columnName);
      } else {
        refresh();
      }
    },
    refresh,
    dispose() {
      unsubscribe.forEach((dispose) => dispose());
      unsubscribe = [];
      remove();
    },
  };
}
