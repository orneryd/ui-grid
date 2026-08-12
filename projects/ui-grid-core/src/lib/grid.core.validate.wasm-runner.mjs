import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'createGridValidatorRegistry':
      return wasm.create_grid_validator_registry_js(payload.input);
    case 'gridValidatorHas':
      return wasm.grid_validator_has_js(payload.input);
    case 'gridValidatorMessage':
      return wasm.grid_validator_message_js(payload.input);
    case 'invalidFieldFor':
      return wasm.invalid_field_for_js(payload.input);
    case 'errorsFieldFor':
      return wasm.errors_field_for_js(payload.input);
    case 'isGridCellInvalid':
      return wasm.is_grid_cell_invalid_js(payload.input);
    case 'setGridCellInvalid':
      return wasm.set_grid_cell_invalid_js(payload.input);
    case 'setGridCellValid':
      return wasm.set_grid_cell_valid_js(payload.input);
    case 'setGridCellError':
      return wasm.set_grid_cell_error_js(payload.input);
    case 'clearGridCellError':
      return wasm.clear_grid_cell_error_js(payload.input);
    case 'getGridCellErrorNames':
      return wasm.get_grid_cell_error_names_js(payload.input);
    case 'getGridCellErrorMessages':
      return wasm.get_grid_cell_error_messages_js(payload.input);
    case 'runGridCellValidators':
      return wasm.run_grid_cell_validators_js(payload.input);
    case 'validateAllGridRows':
      return wasm.validate_all_grid_rows_js(payload.input);
    default:
      throw new Error(`Unknown wasm validate command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
