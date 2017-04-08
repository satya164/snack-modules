/* @flow */

import querystring from 'querystring';

type Result = {
  scope: ?string,
  id: ?string,
  tag: ?string,
  deep: ?string,
  platform: ?string,
};

export default function parseRequest(url: string): ?Result {
  const match = /^\/(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+?))?(?:@(.+?))?(?:\?(.+))?$/.exec(
    url,
  );

  if (!match) {
    return null;
  }

  const scope = match[1]; // matches scope in `@sccope/package`
  const id = match[2]; // matches id in `@user/id` or `package`
  const deep = match[3]; // matches deep path in `package/debounce` or `package@^3.4.0/debounce`
  const tag = match[4] || 'latest'; // matches version number in `package@^3.4.0`
  const qs = match[5]; // matches the query string

  const query = qs ? querystring.parse(qs) : null;

  return {
    scope,
    id,
    tag,
    deep,
    platform: query && query.platform,
  };
}
