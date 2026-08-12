import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'isGridCellPosition':
      return wasm.is_grid_cell_position_js(payload.input);
    case 'beginGridEditSession':
      return wasm.begin_grid_edit_session_js(payload.input);
    case 'shouldGridEditOnFocus':
      return wasm.should_grid_edit_on_focus_js(payload.input);
    case 'buildGridFocusCellResult':
      return wasm.build_grid_focus_cell_result_js(payload.input);
    case 'clearGridEditSession':
      return wasm.clear_grid_edit_session_js();
    case 'findNextGridCell':
      return wasm.find_next_grid_cell_js(payload.input);
    case 'stringifyGridEditorValue':
      return wasm.stringify_grid_editor_value_js(payload.input);
    case 'parseGridEditedValue':
      return wasm.parse_grid_edited_value_js(payload.input);
    case 'isPrintableGridKey':
      return wasm.is_printable_grid_key_js(payload.input);
    default:
      throw new Error(`Unknown wasm edit command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
