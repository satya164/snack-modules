/*  @flow */

import utils from 'loader-utils';
import size from 'image-size';
import path from 'path';
import hasha from 'hasha';
import escapeStringRegexp from 'escape-string-regexp';

type Config = {
  platform: string,
  root: string,
  outputPath?: string | ((path: string) => string),
  publicPath?: string | ((path: string) => string),
};

export default (async function assetLoader() {
  this.cacheable();

  const callback = this.async();

  const query = utils.getOptions(this) || {};
  const options = this.options[query.config] || {};
  const config: Config = Object.assign({}, options, query);

  const filepath = this.resourcePath;
  const info = size(filepath);
  const dirname = path.dirname(filepath);
  const url = path.relative(config.root, dirname);
  const assets = path.join('assets', config.platform);
  const suffix = `(@\\d+(\\.\\d+)?x)?(\\.(${config.platform}|native))?\\.${info.type}$`;
  const filename = path.basename(filepath).replace(new RegExp(suffix), '');

  const regex = new RegExp(`^${escapeStringRegexp(filename)}${suffix}`);

  const result = await new Promise((resolve, reject) =>
    this.fs.readdir(dirname, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    }));

  const map = result.reduce(
    (acc, name) => {
      const match = name.match(regex);

      if (match) {
        let [x, scale, y, z, platform] = match; // eslint-disable-line

        scale = scale || '@1x';

        if (acc[scale]) {
          // platform takes highest prio, so if it exists, don't do anything
          if (acc[scale].platform === config.platform) {
            return acc;
          }

          // native takes second prio, so if it exists and platform doesn't, don't do anything
          if (acc[scale].platform === 'native' && !platform) {
            return acc;
          }
        }

        return Object.assign({}, acc, {
          [scale]: { platform, name },
        });
      }

      return acc;
    },
    {},
  );

  const scales = Object.keys(map)
    .map(s => Number(s.replace(/[^\d.]/g, '')))
    .sort();

  const buffers = await Promise.all(
    Object.keys(map).map(scale => {
      this.addDependency(path.join(dirname, map[scale].name));

      return new Promise((resolve, reject) =>
        this.fs.readFile(path.join(dirname, map[scale].name), (err, res) => {
          if (err) {
            reject(err);
          } else {
            let dest;

            const name = `${filename}${scale === '@1x' ? '' : scale}.${info.type}`;
            dest = path.join(assets, url, name);

            if (config.outputPath) {
              // support functions as outputPath to generate them dynamically
              dest = typeof config.outputPath === 'function'
                ? config.outputPath(dest)
                : path.join(config.outputPath, dest);
            }

            this.emitFile(dest, res);

            resolve(res);
          }
        }));
    }),
  );

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(path.join('/', assets, url))}`;

  if (config.publicPath) {
    // support functions as publicPath to generate them dynamically
    publicPath = JSON.stringify(
      typeof config.publicPath === 'function'
        ? config.publicPath(url)
        : path.join(config.publicPath, url),
    );
  }

  callback(
    null,
    `
    var AssetRegistry = require('react-native/Libraries/Image/AssetRegistry');
    module.exports = AssetRegistry.registerAsset({
      httpServerLocation: ${publicPath},
      name: ${JSON.stringify(filename)},
      width: ${info.width},
      height: ${info.height},
      type: ${JSON.stringify(info.type)},
      hash: ${JSON.stringify(hasha(Buffer.concat(buffers)))},
      scales: ${JSON.stringify(scales)},
    });
  `,
  );
});

/* $FlowFixMe: Flow is crazy */
assetLoader.raw = true;
