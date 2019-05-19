const assert = require('assert');
const getStream = require('get-stream');
const fs = require('fs');
const runner = require('..');

describe('Runner', () => {
  it('runs a rot13 wasi module', (done) => {
    const buf = fs.readFileSync('test/rot13.wasm');
    let prom = runner.instantiate(buf, { stdin: 'hello world' });
    prom.then(async (r) => {
      const output = await getStream(r.stdout);
      assert.equal(output, 'uryyb jbeyq');
      done();
    });
  });
});
