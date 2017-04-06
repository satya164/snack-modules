/* @flow */

import path from 'path';
import request from 'request';
import targz from 'tar.gz';
import { createWriteStream } from 'sander';
import logger from '../logger';

export default function fetchAndExtract(pkg, version: string, dir: string) {
  const url = pkg.versions[version].dist.tarball;

  logger.info(`[${pkg.name}] fetching ${url}`);

  return new Promise((resolve, reject) => {
    let timedout = false;

    const timeout = setTimeout(
      () => {
        reject(new Error('Request timed out'));
        timedout = true;
      },
      10000,
    );

    const input = request(url);

    // don't like going via the filesystem, but piping into targz
    // was failing for some weird reason
    const intermediate = createWriteStream(path.join(dir, 'package.tgz'));

    input.pipe(intermediate);

    intermediate.on('close', () => {
      clearTimeout(timeout);

      if (!timedout) {
        logger.info(`[${pkg.name}] extracting to ${dir}/package`);
        targz().extract(path.join(dir, 'package.tgz'), dir).then(resolve, reject);
      }
    });
  });
}
