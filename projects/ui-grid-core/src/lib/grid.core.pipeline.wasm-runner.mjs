import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'buildGridPipeline':
      return wasm.build_grid_pipeline_js(payload.input);
    case 'getCachedGridPipelineRows':
      return wasm.get_cached_grid_pipeline_rows_js(payload.input);
    case 'clearGridPipelineRowsCache':
      wasm.clear_grid_pipeline_rows_cache_js();
      return null;
    default:
      throw new Error(`Unknown wasm pipeline command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
