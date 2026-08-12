import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'toggleGridRowExpanded':
      return wasm.toggle_grid_row_expanded_js(payload.input);
    case 'expandAllGridRows':
      return wasm.expand_all_grid_rows_js(payload.input);
    case 'areAllGridRowsExpanded':
      return wasm.are_all_grid_rows_expanded_js(payload.input);
    case 'setGridTreeRowExpanded':
      return wasm.set_grid_tree_row_expanded_js(payload.input);
    case 'toggleGridTreeRowExpanded':
      return wasm.toggle_grid_tree_row_expanded_js(payload.input);
    case 'expandAllGridTreeRows':
      return wasm.expand_all_grid_tree_rows_js(payload.input);
    case 'getGridTreeRowChildren':
      return wasm.get_grid_tree_row_children_js(payload.input);
    case 'addGridRowInvisibleReason':
      return wasm.add_grid_row_invisible_reason_js(payload.input);
    case 'clearGridRowInvisibleReason':
      return wasm.clear_grid_row_invisible_reason_js(payload.input);
    default:
      throw new Error(`Unknown wasm row-state command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
