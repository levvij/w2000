/// DNS lookup via server proxy
/// C 2019 levvij

function DNS() {
	const public = {
		parse(url) {
			// parse url
			return new URL(url);
		},
		async getAddress(url) {
			// dns lookup
			try {
				return fetch(configuration.dns + "?host=" + public.parse(url).hostname).then(r => r.text());
			} catch (e) {
				return fetch(configuration.dns + "?host=" + url).then(r => r.text());
			} 
		}
	}
	
	return public;
}

Networking.dns = new DNS(configuration.dns);