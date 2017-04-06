/* @flow */

import webpack from 'webpack';
import AssetResolver from './AssetResolver';

type Options = {
  root: string,
  entry: string,
  output: {
    path: string,
    filename: string,
    library: string,
  },
  platform: 'ios' | 'android',
};

export default ({ root, entry, output, platform }: Options) => ({
  context: root,
  entry,
  output: {
    ...output,
    libraryTarget: 'commonjs',
  },
  module: {
    rules: [
      { parser: { requireEnsure: false } },
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!react|@expo|haul)/,
        use: {
          loader: require.resolve('babel-loader'),
          query: {
            babelrc: false,
            presets: [require.resolve('babel-preset-react-native')],
          },
        },
      },
      {
        test: AssetResolver.test,
        use: {
          loader: require.resolve('./assetLoader'),
          query: { platform, root },
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify('production') },
      __DEV__: JSON.stringify(false),
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        screw_ie8: true,
        warnings: false,
      },
      mangle: {
        screw_ie8: true,
      },
      output: {
        comments: false,
        screw_ie8: true,
      },
    }),
  ],
  externals: ['react', 'react-native', 'expo'],
  resolve: {
    plugins: [new AssetResolver({ platform })],
    mainFields: ['react-native', 'browser', 'main'],
    extensions: [`.${platform}.js`, '.native.js', '.js'],
  },
});
