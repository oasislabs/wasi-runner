const path = require('path');

module.exports = {
  mode: 'development',
  entry: './test/test.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'tests.js',
  },
  node: {
    fs: 'empty',
    stream: true,
  },
  externals: ['ws'],
  module: {
    noParse: [/^ws$/],
  },
};
