const hubs = {};

DLL.export("Hub", {
	read(name) {
		return hubs[name] || [];
	},
	import(application, configs) {
		for (let config of configs) {
			if (!(config.hub in hubs)) {
				hubs[config.hub] = [];
			}
			
			const old = hubs[config.hub].find(o => o.application == application && JSON.stringify(o.data) == JSON.stringify(config.data));
			
			if (old) {
				hubs[config.hub].splice(hubs[config.hub].indexOf(old), 1);
			}

			hubs[config.hub].push({
				application: config.anonymous ? null : application,
				data: config.data
			});
		}
	}
});