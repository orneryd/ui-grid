import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'getGridFilterTerm':
      return wasm.get_grid_filter_term_js(payload.input);
    case 'setupGridFilters':
      return wasm.setup_grid_filters_js(payload.input);
    case 'runGridColumnFilter':
      return wasm.run_grid_column_filter_js(payload.input);
    default:
      throw new Error(`Unknown wasm row-searcher command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
