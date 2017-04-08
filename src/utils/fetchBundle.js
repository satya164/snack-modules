/* @flow */

import { mkdir, rimraf } from 'sander';
import querystring from 'querystring';
import fetchAndExtract from './fetchAndExtract';
import installDependencies from './installDependencies';
import packageBundle from './packageBundle';
import logger from '../logger';
import config from '../../config';

const inProgress = {};

export default (async function fetchBundle(
  pkg,
  version: string,
  deep: ?string,
  query: ?{ platform?: string },
) {
  const hash = `${pkg.name}@${version}${deep ? `/${deep}` : ''}${query ? `_${querystring.stringify(query)}` : ''}`;

  logger.info(`[${pkg.name}] requested package`);

  // TODO: return from cache if exists

  if (inProgress[hash]) {
    logger.info(`[${pkg.name}] request is already in progress`);
  } else {
    logger.info(`[${pkg.name}] is not cached`);

    const dir = `${config.tmpdir}/${hash}`;
    const cwd = `${dir}/package`;

    inProgress[hash] = mkdir(dir)
      .then(() => fetchAndExtract(pkg, version, dir))
      .then(() => installDependencies(cwd))
      .then(() => packageBundle(cwd, deep, query));

    try {
      return await inProgress[hash];

      // TODO: cache package
    } finally {
      inProgress[hash] = null;
      rimraf(dir);
    }
  }

  return inProgress[hash];
});
