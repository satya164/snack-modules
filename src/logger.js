/* @flow */

import fs from 'fs';
import path from 'path';
import minilog from 'minilog';
import config from '../config';

minilog.enable();
minilog.pipe(fs.createWriteStream(path.join(config.logdir, `${Date.now()}.log`)));

export default minilog('snack-modules');
