import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'findGridRowById':
      return wasm.find_grid_row_by_id_js(payload.input);
    case 'buildGridSortState':
      return wasm.build_grid_sort_state_js(payload.input);
    case 'resolveGridRowId':
      return wasm.resolve_grid_row_id_js(payload.input);
    default:
      throw new Error(`Unknown wasm identity command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
