import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'guessGridSortKind':
      return wasm.guess_grid_sort_kind_js(payload.input);
    case 'compareGridSortValues':
      return wasm.compare_grid_sort_values_js(payload.input);
    case 'sortGridScalarValues':
      return wasm.sort_grid_scalar_values_js(payload.input);
    default:
      throw new Error(`Unknown wasm row-sorter command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
