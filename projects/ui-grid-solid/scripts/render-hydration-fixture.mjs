import { renderToString } from '@solidjs/web';
import { UiGrid } from '../dist/server.js';

const html = await renderToString(() => UiGrid({
  class: 'hydrated-grid',
  options: {
    id: 'hydrated-grid',
    data: [{ id: 1, name: 'Alice' }],
    columnDefs: [{ name: 'name' }],
    rowIdentity: (row) => String(row.id),
  },
}));

process.stdout.write(html);
