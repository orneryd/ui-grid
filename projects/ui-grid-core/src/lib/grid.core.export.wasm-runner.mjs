import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'filterExporterColumns':
      return wasm.filter_exporter_columns_js(payload.input);
    case 'buildGridCsv':
      return wasm.build_grid_csv_js(payload.input);
    case 'resolveGridExporterOptions':
      return wasm.resolve_grid_exporter_options_js(payload.input);
    case 'resolveGridExporterPdfOptions':
      return wasm.resolve_grid_exporter_pdf_options_js(payload.input);
    case 'resolveGridExporterExcelOptions':
      return wasm.resolve_grid_exporter_excel_options_js(payload.input);
    case 'calculateGridPdfColumnWidths':
      return wasm.calculate_grid_pdf_column_widths_js(payload.input);
    case 'formatGridPdfField':
      return wasm.format_grid_pdf_field_js(payload.input);
    case 'buildGridPdfDocDefinition':
      return wasm.build_grid_pdf_doc_definition_js(payload.input);
    case 'formatGridExcelField':
      return wasm.format_grid_excel_field_js(payload.input);
    case 'buildGridExcelSheetData':
      return wasm.build_grid_excel_sheet_data_js(payload.input);
    default:
      throw new Error(`Unknown wasm export command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
