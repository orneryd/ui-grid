#!/usr/bin/env node
/**
 * Compiles grid.core.styles.scss → grid-core-styles.ts as a plain TS string export.
 * Run automatically via `prebuild`. Re-run manually whenever the SCSS changes
 * so Angular's dev server (which reads source files directly) stays in sync.
 */
import { compileString } from 'sass';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scssPath = resolve(__dirname, 'src/lib/grid.core.styles.scss');
const outPath  = resolve(__dirname, 'src/lib/grid-core-styles.ts');

const source = readFileSync(scssPath, 'utf8');

const result = compileString(source, {
  url: new URL(`file://${scssPath}`),
  loadPaths: [resolve(__dirname, 'src/lib')],
  importers: [{
    findFileUrl(url) {
      return new URL(`file://${resolve(dirname(scssPath), url)}`);
    }
  }],
});

const css = result.css;

const output = `// AUTO-GENERATED — do not edit by hand.
// Source of truth: src/lib/grid.core.styles.scss
// Regenerate: npm run generate-css  (runs automatically on prebuild)
export const GRID_CORE_CSS: string = ${JSON.stringify(css)};
`;

writeFileSync(outPath, output, 'utf8');
console.log(`[generate-core-css] Written ${outPath} (${css.length} bytes)`);
