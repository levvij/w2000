/// Internet Proxy
/// C 2019 levvij

function Proxy(url) {
	const public = {
		// creates new proxy node
		createNode() {
			return ProxyNode(url, Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2));
		}
	};
	
	return public;
}

// proxy node tunnels all internet traffic over proxy server
async function ProxyNode(url, id) {
	const public = {
		id: Cypp.shortenId(Cypp.createId()),
		communications: [],
		// address of current node
		address: await Networking.dns.getAddress(url),
		// request raw data
		async request(address, port, request, ssl = false, encoding = "", identification = "<>") {
			// communication logging object
			const com = {
				address,
				port,
				request,
				ssl,
				encoding,
				identification,
				start: new Date()
			};
			
			public.communications.push(com);
			
			// actual request
			const res = await fetch(url + "?" + identification, {
				method: "POST",
				body: JSON.stringify({
					id,
					address: ssl ? address : await Networking.dns.getAddress(address),
					port,
					request,
					ssl,
					encoding,
					speed: configuration.speed
				})
			}).then(r => r.text());
			
			// update communication object
			com.response = res;
			com.end = new Date();
			com.completed = true;
			
			return res;
		}
	}
	
	Networking.nodes.push(public);
		
	return public;
}

Networking.proxy = new Proxy(configuration.proxy);