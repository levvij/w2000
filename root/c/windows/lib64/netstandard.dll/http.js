/// HTTP  
/// C 2019 levvij

function HTTP() {
	// http context node
	const nodePromise = Networking.proxy.createNode();

	const public = {
		// request from URL
		async request(urrl, options = {}) {
			// wait for node to connect
			const node = await nodePromise;
			
			// parse URL
			const url = new Networking.URL(urrl);
			
			// export node
			public.node = node;
			
			// set body length if POST request
			if (options.body && options.method != "GET") {
				if (!options.headers) {
					options.headers = {};
				}
				
				options.headers["Content-length"] = options.body.length;
			}

			// HTTP module only supports http/https
			if (url.protocol == "http:" || url.protocol == "https:") {
				// make request
				const res = await node.request(
					url.hostname,
					// get port (or use default)
					url.port || (url.protocol == "http:" ? 80 : 443), 
					// main request
					[
						(options.method || "GET") + " " + url.pathname + (url.search || "") + " HTTP/1.1",
						"Host: " + url.hostname,
						// use closed connections and no caching
						"Connection: close",
						"Pragma: no-cache",
						"Cache-Control: no-cache",
						// i am a old browser, just respect that please 
						"User-Agent: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0)",
						"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
						"Accept-Language: en-US,en;q=0.9,de;q=0.8",
						// add custom headers
						...(Object.keys(options.headers || {}).map(k => k + ": " + (options.headers[k] + "").trim())),
						// add body (if present)
						...(options.method == "GET" ? ["", ""] : options.body ? ["", "", options.body] : ["", ""])
					].join("\r\n"), 
					// use ssl only if protocol is https
					url.protocol == "https:",
					// send custom encoding
					options.encoding, 
					// tag for easier identification in network tab
					"http:" + url.pathname + (url.search || "")
				);

				// get all lines from response
				const lines = res.split("\n");
				const rheaders = {};

				const first = lines.shift();
				let rbody = false;

				// read headers & body
				for (let line of lines) {
					if (rbody === false && !line.trim()) {
						rbody = "";
					} else if (rbody === false) {
						const cs = line.split(":");
						rheaders[cs.shift().trim()] = cs.join(":").trim();
					} else {
						rbody += line + "\n";
					}
				}
				
				// encoding types
				if ("Content-Length" in rheaders) {
					// default content-length method
					rbody = rbody.substr(0, rheaders["Content-Length"]);
				} else if ("Transfer-Encoding" in rheaders) {
					// transfer encoding method
					// this isnt the perfect solution but most page dont use \r\n so its pretty safe
					if (rheaders["Transfer-Encoding"] == "chunked") {
						// just filter out every second line (the ones containing the lengths)
						rbody = rbody.split("\r\n").filter((r, i) => i % 2).join("\n");
					} else {
						throw new Error("Unknown Transfer Encoding: '" + rheaders["Transfer-Encoding"] + "'");
					}
				}

				// return response object
				return {
					code: +first.split(" ")[1],
					message: first.split(" ").slice(2).join(" "),
					headers: rheaders,
					body: rbody
				};
			} else {
				// throw error
				throw new Error("Unknown protocol " + url.protocol + "//");
			}
		},
		// requests and automatically rerequests new page if a redirect code was returned
		async autoRedirectedRequest(url, ...args) {
			const res = await public.request(url, ...args);

			if (res.code == 301 || res.code == 302) {
				return await public.autoRequest(res.headers.Location, ...args);
			}

			return res;
		},
		// transform image urls (for proxyies)
		async imageProxySource(url) {
			return url;
		}
	};

	return public;
}

Networking.HTTP = HTTP;