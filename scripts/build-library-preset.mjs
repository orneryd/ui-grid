#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PRESETS = {
  full: {
    supported: true,
    description: 'Current complete Angular package surface.',
    entryFile: 'src/public-api.full.ts',
    features: [
      'sorting',
      'filtering',
      'grouping',
      'pagination',
      'editing',
      'tree',
      'expandable',
      'infinite-scroll',
      'save-state',
      'export',
      'viewport',
      'benchmark',
      'angular-adapter'
    ]
  },
  minimal: {
    supported: true,
    description: 'Headless/core-oriented surface that omits the Angular adapter component export.',
    entryFile: 'src/public-api.minimal.ts',
    features: ['grid-api', 'sorting', 'filtering', 'pagination', 'state-core', 'headless-core']
  },
  'data-heavy': {
    supported: false,
    description: 'Planned data-intensive preset once virtualization and export can be packaged independently.',
    entryFile: 'src/public-api.minimal.ts',
    features: ['sorting', 'filtering', 'viewport', 'export']
  },
  interactive: {
    supported: false,
    description: 'Planned interactive preset once editing, tree, and expandable modules have dedicated entry points.',
    entryFile: 'src/public-api.full.ts',
    features: ['sorting', 'filtering', 'grouping', 'editing', 'tree', 'expandable']
  }
};

function parseArgs(argv) {
  const args = new Map();

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    if (token.startsWith('--') && token.includes('=')) {
      const [key, ...rest] = token.split('=');
      args.set(key, rest.join('='));
      continue;
    }

    if (token.startsWith('--')) {
      const nextToken = argv[index + 1];
      if (!nextToken || nextToken.startsWith('--')) {
        args.set(token, 'true');
        continue;
      }

      args.set(token, nextToken);
      index += 1;
    }
  }

  return args;
}

function listPresets() {
  for (const [name, preset] of Object.entries(PRESETS)) {
    const status = preset.supported ? 'supported' : 'planned';
    console.log(`${name}: ${status}`);
    console.log(`  ${preset.description}`);
    console.log(`  features: ${preset.features.join(', ')}`);
  }
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 1}`));
    });

    child.on('error', reject);
  });
}

const args = parseArgs(process.argv);

if (args.get('--list-presets') === 'true') {
  listPresets();
  process.exit(0);
}

const rootDir = process.cwd();
const presetName = args.get('--preset') || 'full';
const preset = PRESETS[presetName];

if (!preset) {
  console.error(`Unknown preset "${presetName}".`);
  console.error(`Available presets: ${Object.keys(PRESETS).join(', ')}`);
  process.exit(1);
}

if (!preset.supported) {
  console.error(`Preset "${presetName}" is defined but not buildable yet.`);
  console.error(preset.description);
  console.error('Current supported preset: full');
  process.exit(1);
}

const projectRoot = path.join(rootDir, 'projects', 'ui-grid');
const outputDir = path.resolve(rootDir, args.get('--output') || path.join('dist', `ui-grid-${presetName}`));
const generatedNgPackage = path.join(projectRoot, `ng-package.${presetName}.generated.json`);
const sourcePackage = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));

const relativeOutputDir = path.relative(projectRoot, outputDir).replace(/\\/g, '/');

const generatedNgPackageSource = `${JSON.stringify({
  $schema: '../../node_modules/ng-packagr/ng-package.schema.json',
  dest: relativeOutputDir,
  lib: {
    entryFile: preset.entryFile
  },
  allowedNonPeerDependencies: ['tslib']
}, null, 2)}\n`;

await rm(outputDir, { recursive: true, force: true });
await writeFile(generatedNgPackage, generatedNgPackageSource);

try {
  await run('npx', ['ng-packagr', '-p', generatedNgPackage], rootDir);
  await writeFile(
    path.join(outputDir, 'build-flavor.json'),
    `${JSON.stringify({
      packageName: sourcePackage.name,
      preset: presetName,
      features: preset.features
    }, null, 2)}\n`
  );
} finally {
  await rm(generatedNgPackage, { force: true });
}