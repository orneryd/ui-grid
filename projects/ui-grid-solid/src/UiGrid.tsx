import { createEffect, getOwner, onCleanup, untrack } from 'solid-js';
import { isServer, type JSX } from '@solidjs/web';
import type { GridBenchmarkResult, GridOptions, UiGridApi } from '@ornery/ui-grid-core';
import type { UiGridStandaloneElement } from '@ornery/ui-grid-vanilla';
import { createCellRendererBridge, type UiGridCellRenderers } from './cellRenderers';
import { createHeaderRendererBridge, type UiGridHeaderRenderers } from './headerRenderers';
import { createDetailRendererBridge, type UiGridDetailRenderer } from './detailRenderer';
import { createCellEditorBridge, type UiGridCellEditors } from './cellEditors';

export interface UiGridProps {
  options: GridOptions;
  cellRenderers?: UiGridCellRenderers;
  headerRenderers?: UiGridHeaderRenderers;
  detailRenderer?: UiGridDetailRenderer;
  cellEditors?: UiGridCellEditors;
  class?: string;
  onRegisterApi?: (api: UiGridApi) => void;
  onError?: (error: unknown) => void;
}

export function UiGrid(props: UiGridProps): JSX.Element {
  let host!: HTMLDivElement;
  let element: UiGridStandaloneElement | undefined;
  let disposed = false;
  const owner = getOwner();
  let cells: ReturnType<typeof createCellRendererBridge> | undefined;
  let headers: ReturnType<typeof createHeaderRendererBridge> | undefined;
  let details: ReturnType<typeof createDetailRendererBridge> | undefined;
  let editors: ReturnType<typeof createCellEditorBridge> | undefined;
  let sourceApi: UiGridApi | undefined;
  let exposedApi: UiGridApi | undefined;
  let latestOptions = untrack(() => props.options);
  let latestRenderers = untrack(() => props.cellRenderers);
  let latestHeaderRenderers = untrack(() => props.headerRenderers);
  let latestDetailRenderer = untrack(() => props.detailRenderer);
  let latestEditors = untrack(() => props.cellEditors);
  let configureVersion = 0;
  const benchmarkListeners = new Set<(result: GridBenchmarkResult) => void>();
  const reportAdapterError = (error: unknown) => untrack(() => {
    if (props.onError) props.onError(error);
    else if (typeof reportError === 'function') reportError(error);
    else queueMicrotask(() => { throw error; });
  });

  function wrapApi(api: UiGridApi): UiGridApi {
    if (sourceApi === api && exposedApi) return exposedApi;
    sourceApi = api;
    const refreshAfter = <T,>(operation: () => T): T => {
      const result = operation();
      cells?.refresh();
      headers?.refresh();
      details?.refresh();
      editors?.refresh();
      return result;
    };
    exposedApi = {
      ...api,
      core: {
        ...api.core,
        on: {
          ...api.core.on,
          benchmarkComplete: (listener) => {
            benchmarkListeners.add(listener);
            return () => benchmarkListeners.delete(listener);
          },
        },
        refresh: () => refreshAfter(() => api.core.refresh()),
        queueGridRefresh: () => refreshAfter(() => api.core.queueGridRefresh()),
        queueRefresh: () => refreshAfter(() => api.core.queueRefresh()),
        refreshRows: () => refreshAfter(() => api.core.refreshRows()),
        setRowInvisible: (row, reason) => refreshAfter(() => api.core.setRowInvisible(row, reason)),
        clearRowInvisible: (row, reason) => refreshAfter(() => api.core.clearRowInvisible(row, reason)),
        setFilter: (columnName, value) => refreshAfter(() => api.core.setFilter(columnName, value)),
        clearAllFilters: () => refreshAfter(() => api.core.clearAllFilters()),
        sortColumn: (columnName, direction) =>
          refreshAfter(() => api.core.sortColumn(columnName, direction)),
        moveColumn: (fromIndex, toIndex) =>
          refreshAfter(() => api.core.moveColumn(fromIndex, toIndex)),
        groupByColumn: (columnName) => refreshAfter(() => api.core.groupByColumn(columnName)),
        clearGrouping: () => refreshAfter(() => api.core.clearGrouping()),
        benchmark: async (iterations) => {
          const loops = Math.max(1, iterations ?? latestOptions.benchmark?.iterations ?? 25);
          const now = () => typeof performance === 'undefined' ? Date.now() : performance.now();
          const started = now();
          let last: GridBenchmarkResult | undefined;
          for (let index = 0; index < loops; index += 1) {
            last = await api.core.benchmark(1);
            cells?.refresh();
            headers?.refresh();
            details?.refresh();
            await Promise.resolve();
          }
          const totalMs = now() - started;
          const result: GridBenchmarkResult = {
            iterations: loops,
            totalMs,
            averageMs: totalMs / loops,
            visibleRows: last?.visibleRows ?? 0,
            renderedItems: last?.renderedItems ?? 0,
          };
          for (const listener of benchmarkListeners) listener(result);
          return result;
        },
      },
    };
    return exposedApi;
  }

  const registerApi = (api: unknown) => untrack(() => {
    const source = api as UiGridApi;
    const wrapped = wrapApi(source);
    cells?.registerApi(wrapped);
    headers?.registerApi(wrapped);
    details?.registerApi(wrapped);
    editors?.registerApi(wrapped);
    props.onRegisterApi?.(wrapped);
    props.options.onRegisterApi?.(wrapped);
  });

  function applyOptions(
    options: GridOptions,
    renderers?: UiGridCellRenderers,
    headerRenderers?: UiGridHeaderRenderers,
    detailRenderer?: UiGridDetailRenderer,
    cellEditors?: UiGridCellEditors,
  ) {
    if (!element) return;
    latestOptions = options;
    latestRenderers = renderers;
    latestHeaderRenderers = headerRenderers;
    latestDetailRenderer = detailRenderer;
    latestEditors = cellEditors;
    element.options = {
      ...options,
      onRegisterApi: registerApi,
    };
    const version = ++configureVersion;
    queueMicrotask(() => {
      if (disposed || version !== configureVersion) return;
      cells?.configure(latestOptions, latestRenderers);
      headers?.configure(latestOptions, latestHeaderRenderers);
      details?.configure(latestOptions, latestDetailRenderer);
      editors?.configure(latestOptions, latestEditors);
    });
  }

  createEffect(() => ({
    options: { ...props.options },
    renderers: { ...props.cellRenderers },
    headerRenderers: { ...props.headerRenderers },
    detailRenderer: props.detailRenderer,
    cellEditors: { ...props.cellEditors },
  }), ({ options, renderers, headerRenderers, detailRenderer, cellEditors }) =>
    applyOptions(options, renderers, headerRenderers, detailRenderer, cellEditors));

  createEffect(() => !isServer, (client) => {
    if (!client) return;
    void (async () => {
      try {
        // The vanilla module extends HTMLElement, so it must only load on the client.
        const { defineStandaloneUiGridElement } = await import('@ornery/ui-grid-vanilla');
        if (disposed) return;
        await defineStandaloneUiGridElement();
        if (disposed) return;
        element = document.createElement('ui-grid-element') as UiGridStandaloneElement;
        element.style.cssText = 'display:block;height:100%;min-height:0';
        host.appendChild(element);
        cells = createCellRendererBridge(element, owner, reportAdapterError);
        headers = createHeaderRendererBridge(element, owner, reportAdapterError);
        details = createDetailRendererBridge(element, owner, reportAdapterError);
        editors = createCellEditorBridge(element, owner, reportAdapterError);
        untrack(() => applyOptions(
          { ...props.options },
          { ...props.cellRenderers },
          { ...props.headerRenderers },
          props.detailRenderer,
          { ...props.cellEditors },
        ));
      } catch (error) {
        cells?.dispose();
        headers?.dispose();
        details?.dispose();
        editors?.dispose();
        element?.remove();
        element = undefined;
        if (disposed) return;
        reportAdapterError(error);
      }
    })();
  });

  onCleanup(() => {
    disposed = true;
    cells?.dispose();
    headers?.dispose();
    details?.dispose();
    editors?.dispose();
    benchmarkListeners.clear();
    element?.remove();
    element = undefined;
  });

  return <div ref={host} class={props.class} style={{ display: 'block', height: '100%', 'min-height': '0' }} />;
}
