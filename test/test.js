// Shim of node `process` global to allow functioning in browser.
// should be moved to an init location for webpack shimming.
let process = require('process');
process.platform = 'browser';
process.binding = (req) => {
  if (req === 'constants') {
    return {
      'O_APPEND': 1024,
      'O_CREAT': 64,
      'O_EXCL': 128,
      'O_RDONLY': 0,
      'O_RDWR': 2,
      'O_SYNC': 4096,
      'O_TRUNC': 512,
      'O_WRONLY': 1,
    };
  }
};

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const getStream = require('get-stream');
const runner = require('..');

describe('Runner', () => {
  it('runs a rot13 wasi module', async () => {
    let buf;
    if (fs.readFileSync) {
      buf = fs.readFileSync(path.join(__dirname, 'rot13.wasm'));
    } else {
      let resp = await fetch('rot13.wasm');
      buf = await resp.arrayBuffer();
    }
    let prom = runner.instantiate(buf, { stdin: 'hello world' });
    return prom.then(async (r) => {
      const output = await getStream(r.stdout);
      assert.equal(output, 'uryyb jbeyq');
    });
  }).timeout(1000000);
});
