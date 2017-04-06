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

    const read = request(url);
    const write = createWriteStream(path.join(dir, 'package.tgz'));

    read.pipe(write);

    write.on('close', () => {
      clearTimeout(timeout);

      if (!timedout) {
        logger.info(`[${pkg.name}] extracting to ${dir}`);
        targz()
          .extract(path.join(dir, 'package.tgz'), dir)
          .then(resolve, reject);
      }
    });
  });
}
