/* @flow */

import type { $Request, $Response } from 'express';
import fetch from 'node-fetch';
import semver from 'semver';
import logger from './logger';
import fetchBundle from './utils/fetchBundle';
import parseRequest from './utils/parseRequest';
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
  const parsed = parseRequest(req.url.replace(/^\/bundle/, ''));

  if (!(parsed && parsed.id)) {
    res.status(400);
    res.end('Invalid module ID');
    return;
  }

  const qualified = parsed.scope ? `@${parsed.scope}/${parsed.id}` : parsed.id;

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

    const version = parsed.tag ? findVersion(meta, parsed.tag) : null;

    if (!version || !semver.valid(version)) {
      res.status(400);
      res.end(`Invalid version ${String(version)}`);
      return;
    }

    const code = await fetchBundle(meta, version, parsed.deep, parsed.platform);

    res.status(200);
    res.end(
      JSON.stringify({
        version,
        code,
      }),
    );
  } catch (e) {
    logger.error(`[${qualified}] ${e.toString()}`);
    res.status(500);
    res.end('An unknown error occured');
  }
});
