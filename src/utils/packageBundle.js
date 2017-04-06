/* @flow */

import path from 'path';
import { stat, readFile } from 'sander';
import makeLegalIdentifier from './makeLegalIdentifier';

export default async function packageBundle(cwd: string, deep?: string) {
  const content = await readFile(path.join(cwd, 'package.json'));
  const pkg = JSON.parse(content);
  const name = makeLegalIdentifier(pkg.name);

  // TODO: use what's supported by packager'
  const file = path.resolve(
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

  entry = deep ? path.resolve(cwd, deep) : entry;

  const code = await readFile(entry, { encoding: 'utf-8' });

  // if (isModule(code)) {
  //   logger.info(`[${pkg.name}] ES2015 module found, using Rollup`);
  // } else {
  //   logger.info(`[${pkg.name}] No ES2015 module found, using Browserify`);
  // }

  return 'module.exports = "Example bundle code"';
}