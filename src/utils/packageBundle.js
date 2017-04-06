/* @flow */

import path from 'path';
import { stat, readFile } from 'sander';
import webpack from 'webpack';
import MemoryFS from 'memory-fs';
import makeLegalIdentifier from './makeLegalIdentifier';
import makeConfig from '../bundler/makeConfig';
import logger from '../logger';

export default (async function packageBundle(
  cwd: string,
  deep: ?string,
  query: ?{ platform?: string },
) {
  const content = await readFile(path.join(cwd, 'package.json'));
  const pkg = JSON.parse(content);
  const name = makeLegalIdentifier(pkg.name); // eslint-disable-line

  // TODO: use what's supported by packager'
  const file = deep
    ? path.resolve(cwd, deep)
    : path.resolve(
        cwd,
        pkg.module || pkg['jsnext:main'] || pkg.main || 'index.js',
      );

  let entry = file;

  try {
    const stats = await stat(file);
    if (stats.isDirectory()) {
      entry = path.join(file, 'index.js');
    }
  } catch (err) {
    entry = `${file}.js`;
  }

  logger.info(
    `[${pkg.name}] creating bundle with webpack with for ${String(query && query.platform)}`,
  );

  const compiler = webpack(
    makeConfig({
      root: cwd,
      entry,
      output: {
        path: '/',
        filename: 'bundle.js',
      },
      platform: query && query.platform === 'android' ? 'android' : 'ios',
    }),
  );

  const memoryFs = new MemoryFS();

  compiler.outputFileSystem = memoryFs;

  const status = await new Promise((resolve, reject) =>
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    }));

  const result = status.toJson();

  if (result.errors.length) {
    throw new Error(result.errors.join('\n'));
  }

  const code = memoryFs.readFileSync('/bundle.js');

  memoryFs.unlinkSync('/bundle.js');

  return code;
});
