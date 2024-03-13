/// IE Browser frame
/// C 2019 levvij

const log = globalConsole.createUnit("ieframe");

function Browser(element, url, win) {
    // create events
    element.onstatechange = new Event("Browser frame state change");
    element.onurlchange = new Event("Browser frame URL change");
    element.ontitlechange = new Event("Browser frame title change");

    let currentUrl = url;

    if (!(currentUrl.startsWith("http://") ||  currentUrl.startsWith("https://") || currentUrl.startsWith("nttp://") || currentUrl.startsWith("file://"))) {
        currentUrl = "file://" + currentUrl;
    }

    // create iframe node
    const page = document.createElement("iframe");

    // create http node & nttp client
    const http = new Networking.HTTP();
    const nttp = new Networking.NTTP();

    element.http = http;
    element.nttp = nttp;

    // history object
    const history = new History(currentUrl);

    // go to new page (does not manage history, use navigate instead)
    const go = (urrl, method, data) => {
        // encode url params
        if ((!method || method == "GET") && data) {
            urrl += "?";

            for (let key in data) {
                urrl += key + "=" + encodeURIComponent(data[key]) + "&";
            }

            urrl = urrl.slice(0, -1);
        }

        // parse url
        if (currentUrl.startsWith("file://") && !(urrl.startsWith("http://") || urrl.startsWith("https://") || urrl.startsWith("file://") || urrl.startsWith("nttp://"))) {
            urrl = "file://" + urrl;
        }

        const urlObject = new Networking.URL(urrl, currentUrl);
        const url = urlObject.href;

        // create URL change & state change
        element.onurlchange(currentUrl = url, history);
        element.onstatechange("Loading " + url + "...");

        // use local or global page?
        if (urlObject.protocol == "about:") {
            if (["blank", "about"].includes(urlObject.pathname)) {
                // clear page
                page.srcdoc = "";

                fs.read(DLL.resource(urlObject.pathname + ".html")).then(data => {
                    page.srcdoc = data;
                });
            }
        } else {
            let req;
            let provider;

            switch (urlObject.protocol) {
                case "file:":
                    {
                        req = fs.read(decodeURIComponent(urlObject.host + "/" + urlObject.pathname)).then(r => ({
                            code: 200,
                            headers: {},
                            body: r
                        }));

                        break;
                    }
                case "http:":
                case "https:":
                    {
                        provider = http;

                        req = http.request(url, {
                            method,
                            body: data
                        });

                        break;
                    }
                case "nttp:":
                    {
                        provider = nttp;

                        req = nttp.request(url, {
                            method,
                            body: data
                        });

                        break;
                    }
            }

            if (!req) {
                req = fs.read(DLL.resource("invalid-protocol.html")).then(r => ({
                    code: 200,
                    headers: {},
                    body: r.replace("{protocol}", (urlObject.protocol.match(/[a-zA-Z]*/g) || [])[0])
                }));
            }

            const transformPage = async res => {
                // parse HTML
                const dom = (new DOMParser()).parseFromString(res.body, "text/html");

                // create namespace
                // <a href="index.html"> -> <a onclick="___<some id>('index.html')">
                const namespace = "___" + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) + "_" + Math.random().toString(36).substr(2);

                // get root of document
                const root = (dom.querySelector("body") || dom);

                // get base URL (use <base href=""> or current url)
                const base = (dom.querySelector("base") || {
                    href: url
                }).href;

                const transformStyle = style => {
                    return style.replace(/url\((\'|\")?(.*?)(\'|\")?\)/g, find => {
                        const url = find.match(/url\((\'|\")?(.*?)(\'|\")?\)/)[2];

                        if (url.startsWith("data:")) {
                            return find;
                        }

                        return find.replace(url, new Networking.URL(url, base).href);
                    });
                };

                // remove all scripts (na i aint gon support that)
                for (let element of dom.querySelectorAll("script")) {
                    element.remove();
                }

                // meta tags
                for (let element of dom.querySelectorAll("meta[http-equiv]")) {
                    res.headers[element.getAttribute("http-equiv")] = element.getAttribute("content");
                    element.remove();
                }

                // remove all on- attributes (onclick, ...)
                for (let element of dom.querySelectorAll("*")) {
                    for (let attr of element.attributes) {
                        if (attr.name.substr(0, 2) == "on") {
                            element.removeAttribute(attr.name);
                        }
                    }
                }

                // transform all style elements
                for (let element of dom.querySelectorAll("style")) {
                    element.textContent = transformStyle(element.textContent);
                }

                // transform inline styles
                for (let element of dom.querySelectorAll("[style]")) {
                    element.setAttribute("style", transformStyle(element.getAttribute("style")));
                }

                // proxy all stylesheets
                for (let link of dom.querySelectorAll("link")) {
                    link.remove();

                    if (link.rel == "stylesheet") {
                        const style = document.createElement("style");

                        element.onstatechange("Downloading stylesheet " + link.getAttribute("href") + "...");

                        const url = new Networking.URL(link.getAttribute("href"), base);

                        if (url.protocol == "file:") {
                            if (await fs.exists(url.host + "/" + url.pathname)) {
                                style.textContent = await fs.read(url.host + "/" + url.pathname);
                            } else {
                                log.warn("not-found", "stylesheet '" + url.host + "/" + url.pathname + "' not found");
                            }
                        } else {
                            style.textContent = transformStyle((await provider.request(url.href, {
                                method: "GET"
                            })).body);
                        }

                        root.appendChild(style);
                    }
                }

                // proxy images (just transform URL)
                for (let element of dom.querySelectorAll("img")) {
                    const url = new Networking.URL(element.getAttribute("src"), base);

                    if (url.protocol == "file:") {
                        if (await fs.exists(url.host + "/" + url.pathname)) {
                            element.src = await fs.readURI(url.host + "/" + url.pathname);
                        } else {
                            element.src = "";

                            log.warn("not-found", "image '" + url.host + "/" + url.pathname + "' not found");
                        }
                    } else {
                        element.src = url.href;
                    }
                }

                // proxy video/audio elements
                for (let element of dom.querySelectorAll("source")) {
                    const url = new Networking.URL(element.getAttribute("src"), base);

                    if (url.protocol == "file:") {
                        if (await fs.exists(url.host + "/" + url.pathname)) {
                            element.src = await fs.readURI(url.host + "/" + url.pathname);
                        } else {
                            element.src = "";

                            log.warn("not-found", "source '" + url.host + "/" + url.pathname + "' not found");
                        }
                    } else {
                        element.src = url.href;
                    }
                }

                // show all noscript elements
                for (let element of dom.querySelectorAll("noscript")) {
                    const el = document.createElement("no-script");
                    el.textContent = element.textContent;
                    element.parentElement.insertBefore(el, element);
                }

                // replace all links
                for (let element of dom.querySelectorAll("a")) {
                    if (element.href && element.href[0] != "#") {
                        element.setAttribute("onclick", namespace + "_link(" + JSON.stringify(element.getAttribute("href")) + ")");
                        element.removeAttribute("href");
                    }
                }

                // replace form attributes
                for (let element of dom.querySelectorAll("form")) {
                    const id = "_form_" + Math.random().toString(36).substr(2);
                    element.setAttribute("onsubmit", "return " + namespace + "_form(this, " + JSON.stringify(element.getAttribute("action")) + ", " + JSON.stringify(element.getAttribute("method") || "GET") + ")");
                    element.removeAttribute("action");
                    element.removeAttribute("method");

                    for (let submit of element.querySelectorAll("input[type=submit]")) {
                        submit.setAttribute("onclick", namespace + "_submit(this)");
                    }
                }

                if (res.headers.refresh || res.headers.Refresh) {
                    const content = (res.headers.refresh || res.headers.Refresh).split(";");

                    setTimeout(() => {
                        navigate(content[1].trim().replace("URL=", "").replace("url=", ""));
                    }, +content[0] * 1000);
                }

                // read default page (including all frame helper scripts)
                fs.read(DLL.resource("default.html")).then(async res => {
                    let html = "";

                    // add html of all childs
                    for (let child of dom.childNodes) {
                        html += child.outerHTML || "";
                    }

                    // replace all namespace code
                    let out = res.split("NAMESPACE").join(namespace).split("PARENT").join(location.href) + html;

                    for (let name in configuration.paths) {
                        out = out.split(name).join(await fs.readURI(configuration.paths[name]));
                    }

                    // add postmessage based communication
                    window.addEventListener("message", async event => {
                        const data = JSON.parse(event.data);

                        if (data[0] == namespace) {
                            switch (data[1]) {
                                case "link":
                                    {
                                        // navigate to link
                                        navigate(data[2]);
                                        break;
                                    }
                                case "form":
                                    {
                                        // post form (or get)
                                        navigate(data[2], data[3], data[4]);
                                        break;
                                    }
                                case "keydown":
                                    {
                                        // handle key
                                        Window.keydown(data[2]);
                                        break;
                                    }
                                case "cursor":
                                    {
                                        const box = element.native.getBoundingClientRect();

                                        Cursor.update(data[2].x + box.x, data[2].y + box.y, await Cursor.load(({
                                            none: "arrow",
                                            default: "arrow",
                                            pointer: "hand",
                                            text: "beam"
                                        })[data[2].cursor]));

                                        break;
                                    }
                                case "context":
                                    {
                                        // handle contextmenu
                                        // get box of frame and add position of event & box
                                        const box = element.native.getBoundingClientRect();

                                        UI.ContextMenu([{
                                            text: "View Source",
                                            click() {
                                                // view source in new window
                                                const child = win.createChildWindow("Source: " + url, win.width, win.height);
                                                child.render(ui => {
                                                    const scroll = ui.Scroll();
                                                    ui.root.add(scroll);

                                                    scroll.add(ui.TextArea(html));
                                                });
                                            }
                                        }, {
                                            text: "Networking",
                                            click() {
                                                // open netyrn.exe with node id as filter
                                                Application.load("c/windows/system32/netyrn.exe", http.node.id);
                                            }
                                        }], data[2].x + box.x, data[2].y + box.y, null, win.z);

                                        break;
                                    }
                                default:
                                    {
                                        throw new Error("Unknown post message: '" + data.join("', '") + "'");
                                    }
                            }
                        }
                    });

                    page.srcdoc = out;
                    element.document = html;
                    element.title = (dom.querySelector("title") || {
                        textContent: url
                    }).textContent.split("/").join("-");

                    element.ontitlechange();
                });
            };

            // create request
            req.then(async res => {
                if (res.code == 301 || res.code == 302) {
                    // redirect
                    element.onstatechange("Redirecting to " + res.headers.Location + "...");

                    // update history
                    history.replace(res.headers.Location);
                    go(res.headers.Location, method, data);
                } else {
                    // clear page & update state
                    page.srcdoc = "";
                    element.onstatechange("Done");

                    transformPage(res);
                }
            }).catch(err => {
                // show error page
                fs.read(DLL.resource("error.html")).then(res => {
                    element.onstatechange("Error loading page");

                    transformPage({
                        body: res.split("{error}").join(err.stack),
                        headers: {}
                    });

                    log.warn("page error", err);
                });
            });
        }
    };

    // navigate with history management
    const navigate = (url, method, data) => {
        history.push(url);

        go(url, method, data);
    };

    // go to initial url
    go(url);

    // bind to url changes
    element.bind("source", () => {
        return currentUrl;
    }, value => {
        navigate(value);
    });

    // add back/forward/reload functions
    element.back = () => {
        go(history.back());
    };

    element.forward = () => {
        go(history.forward());
    };

    element.reload = () => {
        go(history.current);
    };

    element.native.appendChild(page);
}

DLL.export("Browser", Browser);
UI.extend("WebControl", (env, url) => {
    const frame = env.element("ui-iframe");
    const browser = new Browser(frame, url, env.window);

    // bind keys
    env.window.bindKey("f5", () => {
        frame.reload();
    });

    env.window.bindKey("ctrl+r", () => {
        frame.reload();
    });

    return frame;
});
