import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'buildGridSavedState':
      return wasm.build_grid_saved_state_js(payload.input);
    case 'normalizeGridSavedState':
      return wasm.normalize_grid_saved_state_js(payload.input);
    case 'sanitizeDownloadFilename':
      return wasm.sanitize_download_filename_js(payload.input);
    case 'normalizeBooleanMap':
      return wasm.normalize_boolean_map_js(payload.input);
    case 'isSafeStateKey':
      return wasm.is_safe_state_key_js(payload.input);
    default:
      throw new Error(`Unknown wasm state command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
