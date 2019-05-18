const runner = require('./polyfill.js');

// Delay processing of things until the underlying wasm harness is ready.
let ready, resolveReady;
ready = new Promise((resolve) => {
  resolveReady = resolve;
});

runner.onRuntimeInitialized = function () {
  resolveReady();
};

exports.instantiate = async function instantiate(buffer, imports) {
  await ready;
  return runner.instantiateWasi(buffer, imports);
};
