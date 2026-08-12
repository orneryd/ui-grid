import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'resolveGridTemplateValue':
      return wasm.resolve_grid_template_value_js(payload.input);
    case 'interpolateGridTemplate':
      return wasm.interpolate_grid_template_js(payload.input);
    default:
      throw new Error(`Unknown wasm template command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));
