/* @flow */

import path from 'path';
import child_process from 'child_process';
import { readFile } from 'sander';
import logger from '../logger';

const blacklist = ['react', 'react-native', 'expo'];

const exec = (cmd, cwd) =>
  new Promise((resolve, reject) =>
    child_process.exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
      }
    }));

export default (async function installDependencies(cwd: string) {
  const content = await readFile(path.join(cwd, 'package.json'));
  const pkg = JSON.parse(content);

  logger.info(`[${pkg.name}] running yarn --production`);

  const { stdout: bin } = await exec('npm bin');
  const yarn = path.resolve(bin.trim(), 'yarn');
  const { stdout, stderr } = await exec(`${yarn} --production`, cwd);

  if (stdout) {
    stdout.split('\n').forEach(line => logger.info(`[${pkg.name}] ${line}`));
  }

  if (stderr) {
    stderr
      .split('\n')
      .forEach(line => logger.info(`[${pkg.name}] Error: ${line}`));
  }

  if (!pkg.peerDependencies) {
    return;
  }

  const peerDependencies = Object.keys(pkg.peerDependencies).filter(
    // We don't want multiple copies of react, react-native or expo
    name => !blacklist.includes(name),
  );

  for (const name of peerDependencies) {
    logger.info(`[${pkg.name}] installing peer dependency ${name}`);

    const version = pkg.peerDependencies[name];

    await exec(`${yarn} add ${name}@${version}`, cwd);
  }
});
