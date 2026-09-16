import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const fixturePath = fileURLToPath(new URL('./render-hydration-fixture.mjs', import.meta.url));

function installBrowserGlobals(window) {
  const values = {
    window,
    self: window,
    document: window.document,
    navigator: window.navigator,
    customElements: window.customElements,
    Node: window.Node,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLSelectElement: window.HTMLSelectElement,
    HTMLTextAreaElement: window.HTMLTextAreaElement,
    HTMLTemplateElement: window.HTMLTemplateElement,
    DocumentFragment: window.DocumentFragment,
    SVGElement: window.SVGElement,
    ShadowRoot: window.ShadowRoot,
    Event: window.Event,
    CustomEvent: window.CustomEvent,
    KeyboardEvent: window.KeyboardEvent,
    FocusEvent: window.FocusEvent,
    MouseEvent: window.MouseEvent,
    MutationObserver: window.MutationObserver,
    ResizeObserver: window.ResizeObserver,
    CSSStyleSheet: window.CSSStyleSheet,
    getComputedStyle: window.getComputedStyle.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
  };
  for (const [name, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
}

async function waitFor(check, timeout = 10_000) {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started >= timeout) throw new Error('Timed out waiting for hydrated grid state.');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test('server markup hydrates, updates and unmounts during navigation', async () => {
  const serverHtml = execFileSync(process.execPath, [fixturePath], { encoding: 'utf8' });
  const window = new Window({ url: 'http://localhost/' });
  installBrowserGlobals(window);
  globalThis._$HY = { events: [], completed: new WeakSet(), r: {}, fe() {} };

  const [{ createSignal, flush }, { hydrate }, { UiGrid }] = await Promise.all([
    import('solid-js'),
    import('@solidjs/web'),
    import('../dist/index.js'),
  ]);
  const root = document.createElement('main');
  root.innerHTML = serverHtml;
  document.body.appendChild(root);
  const serverHost = root.firstElementChild;
  const [options, setOptions] = createSignal({
    id: 'hydrated-grid',
    data: [{ id: 1, name: 'Alice' }],
    columnDefs: [{ name: 'name' }],
    rowIdentity: (row) => String(row.id),
  });
  const messages = [];
  const originalError = console.error;
  console.error = (...args) => messages.push(args.map(String).join(' '));

  try {
    const dispose = hydrate(() => UiGrid({
      class: 'hydrated-grid',
      get options() { return options(); },
    }), root);
    assert.equal(root.firstElementChild, serverHost);
    await waitFor(() => root.querySelector('ui-grid-element'));
    flush(() => setOptions({ ...options(), data: [{ id: 1, name: 'Bob' }] }));
    await waitFor(() => root.querySelector('ui-grid-element')?.shadowRoot
      ?.querySelector('[data-row="1"][data-column="name"]')?.textContent?.includes('Bob'));
    dispose();
    assert.equal(root.querySelector('ui-grid-element'), null);
    assert.deepEqual(messages.filter((message) => /hydration|mismatch/i.test(message)), []);
  } finally {
    console.error = originalError;
    window.close();
    Reflect.deleteProperty(globalThis, '_$HY');
  }
});
