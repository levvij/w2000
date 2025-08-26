function URL(url, base) {
	if (url && url.href) {
		url = url.href;
	}
	
	if (base && base.href) {
		base = base.href;
	}
	
	let protocol = "";
	let port = "";
	
	// we have to take http because URL will not parse the url correctly otherwise
	if (/^[a-zA-Z]+\:\/\//.test(url)) {
		protocol = url.split("//")[0];
		
		if (/:[0-9]+$/.test(url.split("/")[2])) {
			port = +url.split("/")[2].split(":").pop();
		}
		
		url = "http://" + url.split("://").slice(1).join("://");
	} else {
		protocol = base.split("//")[0];
		
		if (/:[0-9]+$/.test(base.split("/")[2])) {
			port = +base.split("/")[2].split(":").pop();
		}
		
		base = "http://" + base.split("://").slice(1).join("://");
	}
	
	const p = new global.URL(url, base).href;
	
	const u = {
		port,
		protocol,
		host: p.split("://")[1].split("/")[0].split(":")[0] + (port ? ":" + port : ""),
		hostname: p.split("://")[1].split("/")[0].split(":")[0],
		pathname: "/" + (p.split("://")[1].split("/").slice(1).join("/").split("?")[0] || ""),
		search: p.split("?")[1] || ""
	};
	
	if (u.search) {
		u.search = "?" + u.search;
	}
	
	u.href = u.protocol + "//" + u.hostname + (u.port ? ":" + u.port : "") + u.pathname + u.search;
	
	return u;
}

Networking.URL = URL;