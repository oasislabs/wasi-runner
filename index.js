const runner = require('./polyfill.js');
const { MakeAbsolute } = require('./sourcemap.js');
const { Readable } = require('stream');
const url = require('url');

// Delay processing of things until the underlying wasm harness is ready.
const ready = new Promise((resolve) => {
  runner.onRuntimeInitialized = resolve;
});

module.exports = {
  instantiate: async function instantiate(buffer, options) {
    await ready;

    if (options && options.sourceURL !== undefined) {
      if (typeof window !== 'undefined') {
        options.sourceURL = url.resolve(window.location.href, options.sourceURL);
      } else {
        options.sourceURL = url.resolve(__dirname, options.sourceURL);
      }
      buffer = MakeAbsolute(buffer, options.sourceURL);
    }

    let ret = {};
    if (!options.stdout) {
      ret.stdout = new Readable({});
      ret.stdout._read = () => { };
      options.stdout = (val) => {
        ret.stdout.push(val === null ? null : new Uint8Array([val]));
      }
    }
    if (!options.stderr) {
      ret.stderr = new Readable({});
      ret.stderr._read = () => { };
      options.stderr = (val) => {
        ret.stderr.push(val === null ? null : new Uint8Array([val]));
      }
    }

    ret.instance = runner.instantiateWasi(buffer, options);
    return ret;
  },
};
