import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'createGridRowEditState':
      return wasm.create_grid_row_edit_state_js();
    case 'markGridRowDirty':
      return wasm.mark_grid_row_dirty_js(payload.input);
    case 'markGridRowClean':
      return wasm.mark_grid_row_clean_js(payload.input);
    case 'markGridRowSaving':
      return wasm.mark_grid_row_saving_js(payload.input);
    case 'markGridRowError':
      return wasm.mark_grid_row_error_js(payload.input);
    case 'isGridRowEditTimerEnabled':
      return wasm.is_grid_row_edit_timer_enabled_js(payload.input);
    case 'resolveGridRowEditWaitInterval':
      return wasm.resolve_grid_row_edit_wait_interval_js(payload.input);
    case 'collectGridRowEntities':
      return wasm.collect_grid_row_entities_js(payload.input);
    default:
      throw new Error(`Unknown wasm row-edit command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));