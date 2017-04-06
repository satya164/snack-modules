/* @flow */

import type { $Request, $Response } from 'express';
import fetch from 'node-fetch';
import semver from 'semver';
import querystring from 'querystring';
import logger from './logger';
import fetchBundle from './utils/fetchBundle';
import config from '../config';

function findVersion(meta, tag) {
  // already a valid version?
  if (semver.valid(tag)) {
    return meta.versions[tag] && tag;
  }

  // dist tag
  if (tag in meta['dist-tags']) {
    return meta['dist-tags'][tag];
  }

  // semver range
  return semver.maxSatisfying(Object.keys(meta.versions), tag);
}

export default (async function(req: $Request, res: $Response) {
  const match = /(?:@([^/?]+)\/)?([^@/?]+)(?:@(.+?))?(?:\/(.+?))?(?:\?(.+))?$/.exec(
    req.url.replace(/^\/bundle\//, ''),
  );

  if (!match) {
    res.status(400);
    res.end('Invalid module ID');
    return;
  }

  const user = match[1]; // matches user in `@user/package`
  const id = match[2]; // matches id in `@user/id` or `package`
  const tag = match[3] || 'latest'; // matches version number in `package@^3.4.0`
  const deep = match[4]; // matches deep path in `package/debounce` or `package@^3.4.0/debounce`
  const qs = match[5]; // matches the query string

  const qualified = user ? `@${user}/${id}` : id;

  try {
    // Fetch the package metadata from the registry
    const response = await fetch(
      `${config.registry}/${encodeURIComponent(qualified)}`,
    );
    const meta = await response.json();

    if (!meta.versions) {
      res.status(400);
      res.end(`Invalid module ${qualified}`);
      return;
    }

    const version = findVersion(meta, tag);

    if (!version || !semver.valid(version)) {
      res.status(400);
      res.end(`Invalid version ${String(version)}`);
      return;
    }

    const result = await fetchBundle(
      meta,
      version,
      deep,
      qs ? querystring.parse(qs) : null,
    );

    res.status(200);
    res.set({
      'Content-Type': 'application/javascript',
      'Cache-Control': 'max-age=86400',
    });
    res.end(result);
  } catch (e) {
    logger.error(`[${qualified}] ${e.toString()}`);
    res.status(500);
    res.end('An unknown error occured');
  }
});
