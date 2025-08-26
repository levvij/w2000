// postMessage based file system
// used for debugging and bridging

const log = globalConsole.createUnit("fs/pmpr");

function PMPR(config, fs) {
	const queue = {};
	let cache = {};

	switch (config.bridge) {
		case "wkwebview":
			{
				window.webkit.onmessage = event => {
					const data = JSON.parse(event);

					if (data[0] == config.key) {
						if (queue[data[1]]) {
							queue[data[1]](data[2]);

							delete queue[data[1]];
						} else {
							log.warn("recv", "queue has no item with id " + data[1].substr(0, 8) + "... (" + Object.keys(queue).map(v => v.substr(0, 8) + "...").join(", ") + ")");
						}
					}
				};

				break;
			}
		default:
			{
				window.addEventListener("message", event => {
					const data = JSON.parse(event.data);

					if (data[0] == config.key) {
						if (queue[data[1]]) {
							queue[data[1]](data[2]);

							delete queue[data[1]];
						}
					}
				});
			}
	}

	const request = (route, ...data) => {
		log.action("request", route, data);

		return new Promise(done => {
			let id = "";

			for (let i = 0; i < config.keyLength; i++) {
				id += Math.random().toString(config.keyDepth)[3];
			}

			queue[id] = res => {
				done(res);
			};

			const payload = [
				config.key,
				route,
				id,
				...data
			];

			switch (config.bridge) {
				case "wkwebview":
					{
						webkit.messageHandlers[config.bridgeKey].postMessage(JSON.stringify(payload));

						break;
					}
				default:
					{
						postMessage(JSON.stringify(payload));
					}
			}
		});
	};

	let ray;
	let exeinfo;

	const public = {
		name: config.name + " (" + config.bridge + "/" + config.bridgeKey + "/" + config.key + ")",
		async reload()  {
			await request("login", "0.0.0.0");

			cache = {};
			ray = {};

			exeinfo = {};

			const deleted = JSON.parse(localStorage[config.key] ||  "[]");

			for (let file of await request("ray")) {
				if (!deleted.includes(file.path)) {
					ray[file.path] = file;
				}
			}

			// load exeinfos
			for (let path in ray) {
				if ((path.endsWith(".exe") || path.endsWith(".dll")) && ray[path].type == "d") {
					if (ray[path + "/meta.json"] && ray[path + "/main.js"]) {
						exeinfo[path] = JSON.parse(await public.read(path + "/meta.json"));
					}
				}
			}
		},
		exeinfo(path) {
			return exeinfo[path];
		},
		times(path) {
			return {
				ctime: new Date(0),
				mtime: new Date(0)
			};
		},
		get disks() {
			const d = [];

			for (let key in ray) {
				if (!key.includes("/")) {
					d.push(key);
				}
			}

			return d;
		},
		diskInfo(disk) {
			if (public.disks.includes(disk)) {
				return {
					name: config.name,
					used: public.used,
					capacity: public.capacity,
					free: 0
				};
			}

			return {
				name: config.name,
				used: 0,
				capacity: 0,
				free: 0
			};
		},
		exists(path) {
			return path in ray;
		},
		async read(path) {
			if (!config.beta && cache[path]) {
				return cache[path];
			}

			return cache[path] = await request("read", path);
		},
		async readBlob(path) {
			return Blob([public.read(path)]);
		},
		async readURI(path) {
			return URL.createObjectURL(public.readBlob(path));
		},
		canRead(path) {
			return path in ray;
		},
		list(path) {
			const items = [];
			const layer = path.split("/").length + 1;

			for (let key in ray) {
				if (key.startsWith(path + "/") && key != path && key.split("/").length == layer) {
					items.push(key);
				}
			}
			
			log.action("ITEMS", items.join(", "), layer, path)

			return items;
		},
		listAll(path) {
			const items = [];

			for (let key in ray) {
				if (key.startsWith(path + "/") && key != path) {
					items.push(key);
				}
			}

			return items;
		},
		isDirectory(path) {
			return ray[path].type == "d";
		},
		isFile(path) {
			return ray[path].type == "f";
		},
		isLink(path) {
			return ray[path].link;
		},
		canResolve(path) {
			return path in ray && !!ray[path].link;
		},
		resolve(path) {
			const l = ray[path].link;

			return {
				path: l.path,
				title: l.title,
				icon: l.icon
			}
		},
		canLink(path, to) {
			return false;
		},
		canCreate(path) {
			return false;
		},
		canWrite(path) {
			return false;
		},
		canDelete(path) {
			return path in ray;
		},
		async delete(path) {
			if (await fs.isDirectory(path)) {
				for (let file of fs.list(path)) {
					await fs.delete(file);
				}
			}

			localStorage[config.key] = JSON.stringify([...JSON.parse(localStorage[config.key] ||  "[]"), path]);

			delete ray[path];
		},
		mime(path) {
			return ray[path].mime;
		},
		size(path) {
			return ray[path].size;
		}
	};

	return public;
}

NTFS.registerProvider("pmpr", PMPR);