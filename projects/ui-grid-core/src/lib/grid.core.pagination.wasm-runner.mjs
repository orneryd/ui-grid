import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'getEffectivePageSize':
      return wasm.get_effective_page_size_js(payload.input);
    case 'getTotalPagesValue':
      return wasm.get_total_pages_value_js(payload.input);
    case 'getCurrentPageValue':
      return wasm.get_current_page_value_js(payload.input);
    case 'getFirstRowIndexValue':
      return wasm.get_first_row_index_value_js(payload.input);
    case 'getLastRowIndexValue':
      return wasm.get_last_row_index_value_js(payload.input);
    case 'paginateGridRows':
      return wasm.paginate_grid_rows_js(payload.input);
    case 'isVirtualizationEnabled':
      return wasm.is_virtualization_enabled_js(payload.input);
    case 'seekGridPage':
      return wasm.seek_grid_page_js(payload.input);
    case 'resolveGridPageSize':
      return wasm.resolve_grid_page_size_js(payload.input);
    case 'calculateVirtualWindow':
      return wasm.calculate_virtual_window_js(payload.input);
    default:
      throw new Error(`Unknown wasm pagination command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
