/* @flow */

import { mkdir, rimraf } from 'sander';
import uglify from 'uglifyjs';
import logger from '../logger';
import fetchAndExtract from './fetchAndExtract';
import installDependencies from './installDependencies';
import config from '../../config';
import packageBundle from './packageBundle';

const inProgress = {};

export default (async function fetchBundle(
  pkg,
  version: string,
  deep?: string,
) {
  const hash = `${pkg.name}@${version}${deep ? `/${deep}` : ''}`;

  logger.info(`[${pkg.name}] requested package`);

  // TODO: return from cache if exists

  if (inProgress[hash]) {
    logger.info(`[${pkg.name}] request was already in progress`);
  } else {
    logger.info(`[${pkg.name}] is not cached`);

    const dir = `${config.tmpdir}/${hash}`;
    const cwd = `${dir}/package`;

    // TODO: cache the promise
    inProgress[hash] = true;

    try {
      await mkdir(dir);
      await fetchAndExtract(pkg, version, dir);
      await installDependencies(cwd);

      const code = await packageBundle(cwd, deep);

      logger.info(`[${pkg.name}] minifying`);

      try {
        return uglify.minify(code, { fromString: true }).code;
      } catch (err) {
        logger.info(`[${pkg.name}] minification failed: ${err.message}`);
        return code;
      }

      // TODO: cache package
    } finally {
      inProgress[hash] = null;
      rimraf(dir);
    }
  }

  return inProgress[hash];
});
