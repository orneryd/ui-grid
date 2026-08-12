import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'resolveGridImporterOptions':
      return wasm.resolve_grid_importer_options_js(payload.input);
    case 'flattenGridColumnDefsForImport':
      return wasm.flatten_grid_column_defs_for_import_js(payload.input);
    case 'defaultGridImporterProcessHeaders':
      return wasm.default_grid_importer_process_headers_js(payload.input);
    case 'parseGridImporterJson':
      return wasm.parse_grid_importer_json_js(payload.input);
    case 'parseGridImporterCsv':
      return wasm.parse_grid_importer_csv_js(payload.input);
    case 'buildGridImporterObjectsFromCsv':
      return wasm.build_grid_importer_objects_from_csv_js(payload.input);
    case 'buildGridImporterObjectsFromJson':
      return wasm.build_grid_importer_objects_from_json_js(payload.input);
    default:
      throw new Error(`Unknown wasm importer command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
