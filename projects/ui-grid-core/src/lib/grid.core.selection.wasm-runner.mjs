import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'createGridSelectionState':
      return wasm.create_grid_selection_state_js();
    case 'resolveGridSelectionOptions':
      return wasm.resolve_grid_selection_options_js(payload.input);
    case 'toggleGridRowSelection':
      return wasm.toggle_grid_row_selection_js(payload.input);
    case 'shiftGridRowSelection':
      return wasm.shift_grid_row_selection_js(payload.input);
    case 'selectAllGridRows':
      return wasm.select_all_grid_rows_js(payload.input);
    case 'selectAllVisibleGridRows':
      return wasm.select_all_visible_grid_rows_js(payload.input);
    case 'clearAllGridSelection':
      return wasm.clear_all_grid_selection_js(payload.input);
    case 'findGridRowByKey':
      return wasm.find_grid_row_by_key_js(payload.input);
    case 'reconcileGridSelection':
      return wasm.reconcile_grid_selection_js(payload.input);
    case 'mapSelectedRowsToEntities':
      return wasm.map_selected_rows_to_entities_js(payload.input);
    default:
      throw new Error(`Unknown wasm selection command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));