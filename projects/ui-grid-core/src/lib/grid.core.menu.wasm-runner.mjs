import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'buildGridExporterMenuItems':
      return wasm.build_grid_exporter_menu_items_js(payload.input);
    case 'buildGridImporterMenuItems':
      return wasm.build_grid_importer_menu_items_js(payload.input);
    case 'buildGridRowEditMenuItems':
      return wasm.build_grid_row_edit_menu_items_js(payload.input);
    default:
      throw new Error(`Unknown wasm menu command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));