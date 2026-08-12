import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { GridI18nService, resolveLabelsFromI18n } from './grid.core.i18n';
import { DEFAULT_GRID_LABELS } from './grid.models';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.i18n.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input?: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

describe('grid.core.i18n wasm parity', () => {
  it('matches default language and bundled locale support', () => {
    const service = new GridI18nService();
    const wasmService = runWasm<any>('createGridI18nService');

    expect(runWasm('getGridI18nCurrentLang', wasmService)).toBe(service.getCurrentLang());
    expect(runWasm('getGridI18nCurrentLabels', wasmService)).toEqual(service.getCurrentLabels());
    expect(runWasm<string[]>('getGridI18nSupportedLanguages', wasmService)).toEqual(
      service.getSupportedLanguages(),
    );
  });

  it('matches partial locale registration and case-insensitive lookup', () => {
    const service = new GridI18nService();
    service.add('PT-BR', { sortDefault: 'Ordenar' });

    const result = runWasm<any>('addGridI18nLocale', {
      service: runWasm('createGridI18nService'),
      lang: 'PT-BR',
      labels: { sortDefault: 'Ordenar' },
    });

    expect(runWasm('getGridI18nLabels', { service: result.service, lang: 'pt-br' })).toEqual(
      service.get('pt-br'),
    );
    expect(runWasm('getGridI18nLabels', { service: result.service, lang: 'PT-BR' })).toEqual(
      service.get('PT-BR'),
    );
    expect(service.get('pt-br').groupColumn).toBe(DEFAULT_GRID_LABELS.groupColumn);
  });

  it('matches current-language updates and label resolution with overrides', () => {
    const service = new GridI18nService();
    service.setCurrentLang('es');

    const setLang = runWasm<any>('setGridI18nCurrentLang', {
      service: runWasm('createGridI18nService'),
      lang: 'es',
    });

    expect(runWasm('getGridI18nCurrentLang', setLang.service)).toBe(service.getCurrentLang());
    expect(runWasm('getGridI18nCurrentLabels', setLang.service)).toEqual(service.getCurrentLabels());
    expect(
      runWasm('resolveLabelsFromI18n', {
        service: setLang.service,
        overrides: { sortDefault: 'Custom' },
      }),
    ).toEqual(resolveLabelsFromI18n({ labels: { sortDefault: 'Custom' } }, service));
  });
});