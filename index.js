const runner = require('./polyfill.js');
const { Readable } = require('stream');

// Delay processing of things until the underlying wasm harness is ready.
const ready = new Promise((resolve) => {
  runner.onRuntimeInitialized = resolve;
});

module.exports = {
  instantiate: async function instantiate(buffer, imports) {
    await ready;

    let ret = {};
    if (!imports.stdout) {
      ret.stdout = new Readable({});
      ret.stdout._read = () => {};
      imports.stdout = (val) => {
        ret.stdout.push(val === null ? null : new Uint8Array([val]));
      }
    }
    if (!imports.stderr) {
      ret.stderr = new Readable({});
      ret.stderr._read = () => {};
      imports.stderr = (val) => {
        ret.stderr.push(val === null ? null : new Uint8Array([val]));
      }
    }

    ret.instance = runner.instantiateWasi(buffer, imports);
    return ret;
  },
};
