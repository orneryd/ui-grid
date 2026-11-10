import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const dirs = ['projects/ui-grid-core', 'projects/ui-grid-vanilla', 'projects/ui-grid-react', 'projects/ui-grid-solid', 'dist/ui-grid', 'dist/npm-package'];
for (const dir of dirs) {
  const pkg = JSON.parse(readFileSync(`${dir}/package.json`, 'utf8'));
  assert.equal(pkg.version, version, `${dir} version`);
  for (const field of ['dependencies', 'peerDependencies']) {
    for (const [name, range] of Object.entries(pkg[field] ?? {})) {
      if (name.startsWith('@ornery/ui-grid') && name !== '@ornery/ui-grid-wasm') {
        assert.equal(range, `^${version}`, `${dir} ${name}`);
      }
      assert.ok(!range.startsWith('file:'), `${dir} unpublished ${name}`);
    }
  }
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: resolve(dir), encoding: 'utf8' }));
  const files = new Set(pack.files.map(file => file.path));
  function checkTarget(value) {
    if (typeof value === 'string') {
      assert.ok(value.startsWith('./'), `${dir}: export must start with ./ (${value})`);
      if (!value.includes('*')) assert.ok(files.has(value.slice(2)), `${dir}: missing export ${value}`);
    } else if (value && typeof value === 'object') {
      for (const target of Object.values(value)) checkTarget(target);
    }
  }
  checkTarget(pkg.exports);
  for (const field of ['main', 'module', 'types', 'typings']) {
    if (pkg[field]) assert.ok(files.has(pkg[field].replace(/^\.\//, '')), `${dir}: missing ${field}`);
  }
  console.log(`${pkg.name}@${version}: ${files.size} packed files; exports and dependency ranges verified`);
}
const core = JSON.parse(readFileSync('projects/ui-grid-core/package.json', 'utf8'));
assert.equal(core.peerDependenciesMeta['@ornery/ui-grid-wasm'].optional, true);
assert.ok(!core.dependencies?.['@ornery/ui-grid-wasm']);
assert.ok(!readFileSync('projects/ui-grid-core/dist/index.mjs', 'utf8').includes('@ornery/ui-grid-wasm'));
console.log('Core main bundle is WASM-free; WASM peer is optional.');
