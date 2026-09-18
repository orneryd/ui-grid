import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContext, createSignal, flush, onCleanup, useContext } from 'solid-js';
import { render } from '@solidjs/web';
import type { GridOptions, UiGridApi } from '@ornery/ui-grid-core';
import { UiGrid } from './UiGrid';

const initial: GridOptions = {
  id: 'solid-test',
  data: [{ id: 1, name: 'Alice' }],
  columnDefs: [{ name: 'name' }],
  rowIdentity: (row) => String(row['id']),
};
const disposers: Array<() => void> = [];
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  document.body.replaceChildren();
});

function mount(component: Parameters<typeof render>[0]) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const dispose = render(component, host);
  disposers.push(dispose);
  return { host, dispose };
}

function solidEditor<T extends Element>(host: HTMLElement, selector: string): T | null {
  return host.querySelector<T>(`[data-solid-editor] ${selector}`);
}

describe('UiGrid', () => {
  it('commits a focused Solid cell editor with Enter and disposes it', async () => {
    let api: UiGridApi | undefined;
    const cleanup = vi.fn();
    const afterEdit = vi.fn();
    const options: GridOptions = {
      ...initial,
      data: [{ id: 1, name: 'Alice' }],
      enableCellEdit: true,
      columnDefs: [{ name: 'name', enableCellEdit: true }],
    };
    const { host } = mount(() => <UiGrid options={options}
      onRegisterApi={(value) => {
        api = value;
        value.edit.on.afterCellEdit(afterEdit);
      }}
      cellEditors={{ name: (context) => {
        onCleanup(cleanup);
        return <input value={String(context.value ?? '')} onInput={(event) => context.setValue(event.currentTarget.value)} />;
      } }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    api!.edit.beginCellEdit(options.data[0], 'name');
    await vi.waitFor(() => expect(solidEditor(host, 'input')).not.toBeNull());
    const input = solidEditor<HTMLInputElement>(host, 'input')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    input.value = 'Alicia';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await vi.waitFor(() => expect(solidEditor(host, 'input')).toBeNull());
    expect(options.data[0]?.['name']).toBe('Alicia');
    expect(afterEdit).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('cancels a Solid cell editor with Escape without changing the value', async () => {
    let api: UiGridApi | undefined;
    const cancelled = vi.fn();
    const options: GridOptions = {
      ...initial,
      data: [{ id: 1, name: 'Alice' }],
      enableCellEdit: true,
      columnDefs: [{ name: 'name', enableCellEdit: true }],
    };
    const { host } = mount(() => <UiGrid options={options}
      onRegisterApi={(value) => {
        api = value;
        value.edit.on.cancelCellEdit(cancelled);
      }}
      cellEditors={{ name: (context) => (
        <input value={String(context.value ?? '')} onInput={(event) => context.setValue(event.currentTarget.value)} />
      ) }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    api!.edit.beginCellEdit(options.data[0], 'name');
    await vi.waitFor(() => expect(solidEditor(host, 'input')).not.toBeNull());
    const input = solidEditor<HTMLInputElement>(host, 'input')!;
    input.value = 'Discarded';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    await vi.waitFor(() => expect(solidEditor(host, 'input')).toBeNull());
    expect(options.data[0]?.['name']).toBe('Alice');
    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('supports select editors, blur commit and existing validation', async () => {
    let api: UiGridApi | undefined;
    const row = { id: 1, role: 'Engineer' };
    const column = { name: 'role', enableCellEdit: true, validators: { required: true } };
    const options: GridOptions = {
      ...initial,
      data: [row],
      columnDefs: [column],
      enableCellEdit: true,
    };
    const { host } = mount(() => <UiGrid options={options}
      onRegisterApi={(value) => { api = value; }}
      cellEditors={{ role: (context) => <select value={String(context.value ?? '')}
        onChange={(event) => context.setValue(event.currentTarget.value)}>
        <option value="">Choose role</option>
        <option value="Engineer">Engineer</option>
        <option value="Designer">Designer</option>
      </select> }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    api!.edit.beginCellEdit(row, 'role');
    await vi.waitFor(() => expect(solidEditor(host, 'select')).not.toBeNull());
    const select = solidEditor<HTMLSelectElement>(host, 'select')!;
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    select.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    select.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
    await vi.waitFor(() => expect(solidEditor(host, 'select')).toBeNull());
    expect(row.role).toBe('');
    await vi.waitFor(() => expect(api!.validate.isInvalid(row, column)).toBe(true));
  });

  it('isolates editor renderer errors and retries on an options update', async () => {
    let api: UiGridApi | undefined;
    const error = new Error('editor renderer failure');
    const onError = vi.fn();
    const [options, setOptions] = createSignal<GridOptions>({
      ...initial,
      data: [{ id: 1, name: 'Alice' }],
      enableCellEdit: true,
      columnDefs: [{ name: 'name', displayName: 'Broken', enableCellEdit: true }],
    });
    const { host } = mount(() => <UiGrid options={options()} onError={onError}
      onRegisterApi={(value) => { api = value; }} cellEditors={{ name: (context) => {
        if (context.column.displayName === 'Broken') throw error;
        return <input value={String(context.value ?? '')} />;
      } }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    api!.edit.beginCellEdit(options().data[0], 'name');
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
    flush(() => setOptions({
      ...options(),
      columnDefs: [{ name: 'name', displayName: 'Recovered', enableCellEdit: true }],
    }));
    await vi.waitFor(() => expect(solidEditor(host, 'input')).not.toBeNull());
    api!.edit.cancelCellEdit();
  });

  it('renders reactive expandable details and disposes them on collapse', async () => {
    let api: UiGridApi | undefined;
    const cleanup = vi.fn();
    const [options, setOptions] = createSignal<GridOptions>({
      ...initial,
      enableExpandable: true,
      expandableRowHeight: 96,
    });
    const { host, dispose } = mount(() => <UiGrid options={options()}
      onRegisterApi={(value) => { api = value; }}
      detailRenderer={(context) => {
        const [count, setCount] = createSignal(0);
        onCleanup(cleanup);
        return <button onClick={() => setCount((value) => value + 1)}>
          {String(context.row['name'])}:{context.rowIndex}:{String(context.expanded)}:{count()}
        </button>;
      }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    api!.expandable.toggleRowExpansion(options().data[0]);
    await vi.waitFor(() => expect(host.querySelector('[slot="expandable-row-1"] button')?.textContent)
      .toBe('Alice:0:true:0'));
    const button = host.querySelector<HTMLButtonElement>('[slot="expandable-row-1"] button')!;
    flush(() => button.click());
    flush(() => setOptions({ ...options(), data: [{ id: 1, name: 'Alice updated' }] }));
    await vi.waitFor(() => expect(button.textContent).toBe('Alice updated:0:true:1'));
    expect(host.querySelector('[slot="expandable-row-1"] button')).toBe(button);
    expect(api!.core.getVisibleRows()[0]?.expandedRowHeight).toBe(96);
    api!.expandable.toggleRowExpansion(options().data[0]);
    await vi.waitFor(() => expect(host.querySelector('[slot="expandable-row-1"]')).toBeNull());
    expect(cleanup).toHaveBeenCalledOnce();
    dispose();
  });

  it('updates detail row indexes after sorting without remounting', async () => {
    let api: UiGridApi | undefined;
    let mounts = 0;
    const options: GridOptions = {
      ...initial,
      data: [{ id: 1, name: 'Bob' }, { id: 2, name: 'Alice' }],
      enableExpandable: true,
      enableSorting: true,
    };
    const { host } = mount(() => <UiGrid options={options}
      onRegisterApi={(value) => { api = value; }}
      detailRenderer={(context) => {
        mounts++;
        return <span>{String(context.row['name'])}:{context.rowIndex}</span>;
      }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    api!.expandable.toggleRowExpansion(options.data[0]);
    await vi.waitFor(() => expect(host.querySelector('[slot="expandable-row-1"]')?.textContent)
      .toBe('Bob:0'));
    api!.core.sortColumn('name', 'asc');
    await vi.waitFor(() => expect(host.querySelector('[slot="expandable-row-1"]')?.textContent)
      .toBe('Bob:1'));
    expect(mounts).toBe(1);
  });

  it('disposes expanded detail renderers outside the virtualized window', async () => {
    let api: UiGridApi | undefined;
    let alive = 0;
    let removed = 0;
    const data = Array.from({ length: 1_000 }, (_, id) => ({ id, name: `Row ${id}` }));
    const { host, dispose } = mount(() => <UiGrid options={{
      ...initial,
      data,
      enableExpandable: true,
      enableVirtualization: true,
      virtualizationThreshold: 10,
      minRowsToShow: 5,
    }} onRegisterApi={(value) => { api = value; }} detailRenderer={(context) => {
      alive++;
      onCleanup(() => { alive--; removed++; });
      return <span>{String(context.row['name'])}</span>;
    }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    api!.expandable.toggleRowExpansion(data[0]);
    await vi.waitFor(() => expect(alive).toBe(1));
    const element = host.querySelector('ui-grid-element')!;
    const viewport = element.shadowRoot!.querySelector<HTMLElement>('.grid-body-viewport')!;
    viewport.scrollTop = 22_000;
    viewport.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect(alive).toBe(0));
    expect(removed).toBe(1);
    expect(host.querySelector('[slot="expandable-row-0"]')).toBeNull();
    dispose();
  });

  it('isolates detail renderer errors and recovers on the next options update', async () => {
    let api: UiGridApi | undefined;
    const error = new Error('detail renderer failure');
    const onError = vi.fn();
    const [options, setOptions] = createSignal<GridOptions>({
      ...initial,
      enableExpandable: true,
    });
    const { host } = mount(() => <UiGrid options={options()} onError={onError}
      onRegisterApi={(value) => { api = value; }} detailRenderer={(context) => {
        if (context.row['name'] === 'Alice') throw error;
        return <strong>{String(context.row['name'])}</strong>;
      }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    api!.expandable.toggleRowExpansion(options().data[0]);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
    flush(() => setOptions({ ...options(), data: [{ id: 1, name: 'Recovered' }] }));
    await vi.waitFor(() => expect(host.querySelector('[slot="expandable-row-1"]')?.textContent)
      .toBe('Recovered'));
  });

  it('renders reactive Solid headers while preserving header-local state', async () => {
    const [options, setOptions] = createSignal<GridOptions>({
      ...initial,
      columnDefs: [{ name: 'name', displayName: 'Original' }],
    });
    const cleanup = vi.fn();
    const { host, dispose } = mount(() => <UiGrid options={options()} headerRenderers={{
      name: (context) => {
        const [count, setCount] = createSignal(0);
        onCleanup(cleanup);
        return <button onClick={(event) => {
          event.preventDefault();
          setCount((value) => value + 1);
        }}>{context.value}:{count()}</button>;
      },
    }} />);
    await vi.waitFor(() => expect(host.querySelector('[slot="header-name"] button')?.textContent)
      .toBe('Original:0'), { timeout: 10000 });
    const button = host.querySelector<HTMLButtonElement>('[slot="header-name"] button')!;
    flush(() => button.click());
    flush(() => setOptions({ ...initial, columnDefs: [{ name: 'name', displayName: 'Updated' }] }));
    await vi.waitFor(() => expect(button.textContent).toBe('Updated:1'));
    expect(host.querySelector('[slot="header-name"] button')).toBe(button);
    expect(cleanup).not.toHaveBeenCalled();
    dispose();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('sorts through a Solid header click and allows preventDefault to opt out', async () => {
    let api: UiGridApi | undefined;
    const data = [{ id: 1, name: 'Bob' }, { id: 2, name: 'Alice' }];
    const { host } = mount(() => <UiGrid options={{
      ...initial, data, enableSorting: true,
    }} onRegisterApi={(value) => { api = value; }} headerRenderers={{
      name: (context) => <button>{context.value}</button>,
    }} />);
    await vi.waitFor(() => expect(host.querySelector('[slot="header-name"] button')).not.toBeNull(), { timeout: 10000 });
    host.querySelector<HTMLButtonElement>('[slot="header-name"] button')!.click();
    await vi.waitFor(() => expect(api!.core.getVisibleRows().map((row) => row.entity['name']))
      .toEqual(['Alice', 'Bob']));

    const [blocked, setBlocked] = createSignal(false);
    const blocker = (event: Event) => {
      if (blocked()) event.preventDefault();
    };
    const wrapper = host.querySelector<HTMLElement>('[slot="header-name"]')!;
    wrapper.addEventListener('click', blocker, { capture: true });
    flush(() => setBlocked(true));
    wrapper.querySelector('button')!.click();
    expect(api!.core.getVisibleRows().map((row) => row.entity['name'])).toEqual(['Alice', 'Bob']);
  });

  it('refreshes projected cell contexts after sorting through a Solid header', async () => {
    const data = [{ id: 1, name: 'Bob' }, { id: 2, name: 'Alice' }];
    const { host } = mount(() => <UiGrid options={{
      ...initial, data, enableSorting: true,
    }} headerRenderers={{
      name: (context) => <button>{context.value}</button>,
    }} cellRenderers={{
      name: (context) => <span>{String(context.value)}:{context.rowIndex}</span>,
    }} />);
    await vi.waitFor(() => {
      expect(host.querySelector('[slot="cell-name-1"]')?.textContent).toBe('Bob:0');
      expect(host.querySelector('[slot="cell-name-2"]')?.textContent).toBe('Alice:1');
    }, { timeout: 10000 });

    host.querySelector<HTMLButtonElement>('[slot="header-name"] button')!.click();

    await vi.waitFor(() => {
      expect(host.querySelector('[slot="cell-name-1"]')?.textContent).toBe('Bob:1');
      expect(host.querySelector('[slot="cell-name-2"]')?.textContent).toBe('Alice:0');
    });
  });

  it('keeps header slots aligned across API moves and disposes hidden headers', async () => {
    let api: UiGridApi | undefined;
    let alive = 0;
    const [options, setOptions] = createSignal<GridOptions>({
      ...initial,
      data: [{ id: 1, first: 'A', second: 'B' }],
      columnDefs: [{ name: 'first' }, { name: 'second' }],
      enableColumnMoving: true,
    });
    const renderer = (context: import('@ornery/ui-grid-core').GridHeaderTemplateContext) => {
      alive++;
      onCleanup(() => { alive--; });
      return <strong>{context.value}</strong>;
    };
    const { host, dispose } = mount(() => <UiGrid options={options()} onRegisterApi={(value) => { api = value; }}
      headerRenderers={{ first: renderer, second: renderer }} />);
    await vi.waitFor(() => expect(alive).toBe(2), { timeout: 10000 });
    api!.core.moveColumn(0, 1);
    const element = host.querySelector('ui-grid-element')!;
    await vi.waitFor(() => expect([...element.shadowRoot!.querySelectorAll('ui-grid-header-cell')]
      .map((header) => header.getAttribute('data-column'))).toEqual(['second', 'first']));
    expect(host.querySelector('[slot="header-first"]')?.textContent).toBe('First');
    expect(host.querySelector('[slot="header-second"]')?.textContent).toBe('Second');
    flush(() => setOptions({ ...options(), columnDefs: [
      { name: 'first', visible: false },
      { name: 'second', displayName: 'Second updated' },
    ] }));
    await vi.waitFor(() => expect(alive).toBe(1));
    expect(host.querySelector('[slot="header-first"]')).toBeNull();
    await vi.waitFor(() => expect(host.querySelector('[slot="header-second"]')?.textContent)
      .toBe('Second updated'));
    dispose();
    expect(alive).toBe(0);
  });

  it('isolates header renderer failures and remounts on the next options update', async () => {
    const error = new Error('header renderer failure');
    const onError = vi.fn();
    const [options, setOptions] = createSignal<GridOptions>({
      ...initial,
      columnDefs: [{ name: 'name', displayName: 'Broken' }],
    });
    const { host } = mount(() => <UiGrid options={options()} onError={onError} headerRenderers={{
      name: (context) => {
        if (context.value === 'Broken') throw error;
        return <strong>{context.value}</strong>;
      },
    }} />);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error), { timeout: 10000 });
    flush(() => setOptions({ ...initial, columnDefs: [{ name: 'name', displayName: 'Recovered' }] }));
    await vi.waitFor(() => expect(host.querySelector('[slot="header-name"]')?.textContent).toBe('Recovered'));
  });

  it('keeps projected cells aligned when columns move through the API', async () => {
    let api: UiGridApi | undefined;
    const options: GridOptions = {
      ...initial,
      data: [{ id: 1, first: 'A', second: 'B' }],
      columnDefs: [{ name: 'first' }, { name: 'second' }],
      enableColumnMoving: true,
    };
    const { host } = mount(() => <UiGrid options={options} onRegisterApi={(value) => { api = value; }}
      cellRenderers={{ first: (context) => <b>{String(context.value)}</b>, second: (context) => <i>{String(context.value)}</i> }} />);
    await vi.waitFor(() => expect(host.querySelectorAll('[slot]').length).toBe(2), { timeout: 10000 });
    api!.core.moveColumn(0, 1);
    const element = host.querySelector('ui-grid-element')!;
    await vi.waitFor(() => {
      const cells = [...element.shadowRoot!.querySelectorAll('ui-grid-body-cell[data-row="1"]')]
        .map((cell) => cell.getAttribute('data-column'));
      expect(cells).toEqual(['second', 'first']);
    });
    expect(host.querySelector('[slot="cell-first-1"]')?.textContent).toBe('A');
    expect(host.querySelector('[slot="cell-second-1"]')?.textContent).toBe('B');
  });

  it('reports renderer errors during initial rendering and reactive updates', async () => {
    const initialError = new Error('initial renderer failure');
    const updateError = new Error('update renderer failure');
    const onError = vi.fn();
    const [options, setOptions] = createSignal(initial);
    const { host } = mount(() => <UiGrid options={options()} onError={onError} cellRenderers={{
      name: (context) => <span>{(() => {
        if (context.value === 'Alice') throw initialError;
        if (context.value === 'Broken') throw updateError;
        return String(context.value);
      })()}</span>,
    }} />);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(initialError), { timeout: 10000 });
    flush(() => setOptions({ ...initial, data: [{ id: 1, name: 'Working' }] }));
    await vi.waitFor(() => expect(host.querySelector('[slot]')?.textContent).toBe('Working'));
    flush(() => setOptions({ ...initial, data: [{ id: 1, name: 'Broken' }] }));
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(updateError));
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('waits for Solid renderer work and reports one aggregate benchmark result', async () => {
    let api: UiGridApi | undefined;
    const [options, setOptions] = createSignal(initial);
    const { host } = mount(() => <UiGrid options={options()} onRegisterApi={(value) => { api = value; }}
      cellRenderers={{ name: (context) => <b>{String(context.value)}</b> }} />);
    await vi.waitFor(() => expect(api).toBeDefined(), { timeout: 10000 });
    const completed = vi.fn();
    const unsubscribe = api!.core.on.benchmarkComplete(completed);
    flush(() => setOptions({ ...initial, data: [{ id: 1, name: 'Benchmarked' }] }));
    const result = await api!.core.benchmark(3);
    expect(host.querySelector('[slot]')?.textContent).toBe('Benchmarked');
    expect(result.iterations).toBe(3);
    expect(result.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.averageMs).toBe(result.totalMs / 3);
    expect(completed).toHaveBeenCalledOnce();
    expect(completed).toHaveBeenCalledWith(result);
    unsubscribe();
  });
  it('updates nested fields and row indexes with custom identity through API refresh and sorting', async () => {
    const data = [{ key: 'a', profile: { name: 'Alice' } }, { key: 'b', profile: { name: 'Bob' } }];
    let api: UiGridApi | undefined;
    const { host } = mount(() => <UiGrid options={{ ...initial, data,
      rowIdentity: (row) => String(row['key']), columnDefs: [{ name: 'name', field: 'profile.name' }], enableSorting: true,
    }} onRegisterApi={(value) => { api = value; }} cellRenderers={{ name: (context) =>
      <b>{String(context.row['key'])}:{String(context.value)}:{context.rowIndex}</b>,
    }} />);
    await vi.waitFor(() => expect(host.querySelector('[slot="cell-name-a"]')?.textContent).toBe('a:Alice:0'), { timeout: 10000 });
    data[0].profile.name = 'Zoe';
    api!.core.refresh();
    await vi.waitFor(() => expect(host.querySelector('[slot="cell-name-a"]')?.textContent).toBe('a:Zoe:0'));
    api!.core.sortColumn('name', 'asc');
    await vi.waitFor(() => expect(host.querySelector('[slot="cell-name-a"]')?.textContent).toBe('a:Zoe:1'));
    expect(host.querySelector('[slot="cell-name-b"]')?.textContent).toBe('b:Bob:0');
  });

  it('updates column context and disposes cells when columns are hidden or removed', async () => {
    const [options, setOptions] = createSignal<GridOptions>(initial);
    let alive = 0;
    const { host } = mount(() => <UiGrid options={options()} cellRenderers={{ name: (context) => {
      alive++;
      onCleanup(() => { alive--; });
      return <b>{context.column.displayName}:{String(context.value)}</b>;
    } }} />);
    await vi.waitFor(() => expect(alive).toBe(1), { timeout: 10000 });
    flush(() => setOptions({ ...initial, columnDefs: [{ name: 'name', displayName: 'Updated' }] }));
    await vi.waitFor(() => expect(host.querySelector('[slot]')?.textContent).toBe('Updated:Alice'));
    flush(() => setOptions({ ...initial, columnDefs: [{ name: 'name', visible: false }] }));
    await vi.waitFor(() => expect(alive).toBe(0));
    flush(() => setOptions(initial));
    await vi.waitFor(() => expect(alive).toBe(1));
    flush(() => setOptions({ ...initial, columnDefs: [] }));
    await vi.waitFor(() => expect(alive).toBe(0));
    expect(host.querySelector('[slot]')).toBeNull();
  });

  it('isolates multiple grids and releases renderer subscriptions on repeated unmount', async () => {
    let alive = 0;
    const renderer = (context: import('@ornery/ui-grid-core').GridCellTemplateContext) => {
      alive++;
      onCleanup(() => { alive--; });
      return <b>{String(context.value)}</b>;
    };
    const stable = mount(() => <UiGrid options={initial} cellRenderers={{ name: renderer }} />);
    await vi.waitFor(() => expect(alive).toBe(1), { timeout: 10000 });
    for (let i = 0; i < 3; i++) {
      let api: UiGridApi | undefined;
      const transient = mount(() => <UiGrid options={{ ...initial, id: `transient-${i}` }}
        onRegisterApi={(value) => { api = value; }} cellRenderers={{ name: renderer }} />);
      await vi.waitFor(() => expect(alive).toBe(2));
      transient.dispose();
      expect(alive).toBe(1);
      api!.core.refresh();
      await Promise.resolve();
      expect(transient.host.querySelector('[slot]')).toBeNull();
      expect(stable.host.querySelector('[slot]')?.textContent).toBe('Alice');
    }
    stable.dispose();
    expect(alive).toBe(0);
  });
  it('bounds live renderers while scrolling a virtualized grid', async () => {
    let alive = 0;
    let removed = 0;
    const { host, dispose } = mount(() => <UiGrid options={{
      ...initial, data: Array.from({ length: 100_000 }, (_, id) => ({ id, name: `Row ${id}` })),
      enableVirtualization: true, virtualizationThreshold: 10, minRowsToShow: 5,
    }} cellRenderers={{ name: (context) => {
      alive++;
      onCleanup(() => { alive--; removed++; });
      return <b>{String(context.value)}</b>;
    } }} />);
    await vi.waitFor(() => expect(alive).toBeGreaterThan(0), { timeout: 10000 });
    const element = host.querySelector('ui-grid-element')!;
    const initialCount = alive;
    expect(initialCount).toBeLessThan(100_000);
    for (const top of [4400, 8800, 0]) {
      const viewport = element.shadowRoot!.querySelector<HTMLElement>('.grid-body-viewport')!;
      viewport.scrollTop = top;
      viewport.dispatchEvent(new Event('scroll'));
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(alive).toBeLessThanOrEqual(initialCount + 10);
      expect(element.querySelectorAll('[slot]').length).toBe(alive);
    }
    expect(removed).toBeGreaterThan(0);
    dispose();
    expect(alive).toBe(0);
  });
  it('projects Solid context, updates values and preserves cell state', async () => {
    const Context = createContext('default');
    const [options, setOptions] = createSignal(initial);
    const cleanup = vi.fn();
    const renderers = {
      name: (context: import('@ornery/ui-grid-core').GridCellTemplateContext) => {
        const label = useContext(Context);
        const [count, setCount] = createSignal(0);
        onCleanup(cleanup);
        return <button onClick={() => setCount((value) => value + 1)}>{label}:{String(context.value)}:{count()}</button>;
      },
    };
    const { host, dispose } = mount(() => <Context value="parent"><UiGrid options={options()} cellRenderers={renderers} /></Context>);
    await vi.waitFor(() => expect(host.querySelector('[slot] button')?.textContent).toBe('parent:Alice:0'), { timeout: 10000 });
    const button = host.querySelector<HTMLButtonElement>('[slot] button')!;
    flush(() => button.click());
    flush(() => setOptions({ ...initial, data: [{ id: 1, name: 'Bob' }] }));
    await vi.waitFor(() => expect(button.textContent).toBe('parent:Bob:1'));
    expect(host.querySelector('[slot] button')).toBe(button);
    expect(cleanup).not.toHaveBeenCalled();
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('disposes removed cells and switches renderer implementations without reconfiguring slots', async () => {
    const cleanup = vi.fn();
    const [renderers, setRenderers] = createSignal<import('./cellRenderers').UiGridCellRenderers>({ name: (context) => {
      onCleanup(cleanup);
      return <b>{String(context.value)}</b>;
    } });
    const { host } = mount(() => <UiGrid options={{ ...initial, enableFiltering: true }} cellRenderers={renderers()} />);
    await vi.waitFor(() => expect(host.querySelector('[slot] b')).not.toBeNull(), { timeout: 10000 });
    const element = host.querySelector('ui-grid-element') as import('@ornery/ui-grid-vanilla').UiGridStandaloneElement;
    const configure = vi.spyOn(element, 'setFrameworkRenderedSlots');
    flush(() => setRenderers({ name: (context) => <i>{String(context.value)}</i> }));
    await vi.waitFor(() => expect(host.querySelector('[slot] i')?.textContent).toBe('Alice'));
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(configure).not.toHaveBeenCalled();
    flush(() => setRenderers({}));
    await vi.waitFor(() => expect(host.querySelector('[slot]')).toBeNull());
    expect(configure).toHaveBeenCalledOnce();
  });

  it('cleans up cells filtered out through the API and mounts them again when visible', async () => {
    let api: UiGridApi | undefined;
    let alive = 0;
    const { host, dispose } = mount(() => <UiGrid options={{ ...initial, enableFiltering: true }} onRegisterApi={(value) => { api = value; }} cellRenderers={{ name: (context) => {
      alive++;
      onCleanup(() => { alive--; });
      return <b>{String(context.value)}</b>;
    } }} />);
    await vi.waitFor(() => expect(alive).toBe(1), { timeout: 10000 });
    for (let i = 0; i < 5; i++) {
      api!.core.setFilter('name', 'missing');
      await vi.waitFor(() => expect(alive).toBe(0));
      expect(host.querySelector('[slot]')).toBeNull();
      api!.core.clearAllFilters();
      await vi.waitFor(() => expect(alive).toBe(1));
    }
    dispose();
    expect(alive).toBe(0);
  });
  it('renders data and exposes the existing API to both callbacks', async () => {
    const onRegisterApi = vi.fn();
    const optionCallback = vi.fn();
    const { host } = mount(() => <UiGrid options={{ ...initial, onRegisterApi: optionCallback }} onRegisterApi={onRegisterApi} />);
    await vi.waitFor(() => expect(onRegisterApi).toHaveBeenCalledTimes(1), { timeout: 10000 });
    expect(optionCallback).toHaveBeenCalledWith(onRegisterApi.mock.calls[0][0]);
    expect(host.querySelector('ui-grid-element')?.shadowRoot?.textContent).toContain('Alice');
  });

  it('updates data and class while preserving the grid and API instances', async () => {
    const [options, setOptions] = createSignal(initial);
    const [className, setClassName] = createSignal('before');
    const onRegisterApi = vi.fn();
    const { host, dispose } = mount(() => <UiGrid options={options()} class={className()} onRegisterApi={onRegisterApi} />);
    await vi.waitFor(() => expect(onRegisterApi).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const element = host.querySelector('ui-grid-element')!;
    flush(() => {
      setOptions({ ...initial, data: [{ id: 1, name: 'Bob' }] });
      setClassName('after');
    });
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toContain('Bob'));
    expect(host.querySelector('ui-grid-element')).toBe(element);
    expect(host.firstElementChild?.className).toBe('after');
    expect(onRegisterApi.mock.calls.at(-1)?.[0]).toBe(onRegisterApi.mock.calls[0][0]);
    dispose();
    expect(element.isConnected).toBe(false);
  });

  it('does not mount after its owner is disposed during initialization', async () => {
    const onRegisterApi = vi.fn();
    const { host, dispose } = mount(() => <UiGrid options={initial} onRegisterApi={onRegisterApi} />);
    dispose();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(host.querySelector('ui-grid-element')).toBeNull();
    expect(onRegisterApi).not.toHaveBeenCalled();
  });

  it('preserves interactive sorting across reactive options updates', async () => {
    const [options, setOptions] = createSignal<GridOptions>({
      ...initial, enableSorting: true,
      data: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
    });
    let api: UiGridApi | undefined;
    mount(() => <UiGrid options={options()} onRegisterApi={(value) => { api = value; }} />);
    await vi.waitFor(() => expect(api).toBeDefined());
    api!.core.sortColumn('name', 'desc');
    flush(() => setOptions({ ...initial, enableSorting: true, data: [
      { id: 1, name: 'Aaron' }, { id: 2, name: 'Zoe' },
    ] }));
    expect(api!.core.getVisibleRows().map((row) => row.entity['name'])).toEqual(['Zoe', 'Aaron']);
  });

  it('reports initialization failures and removes the failed element', async () => {
    const error = new Error('consumer registration failed');
    const onError = vi.fn();
    const { host } = mount(() => <UiGrid options={initial} onRegisterApi={() => { throw error; }} onError={onError} />);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
    expect(host.querySelector('ui-grid-element')).toBeNull();
  });
});

