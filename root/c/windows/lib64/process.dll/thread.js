DLL.private.thread = (fx, args) => {
    const thread = new Promise(done => {
        setTimeout(() => {
            const argNames = (fx + "").trim().split(")")[0].split("(")[1].split(",").map(e => e.trim());

            const main = "(" + (() => {
                onmessage = event => {
                    const env = ["self", "event"];

                    for (let key in self) {
                        if (!["postMessage", "Math"].includes(key)) {
                            env.push(key);
                        }
                    }

                    const __scoped = () => {
                        return {};
                    };

                    const __scope = {
                        __scope_location() {},
                        __scope_close() {}
                    };

                    function ScopeError(e) {
                        throw e;
                    }

                    new Function(
                        ...env,
                        "__scoped",
                        "__scope",
                        "ScopeError",
                        "postMessage((" + event.data.source + ")(..." + JSON.stringify(event.data.args) + "))"
                    )(
                        ...Array(env.length).fill(),
                        __scoped,
                        __scope,
                        ScopeError
                    );
                }
            }) + ")()";

            const blob = new Blob([main]);
            const worker = new Worker(URL.createObjectURL(blob));
            worker.postMessage({
                source: fx + "",
                args
            });

            worker.onmessage = event => {
                thread.done = true;
                thread.ondone();

                done(event.data);
            }
        });
    });

    thread.ondone = new Event("Thread done");

    return thread;
};