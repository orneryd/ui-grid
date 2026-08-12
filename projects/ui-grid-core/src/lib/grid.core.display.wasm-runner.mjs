import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'getCellValue':
      return wasm.get_cell_value_js(payload.input);
    case 'stringifyCellValue':
      return wasm.stringify_cell_value_js(payload.input);
    case 'formatGridCellDisplayValue':
      return wasm.format_grid_cell_display_value_js(payload.input);
    default:
      throw new Error(`Unknown wasm display command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
