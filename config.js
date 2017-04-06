/* @flow */

import path from 'path';

export default {
  port: 3031,
  registry: 'http://registry.npmjs.org',
  logdir: path.join(__dirname, 'logs'),
  tmpdir: path.join(__dirname, 'tmp'),
};
