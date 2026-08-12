import * as sass from 'sass';
import path from 'path';
import type { Plugin } from 'vite';
import type { Plugin as EsbuildPlugin } from 'esbuild';
import fs from 'fs';

const SCSS_SUFFIX = '?inline-css';

export function scssInlinePlugin(): Plugin {
  return {
    name: 'scss-inline',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source.endsWith('.scss') && importer && !source.includes('node_modules')) {
        const resolved = path.resolve(path.dirname(importer), source);
        return resolved + SCSS_SUFFIX;
      }
      return null;
    },
    load(id) {
      if (!id.endsWith(SCSS_SUFFIX)) return null;
      const filePath = id.slice(0, -SCSS_SUFFIX.length);
      const result = sass.compile(filePath, {
        style: 'compressed',
        loadPaths: [
          path.resolve(process.cwd(), 'node_modules'),
          path.resolve(process.cwd(), '../../node_modules'),
        ],
      });
      return `export default ${JSON.stringify(result.css)};`;
    },
  };
}

export function scssInlineEsbuild(): EsbuildPlugin {
  return {
    name: 'scss-inline',
    setup(build) {
      build.onResolve({ filter: /\.scss$/ }, (args) => {
        if (args.resolveDir && !args.path.includes('node_modules')) {
          return {
            path: path.resolve(args.resolveDir, args.path),
            namespace: 'scss-inline',
          };
        }
        return null;
      });

      build.onLoad({ filter: /.*/, namespace: 'scss-inline' }, (args) => {
        const result = sass.compile(args.path, {
          style: 'compressed',
          loadPaths: [
            path.resolve(process.cwd(), 'node_modules'),
            path.resolve(process.cwd(), '..'),
            path.resolve(process.cwd(), '../../node_modules'),
          ],
        });
        return {
          contents: `export default ${JSON.stringify(result.css)};`,
          loader: 'js',
        };
      });
    },
  };
}
