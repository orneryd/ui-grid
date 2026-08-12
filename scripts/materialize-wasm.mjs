#!/usr/bin/env node

import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targets = {
  bundler: 'dist/ui-grid-wasm',
  web: 'dist/ui-grid-wasm-web',
};

for (const [target, outputPath] of Object.entries(targets)) {
  const packageEntry = fileURLToPath(import.meta.resolve(`@ornery/ui-grid-wasm/${target}`));
  const sourceDir = dirname(packageEntry);
  const outputDir = resolve(rootDir, outputPath);
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await cp(sourceDir, outputDir, { recursive: true });
}