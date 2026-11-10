import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const paths = ['', ...['ui-grid', 'ui-grid-core', 'ui-grid-react', 'ui-grid-solid', 'ui-grid-vanilla'].map(name => `projects/${name}/`)];

test('syncs release manifests and local lock targets without changing registry versions', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'ui-grid-version-test-'));
  try {
    mkdirSync(join(fixture, 'scripts'));
    cpSync(new URL('scripts/sync-versions.mjs', root), join(fixture, 'scripts/sync-versions.mjs'));
    for (const path of paths) {
      for (const name of ['package.json', 'package-lock.json']) {
        const dest = join(fixture, path, name);
        mkdirSync(dirname(dest), { recursive: true });
        cpSync(new URL(path + name, root), dest);
      }
    }
    const lockPath = join(fixture, 'package-lock.json');
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    lock.packages['node_modules/unrelated-fixture'] = { version: '1.2.3' };
    writeFileSync(lockPath, JSON.stringify(lock));
    execFileSync(process.execPath, [join(fixture, 'scripts/sync-versions.mjs'), '5.0.4']);
    for (const path of paths) {
      const manifest = JSON.parse(readFileSync(join(fixture, path, 'package.json'), 'utf8'));
      const updated = JSON.parse(readFileSync(join(fixture, path, 'package-lock.json'), 'utf8'));
      assert.equal(manifest.version, '5.0.4');
      assert.equal(updated.version, '5.0.4');
      assert.equal(updated.packages[''].version, '5.0.4');
      for (const [key, value] of Object.entries(updated.packages)) {
        if (key && !key.includes('node_modules') && value.name?.startsWith('@ornery/ui-grid')) {
          assert.equal(value.version, '5.0.4', `${path}${key}`);
        }
      }
    }
    const updated = JSON.parse(readFileSync(lockPath, 'utf8'));
    assert.equal(updated.packages['node_modules/unrelated-fixture'].version, '1.2.3');
    assert.equal(updated.packages['projects/ui-grid-core'].version, '5.0.4');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
