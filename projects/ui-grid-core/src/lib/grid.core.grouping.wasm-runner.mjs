import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'buildGridDisplayItems':
      return wasm.build_grid_display_items_js(payload.input);
    default:
      throw new Error(`Unknown wasm grouping command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
