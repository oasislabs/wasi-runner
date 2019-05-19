#include <emscripten.h>
#include "wasmtime_ssp.h"
#include "../src/posix.h"

static __thread struct fd_table curfds_pointee;

int main(int argc, char *argv[]) {
    return 0;
}

void handleRun(void) {
    struct fd_table *curfds = &curfds_pointee;

    fd_table_init(curfds);

    // Prepopulate curfds with stdin, stdout, and stderr file descriptors.
    if (!fd_table_insert_existing(curfds, 0, 0))
        __builtin_trap();
    if (!fd_table_insert_existing(curfds, 1, 1))
        __builtin_trap();
    if (!fd_table_insert_existing(curfds, 2, 2))
        __builtin_trap();

    EM_ASM(" \
        const imports = { wasi_unstable: WASIPolyfill }; \
        WebAssembly.instantiate(Module['currentWasi'].buffer, imports) \
        .then(obj => { \
            setInstance(obj.instance); \
            try { \
                return obj.instance.exports._start(); \
            } catch (e) { \
                if (e instanceof WASIExit) { \
                    handleWASIExit(e); \
                } \
            } \
        }) \
        .then(res => { \
            Module['currentWasiDone'](res); \
        }, err => { \
            Module['currentWasiDone'](err); \
        }); \
    ");
}
