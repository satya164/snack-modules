# snack-modules

[![Greenkeeper badge](https://badges.greenkeeper.io/satya164/snack-modules.svg?token=5abe3bb31b0ed282e25c782944b4e1aab38f53bd01088634b57d8a14e233ccf6&ts=1494409521834)](https://greenkeeper.io/)

Service to generate React Native compatible JavaScript bundles from NPM modules.

## Usage

To get a bundle, do a `GET` request with the follwing format:

```sh
/bundle/[name]@[version]
```

You can specify a semver range in `[version]`, e.g. - `^12.4.5`, or omit it to get the `latest` version.

The API returns a JSON object containing two properties, the exact version of the module and the bundled code.

The code is transpiled and bundled with `webpack` and `react-native` preset. Any dependencies of the library are bundled as well except `react`, `react-native` and `expo`. To use the code, you'd do something like this:

```js
global.__snack_exports = {};
global.__snack_require = name => {
  switch (name) {
    case 'react':
      return require('react');
    case 'react-native':
      return require('react-native');
    case 'expo':
      return require('expo'),
};

eval(`
(function(require, exports) {
  ${code}
  ;
})(global.__snack_require, global.__snack_exports);
`);
```

After the `eval`, the module will be available under `global.__snack_exports`.
