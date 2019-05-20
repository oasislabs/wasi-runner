const runner = require('./polyfill.js');
const { Readable } = require('stream');

// Delay processing of things until the underlying wasm harness is ready.
const ready = new Promise((resolve) => {
  runner.onRuntimeInitialized = resolve;
});

exports.instantiate = async function instantiate(buffer, imports) {
  await ready;

  let ret = {};
  if (!imports.stdout) {
    ret.stdout = new Readable({});
    ret.stdout._read = () => {};
    imports.stdout = (val) => {
      if (val !== null) {
        ret.stdout.push(new Uint8Array([val]));
      } else {
        ret.stdout.push(null);
      }
    }
  }
  if (!imports.stderr) {
    ret.stderr = new Readable({});
    ret.stderr._read = () => { };
    imports.stderr = (val) => {
      if (val !== null) {
        ret.stderr.push(new Uint8Array([val]));
      } else {
        ret.stderr.push(null);
      }
    }
  }

  ret.instance = runner.instantiateWasi(buffer, imports);
  return ret;
};
