/* @flow */

export type Package = {
  name: string,
  versions: {
    [key: string]: {
      dist: {
        tarball: string,
      },
    },
  },
};
