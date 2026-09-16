import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const projectsRoot = resolve(packageRoot, '..');
const consumerRoot = join(tmpdir(), 'ui-grid-solid-package-consumer');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check through npm run test:package.');

function run(args, cwd = consumerRoot) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: join(consumerRoot, '.npm-cache') },
  });
  if (result.status !== 0) {
    throw new Error([result.stdout, result.stderr].filter(Boolean).join('\n'));
  }
  return result.stdout;
}

await rm(consumerRoot, { force: true, recursive: true });
await mkdir(join(consumerRoot, 'src'), { recursive: true });

try {
  const packed = JSON.parse(run([
    npmCli, 'pack', '--json', '--pack-destination', consumerRoot,
  ], packageRoot));
  const tarball = join(consumerRoot, packed[0].filename);
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.peerDependencies['solid-js'], '>=2.0.0-rc.4 <3');
  assert.equal(manifest.peerDependencies['@solidjs/web'], '>=2.0.0-rc.4 <3');

  await writeFile(join(consumerRoot, 'package.json'), JSON.stringify({
    name: 'ui-grid-solid-package-consumer',
    private: true,
    type: 'module',
    dependencies: { '@ornery/ui-grid-solid': `file:${tarball.replaceAll('\\', '/')}` },
  }, null, 2));
  await writeFile(join(consumerRoot, 'index.html'), '<div id="app"></div><script type="module" src="/src/main.tsx"></script>');
  await writeFile(join(consumerRoot, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', jsx: 'preserve',
      jsxImportSource: '@solidjs/web', strict: true, skipLibCheck: true, noEmit: true,
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    },
    include: ['src'],
  }, null, 2));
  await writeFile(join(consumerRoot, 'vite.config.ts'), [
    "import { defineConfig } from 'vite';",
    "import solid from 'vite-plugin-solid';",
    'export default defineConfig({ plugins: [solid()] });',
  ].join('\n'));
  await writeFile(join(consumerRoot, 'src', 'main.tsx'), `
import { render } from '@solidjs/web';
import { UiGrid, type GridOptions, type UiGridCellRenderers } from '@ornery/ui-grid-solid';
const options: GridOptions = { id: 'consumer', data: [{ id: 1, name: 'Alice' }], columnDefs: [{ name: 'name' }] };
const renderers: UiGridCellRenderers = { name: (context) => <strong>{String(context.value)}</strong> };
render(() => <UiGrid options={options} cellRenderers={renderers} />, document.getElementById('app')!);
`);

  run([npmCli, 'install', '--legacy-peer-deps', '--ignore-scripts', '--no-audit', '--no-fund']);
  const links = [
    ['@ornery/ui-grid-core', join(projectsRoot, 'ui-grid-core')],
    ['@ornery/ui-grid-vanilla', join(projectsRoot, 'ui-grid-vanilla')],
    ['solid-js', join(packageRoot, 'node_modules', 'solid-js')],
    ['@solidjs/web', join(packageRoot, 'node_modules', '@solidjs', 'web')],
    ['vite', join(packageRoot, 'node_modules', 'vite')],
    ['vite-plugin-solid', join(packageRoot, 'node_modules', 'vite-plugin-solid')],
    ['typescript', join(packageRoot, 'node_modules', 'typescript')],
  ];
  for (const [name, source] of links) {
    const target = join(consumerRoot, 'node_modules', ...name.split('/'));
    await mkdir(resolve(target, '..'), { recursive: true });
    await symlink(source, target, 'junction');
  }
  run([join(consumerRoot, 'node_modules', 'typescript', 'bin', 'tsc')]);
  run([join(consumerRoot, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']);
  const installedManifest = JSON.parse(await readFile(
    join(consumerRoot, 'node_modules', '@ornery', 'ui-grid-solid', 'package.json'), 'utf8',
  ));
  assert.equal(installedManifest.version, manifest.version);
  const semverCli = join(packageRoot, 'node_modules', 'semver', 'bin', 'semver.js');
  assert.equal(run([semverCli, '2.0.0-rc.4', '-r', manifest.peerDependencies['solid-js']]).trim(), '2.0.0-rc.4');
  assert.equal(run([semverCli, '2.0.0', '-r', manifest.peerDependencies['solid-js']]).trim(), '2.0.0');
  process.stdout.write('Tarball install, TypeScript check, JSX build, and SolidJS peer resolution passed.\n');
} finally {
  await rm(consumerRoot, { force: true, recursive: true });
}
