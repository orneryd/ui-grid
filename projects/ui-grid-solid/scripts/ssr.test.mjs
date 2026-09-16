import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToString } from '@solidjs/web';
import { UiGrid } from '@ornery/ui-grid-solid';

test('published server entry renders a host without browser globals or API registration', async () => {
  assert.equal(typeof HTMLElement, 'undefined');
  let registrations = 0;
  let renders = 0;
  let headerRenders = 0;
  let detailRenders = 0;
  let editorRenders = 0;
  const html = await renderToString(() => UiGrid({
    class: 'server-grid',
    options: { id: 'ssr', data: [{ name: 'Alice' }], columnDefs: [{ name: 'name' }] },
    cellRenderers: { name: () => { renders++; return 'cell'; } },
    headerRenderers: { name: () => { headerRenders++; return 'header'; } },
    detailRenderer: () => { detailRenders++; return 'detail'; },
    cellEditors: { name: () => { editorRenders++; return 'editor'; } },
    onRegisterApi: () => registrations++,
  }));
  assert.match(html, /server-grid/);
  assert.doesNotMatch(html, /ui-grid-element/);
  assert.equal(registrations, 0);
  assert.equal(renders, 0);
  assert.equal(headerRenders, 0);
  assert.equal(detailRenders, 0);
  assert.equal(editorRenders, 0);
});
