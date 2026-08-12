import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'isPinningEnabled':
      return wasm.is_pinning_enabled_js(payload.input);
    case 'isColumnPinnable':
      return wasm.is_column_pinnable_js(payload.input);
    case 'getColumnPinDirection':
      return wasm.get_column_pin_direction_js(payload.input);
    case 'pinColumnState':
      return wasm.pin_column_state_js(payload.input);
    case 'buildInitialPinnedState':
      return wasm.build_initial_pinned_state_js(payload.input);
    case 'computePinnedOffset':
      return wasm.compute_pinned_offset_js(payload.input);
    case 'pinningButtonLabel':
      return wasm.pinning_button_label_js(payload.input);
    default:
      throw new Error(`Unknown wasm pinning command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
