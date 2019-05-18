= WASI Runner

Module entrypoint for instantiation and execution of WASI-targeted
WASM code. A modification of the [js-polyfill](https://wasi.dev/polyfill/) for easier use in testing / command line interactions.

== Usage

```
const runner = require('wasi-runner');
let stdin = 'hello world';
let exitCode = await runner.instantiate(fs.readFileSync('my.wasi'), {
  stdin,
  stdout = (val) => {
    console.log(val);
  },
});
```

== Limitations

* The current structure won't safely support multiple concurrent instances.
* Mapping of stdin/stdout/stderr is fairly rudimentary.
* The shim provides default polyfill for socket and FD functionality.
* The runner doesn't (yet) allow for over-riding most of that defualt behavior.