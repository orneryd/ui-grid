import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'matchesGridRowFilters':
      return wasm.matches_grid_row_filters_js(payload.input);
    case 'matchesGridRowsPreparedFilters':
      return wasm.matches_grid_rows_prepared_filters_js(payload.input);
    case 'clearGridFilterReasons':
      return wasm.clear_grid_filter_reasons_js(payload.input);
    default:
      throw new Error(`Unknown wasm filtering command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
