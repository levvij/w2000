NTFS.registerProvider("ftpsp", function (config, fs) {
	const log = globalConsole.createUnit("ftp");
	const disk = "ftp:" + config.host + ":" + Cypp.createId();

	let id;
	let caches = [];

	const request = (route, data) => {
		data.id = id;

		return fetch(config.proxy + "/" + route + "/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		}).then(res => res.json());
	};

	const realPath = path => Path.fix(path.replace(disk, config.initialDirectory || ""));

	const public = {
		get name() {
			return config.name || (config.host + " - FTP");
		},
		capacity: 0,
		disks: [disk],
		get free() {},
		async reload() {
			// remove all caches
			for (let cache of caches) {
				for (let item in cache) {
					delete cache[item];
				}
			}

			if (config.id) {
				log.action("connect", "connecting to '" + config.host + "' via '" + config.proxy + "' (known connection)...");

				id = config.id;
			} else {
				log.action("connect", "connecting to '" + config.host + "' via '" + config.proxy + "' (new connection)...");

				const connect = await request("connect", {
					host: config.host,
					port: config.port || 21,
					username: config.user,
					password: config.password
				});

				if (!connect) {
					throw new Error("Could not connect as '" + config.user + "' to '" + config.host + "' via '" + config.proxy + "'");
				}

				if (connect.message) {
					log.action("proxy-message", connect.message);
				}

				id = connect.id;
			}

			log.action("connected", "connected to '" + config.host + "' via '" + config.proxy + "'");
		},
		async exeinfo(path) {

		},
		async diskInfo(disk) {

		},
		async exists(path) {
			if (path == disk + "/.meta") {
				return true;
			}

			if (Path.diskOf(path) == disk) {
				return await request("exists", {
					path: realPath(path)
				});
			}
		},
		async canCreate(path) {
			return Path.diskOf(path) == disk;
		},
		async canDelete(path) {

		},
		async canRead(path) {
			return Path.diskOf(path) == disk;
		},
		async canResolve(path) {

		},
		async canWrite(path) {

		},
		async canLink(path, to) {

		},
		async times(path) {

		},
		async createFile(path, content, mime) {

		},
		async createBlobFile(path, blob) {

		},
		async createDirectory(path) {

		},
		async link(path, to, title, icon) {

		},
		async delete(path) {

		},
		async isDirectory(path) {
			if (path == disk) {
				return true;
			}

			return await request("is-dir", {
				path: realPath(path)
			});
		},
		async isFile(path) {
			return !public.isDirectory(path);
		},
		async isLink(path) {
			return false;
		},
		async list(path) {
			if (!path) {
				return [disk];
			}

			if (path.startsWith(disk)) {
				return (await request("list", {
					path: realPath(path)
				})).map(p => path + "/" + p);
			}

			return [];
		},
		async listAll(path) {
			if (!path) {
				return [disk];
			}

			return [];
		},
		async read(path) {
			if (path == disk + "/.meta") {
				return JSON.stringify({
					name: public.name
				});
			}

			return await fetch(await request("download", {
				path: realPath(path)
			})).then(r => r.text());
		},
		async readBlob(path) {

		},
		async readURI(path) {

		},
		async mime(path) {

		},
		async resolve(path) {

		},
		async write(path, content) {

		},
		async writeBlob(path, blob) {

		},
		async size(path) {

		}
	};

	if (!config.noCache) {
		for (let key in public) {
			const fx = public[key];

			if (typeof fx == "function") {
				if (fx.length == 1) {
					const cache = {};

					public[key] = path => {
						if (path in cache) {
							return cache[path];
						}

						return cache[path] = fx(path);
					};

					caches.push(cache);
				}
			}
		}
	}

	return public;
});
