import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run this script through npm run build:solid.');

for (const [directory, args] of [
  ['projects/ui-grid-core/', ['run', 'build']],
  ['projects/ui-grid-vanilla/', ['exec', '--', 'tsup']],
  ['projects/ui-grid-vanilla/', ['exec', '--', 'tsc', '-p', 'tsconfig.dts.json']],
  ['projects/ui-grid-solid/', ['run', 'build']],
]) {
  const result = spawnSync(process.execPath, [npm, ...args], {
    cwd: fileURLToPath(new URL(directory, root)),
    env: { ...process.env, SASS_PATH: 'node_modules' },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
