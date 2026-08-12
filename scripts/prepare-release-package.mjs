#!/usr/bin/env node

import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key) {
    args.set(key, value ?? '');
  }
}

const rootDir = process.cwd();
const outputDir = path.resolve(rootDir, args.get('--output') || 'dist/npm-package');
const elementDir = path.resolve(rootDir, args.get('--element') || 'dist/ui-grid-element');
const wasmDir = path.resolve(rootDir, args.get('--wasm') || 'dist/ui-grid-wasm');
const rootPackage = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const sourcePackage = JSON.parse(await readFile(path.join(rootDir, 'projects/ui-grid/package.json'), 'utf8'));
const requestedVersion = args.get('--version') || rootPackage.version || sourcePackage.version || '0.1.0';
const distDir = path.join(rootDir, 'dist');

const requestedPresets = (args.get('--presets') || 'full')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const presetBuilds = [];
for (const preset of requestedPresets) {
  const presetDir = path.join(distDir, `ui-grid-${preset}`);
  const manifestPath = path.join(presetDir, 'build-flavor.json');
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    presetBuilds.push({ preset, dir: presetDir, manifest });
  } catch (error) {
    throw new Error(`Missing built preset output for "${preset}" at ${manifestPath}. Build the preset before packaging.`);
  }
}

const defaultPresetBuild = presetBuilds.find((build) => build.preset === 'full') ?? presetBuilds[0];
if (!defaultPresetBuild) {
  throw new Error('No preset builds were found to package.');
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await cp(defaultPresetBuild.dir, outputDir, { recursive: true });
await cp(elementDir, path.join(outputDir, 'element'), { recursive: true });
await cp(wasmDir, path.join(outputDir, 'wasm'), { recursive: true });
await cp(path.join(rootDir, 'README.md'), path.join(outputDir, 'README.md'));

const presetExports = {};
const packagedPresetManifest = [];

for (const presetBuild of presetBuilds) {
  const presetPackagePath = path.join(presetBuild.dir, 'package.json');
  const presetPackageJson = JSON.parse(await readFile(presetPackagePath, 'utf8'));
  const presetTypes = presetPackageJson.types || presetPackageJson.typings || './index.d.ts';
  const presetDefault = presetPackageJson.module || presetPackageJson.main || './fesm2022/ui-grid.mjs';

  packagedPresetManifest.push({
    preset: presetBuild.preset,
    features: presetBuild.manifest.features
  });

  if (presetBuild.preset !== defaultPresetBuild.preset) {
    const targetDir = path.join(outputDir, 'presets', presetBuild.preset);
    await mkdir(path.dirname(targetDir), { recursive: true });
    await cp(presetBuild.dir, targetDir, { recursive: true });
  }

  if (presetBuild.preset === defaultPresetBuild.preset) {
    presetExports[`./presets/${presetBuild.preset}`] = {
      types: entryTypesFromPackage(presetPackageJson),
      default: entryDefaultFromPackage(presetPackageJson)
    };
    continue;
  }

  presetExports[`./presets/${presetBuild.preset}`] = {
    types: normalizeSubpath(presetTypes, presetBuild.preset),
    default: normalizeSubpath(presetDefault, presetBuild.preset)
  };
}

const minimalPreset = presetBuilds.find((build) => build.preset === 'minimal');
if (minimalPreset) {
  const minimalPackageJson = JSON.parse(await readFile(path.join(minimalPreset.dir, 'package.json'), 'utf8'));
  presetExports['./core'] = {
    types: normalizeSubpath(entryTypesFromPackage(minimalPackageJson), minimalPreset.preset),
    default: normalizeSubpath(entryDefaultFromPackage(minimalPackageJson), minimalPreset.preset)
  };
}

const packageJsonPath = path.join(outputDir, 'package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const entryTypes = entryTypesFromPackage(packageJson);
const entryDefault = entryDefaultFromPackage(packageJson);

const finalPackageJson = {
  ...packageJson,
  name: sourcePackage.name,
  version: requestedVersion,
  private: false,
  sideEffects: false,
  module: entryDefault,
  typings: entryTypes,
  publishConfig: {
    ...(sourcePackage.publishConfig || {}),
    access: 'public'
  },
  exports: {
    '.': {
      types: entryTypes,
      default: entryDefault
    },
    './wasm': {
      types: './wasm/ui_grid_wasm.d.ts',
      default: './wasm/ui_grid_wasm.js'
    },
    ...presetExports,
    './element': './element/main.js',
    './package.json': './package.json'
  }
};

await writeFile(packageJsonPath, `${JSON.stringify(finalPackageJson, null, 2)}\n`);
await writeFile(path.join(outputDir, 'build-flavors.json'), `${JSON.stringify(packagedPresetManifest, null, 2)}\n`);

function ensureDotSlash(p) {
  return p.startsWith('./') ? p : `./${p}`;
}

function entryTypesFromPackage(packageJson) {
  return ensureDotSlash(packageJson.types || packageJson.typings || './index.d.ts');
}

function entryDefaultFromPackage(packageJson) {
  return ensureDotSlash(packageJson.module || packageJson.main || './fesm2022/ui-grid.mjs');
}

function normalizeSubpath(entryPath, preset) {
  return path.posix.join('./presets', preset, entryPath.replace(/^\.\//, ''));
}