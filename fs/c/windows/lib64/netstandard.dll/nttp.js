function NTTP() {
	// nttp context node
	const public = {
		// request from URL
		async request(source, options = {}) {
			// parse URL
			const url = new Networking.URL(source);
			const client = NoGap.Client(url.hostname);
			
			// set body length if POST request
			if (options.body && options.method != "GET") {
				if (!options.headers) {
					options.headers = {};
				}
			}

			// HTTP module only supports http/https
			if (url.protocol == "nttp:") {
				// make request
				const res = await client.request(url.port || 80, ".", [
					(options.method || "GET") + " " + url.pathname + (url.search || "") + " NTTP/1.0.0.0",
					"Host: " + url.hostname,
					...(Object.keys(options.headers || {}).map(k => k + ": " + (options.headers[k] + "").trim())),
					...(options.method == "GET" ? ["", ""] : options.body ? ["", "", options.body] : ["", ""])
				].join("\n"));
				
				if (res.status) {
					throw new NttpError(res.status + " (" + url.hostname + ")");
				}

				// get all lines from response
				const lines = res.data.split("\n");
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

function NttpError(message) {
	return new Error(message);
}

Networking.NTTP = NTTP;
