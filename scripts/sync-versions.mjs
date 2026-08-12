#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const targetVersion = process.argv[2];

if (!targetVersion) {
  console.error('Usage: node scripts/sync-versions.mjs <version>');
  process.exit(1);
}

const packageFiles = [
  'package.json',
  'projects/ui-grid/package.json',
  'projects/ui-grid-core/package.json',
  'projects/ui-grid-react/package.json',
  'projects/ui-grid-vanilla/package.json',
];

const packageLockFiles = [
  'package-lock.json',
  'projects/ui-grid/package-lock.json',
  'projects/ui-grid-core/package-lock.json',
  'projects/ui-grid-react/package-lock.json',
  'projects/ui-grid-vanilla/package-lock.json',
];

const cargoManifestFiles = getCargoManifestFiles();

const internalPackages = [
  '@ornery/ui-grid',
  '@ornery/ui-grid-core',
  '@ornery/ui-grid-react',
  '@ornery/ui-grid-vanilla',
];

const internalCrates = cargoManifestFiles.map((filePath) => filePath.split('/').at(-2));

function updatePackageJson(filePath) {
  const absolutePath = resolve(rootDir, filePath);
  const raw = readFileSync(absolutePath, 'utf8');
  const pkg = JSON.parse(raw);

  if (typeof pkg.version === 'string') {
    pkg.version = targetVersion;
  }

  for (const depField of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    const deps = pkg[depField];
    if (!deps || typeof deps !== 'object') continue;

    for (const name of internalPackages) {
      if (deps[name] && !deps[name].startsWith('file:')) {
        deps[name] = withExistingPrefix(deps[name], targetVersion);
      }
    }
  }

  syncPeerDependenciesMeta(pkg);

  writeFileSync(absolutePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  console.log(`updated ${filePath}`);
}

function withExistingPrefix(current, version) {
  if (current.startsWith('file:')) return current;
  if (current.startsWith('^')) return `^${version}`;
  if (current.startsWith('~')) return `~${version}`;
  return version;
}

function updatePackageLock(filePath) {
  const absolutePath = resolve(rootDir, filePath);
  const raw = readFileSync(absolutePath, 'utf8');
  const lock = JSON.parse(raw);

  if (typeof lock.version === 'string') {
    lock.version = targetVersion;
  }

  if (lock.packages && typeof lock.packages === 'object') {
    for (const [pkgPath, pkg] of Object.entries(lock.packages)) {
      if (!pkg || typeof pkg !== 'object') continue;

      const inferredName = inferPackageName(pkgPath, pkg);
      if (inferredName && internalPackages.includes(inferredName)) {
        pkg.version = targetVersion;
      }

      for (const depField of [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
      ]) {
        const deps = pkg[depField];
        if (!deps || typeof deps !== 'object') continue;

        for (const name of internalPackages) {
          if (deps[name] && !deps[name].startsWith('file:')) {
            deps[name] = withExistingPrefix(deps[name], targetVersion);
          }
        }
      }

      syncPeerDependenciesMeta(pkg);
    }
  }

  if (lock.dependencies && typeof lock.dependencies === 'object') {
    for (const [name, dep] of Object.entries(lock.dependencies)) {
      if (!internalPackages.includes(name) || !dep || typeof dep !== 'object') continue;
      dep.version = targetVersion;
    }
  }

  writeFileSync(absolutePath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  console.log(`updated ${filePath}`);
}

function syncPeerDependenciesMeta(pkg) {
  const peerDependenciesMeta = pkg.peerDependenciesMeta;
  if (!peerDependenciesMeta || typeof peerDependenciesMeta !== 'object') {
    return;
  }

  const peerDependencies =
    pkg.peerDependencies && typeof pkg.peerDependencies === 'object' ? pkg.peerDependencies : {};

  for (const name of internalPackages) {
    if (peerDependenciesMeta[name] && !peerDependencies[name]) {
      delete peerDependenciesMeta[name];
    }
  }

  if (Object.keys(peerDependenciesMeta).length === 0) {
    delete pkg.peerDependenciesMeta;
  }
}

function getCargoManifestFiles() {
  const cargoToml = readFileSync(resolve(rootDir, 'Cargo.toml'), 'utf8');
  const membersMatch = cargoToml.match(/\[workspace\][\s\S]*?members\s*=\s*\[([\s\S]*?)\]/);

  if (!membersMatch) {
    console.error('Failed to locate workspace members in Cargo.toml');
    process.exit(1);
  }

  return [...membersMatch[1].matchAll(/"([^"]+)"/g)].map((match) => `${match[1]}/Cargo.toml`);
}

function updateCargoManifestVersions(filePath) {
  const absolutePath = resolve(rootDir, filePath);
  const raw = readFileSync(absolutePath, 'utf8');
  let updated = raw;

  for (const crateName of internalCrates) {
    const pattern = new RegExp(
      `(${escapeRegExp(crateName)}\\s*=\\s*\\{[^\n}]*\\bversion\\s*=\\s*")(.*?)(")`,
      'g',
    );
    updated = updated.replace(pattern, (_, prefix, current, suffix) => {
      return `${prefix}${withExistingCargoPrefix(current, targetVersion)}${suffix}`;
    });
  }

  if (updated !== raw) {
    writeFileSync(absolutePath, updated, 'utf8');
    console.log(`updated ${filePath}`);
  }
}

function updateCargoLock() {
  const absolutePath = resolve(rootDir, 'Cargo.lock');
  const raw = readFileSync(absolutePath, 'utf8');
  let updated = raw;

  for (const crateName of internalCrates) {
    const pattern = new RegExp(
      `(\\[\\[package\\]\\]\\nname = "${escapeRegExp(crateName)}"\\nversion = ")(.*?)(")`,
      'g',
    );
    updated = updated.replace(pattern, (_, prefix, __current, suffix) => {
      return `${prefix}${targetVersion}${suffix}`;
    });
  }

  if (updated !== raw) {
    writeFileSync(absolutePath, updated, 'utf8');
    console.log('updated Cargo.lock');
  }
}

function withExistingCargoPrefix(current, version) {
  const prefixMatch = current.match(/^[^0-9]*/);
  const prefix = prefixMatch?.[0] ?? '';
  return `${prefix}${version}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inferPackageName(pkgPath, pkg) {
  if (typeof pkg.name === 'string') {
    return pkg.name;
  }

  const marker = 'node_modules/';
  const markerIndex = pkgPath.lastIndexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  return pkgPath.slice(markerIndex + marker.length);
}

function updateCargoWorkspaceVersion() {
  const cargoPath = resolve(rootDir, 'Cargo.toml');
  const cargoToml = readFileSync(cargoPath, 'utf8');
  const match = cargoToml.match(/(\[workspace\.package\][\s\S]*?\nversion\s*=\s*")([^"]+)("\n)/);

  if (!match) {
    console.error('Failed to locate workspace package version in Cargo.toml');
    process.exit(1);
  }

  const currentVersion = match[2];
  if (currentVersion === targetVersion) {
    console.log('Cargo.toml already up to date');
    return;
  }

  const updated = cargoToml.replace(
    /(\[workspace\.package\][\s\S]*?\nversion\s*=\s*")[^"]+("\n)/,
    `$1${targetVersion}$2`,
  );

  writeFileSync(cargoPath, updated, 'utf8');
  console.log('updated Cargo.toml');
}

for (const file of packageFiles) {
  updatePackageJson(file);
}

for (const file of packageLockFiles) {
  updatePackageLock(file);
}

updateCargoWorkspaceVersion();

for (const file of cargoManifestFiles) {
  updateCargoManifestVersions(file);
}

updateCargoLock();

console.log(`\nVersion sync complete: ${targetVersion}`);
