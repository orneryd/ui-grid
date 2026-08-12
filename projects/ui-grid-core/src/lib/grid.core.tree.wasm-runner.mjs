import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'isTreeEnabled':
      return wasm.is_tree_enabled_js(payload.input);
    case 'buildGridRows':
      return wasm.build_grid_rows_js(payload.input);
    case 'filterAndFlattenGridTreeRows':
      return wasm.filter_and_flatten_grid_tree_rows_js(payload.input);
    default:
      throw new Error(`Unknown wasm tree command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
