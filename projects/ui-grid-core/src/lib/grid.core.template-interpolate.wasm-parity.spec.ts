/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { interpolateGridTemplate, resolveGridTemplateValue } from './grid.core.template-interpolate';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.template-interpolate.wasm-runner.mjs', import.meta.url));

function escapeHtml(value: unknown): string {
  const text = String(value ?? '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

describe('grid.core.template-interpolate wasm parity', () => {
  it('matches dotted-path resolution and missing-path behavior', () => {
    const context = { row: { account: { owner: 'Ada' } } };

    expect(runWasm('resolveGridTemplateValue', { context, expression: 'row.account.owner' })).toEqual(
      resolveGridTemplateValue(context, 'row.account.owner'),
    );
    expect(runWasm('resolveGridTemplateValue', { context, expression: 'row.account.missing' })).toEqual(
      resolveGridTemplateValue(context, 'row.account.missing'),
    );
  });

  it('matches escaped interpolation for moustache and dollar bindings', () => {
    const context = {
      row: { name: 'Ada <Admin>', role: 'Owner' },
      value: '5 > 4',
    };
    const templateMarkup = '<span>{{ row.name }}</span><em>${props.row.role}</em><strong>${this.value}</strong>';

    expect(runWasm('interpolateGridTemplate', { templateMarkup, context })).toBe(
      interpolateGridTemplate(templateMarkup, context, escapeHtml),
    );
  });
});
