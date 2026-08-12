import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'maybeRequestInfiniteScrollData':
      return wasm.maybe_request_infinite_scroll_data_js(payload.input);
    case 'completeInfiniteScrollDataLoad':
      return wasm.complete_infinite_scroll_data_load_js(payload.input);
    case 'resetInfiniteScrollState':
      return wasm.reset_infinite_scroll_state_js(payload.input);
    case 'saveInfiniteScrollPercentage':
      return wasm.save_infinite_scroll_percentage_js(payload.input);
    case 'setInfiniteScrollDirectionsState':
      return wasm.set_infinite_scroll_directions_state_js(payload.input);
    default:
      throw new Error(`Unknown wasm infinite-scroll command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
