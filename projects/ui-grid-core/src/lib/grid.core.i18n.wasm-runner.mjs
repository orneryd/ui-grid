import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'createGridI18nService':
      return wasm.create_grid_i18n_service_js();
    case 'addGridI18nLocale':
      return wasm.add_grid_i18n_locale_js(payload.input);
    case 'getGridI18nLabels':
      return wasm.get_grid_i18n_labels_js(payload.input);
    case 'setGridI18nCurrentLang':
      return wasm.set_grid_i18n_current_lang_js(payload.input);
    case 'getGridI18nCurrentLang':
      return wasm.get_grid_i18n_current_lang_js(payload.input);
    case 'getGridI18nSupportedLanguages':
      return wasm.get_grid_i18n_supported_languages_js(payload.input);
    case 'getGridI18nCurrentLabels':
      return wasm.get_grid_i18n_current_labels_js(payload.input);
    case 'resolveLabelsFromI18n':
      return wasm.resolve_labels_from_i18n_js(payload.input);
    default:
      throw new Error(`Unknown wasm i18n command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));