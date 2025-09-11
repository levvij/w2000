/// Remote Read Only storage provider
/// C 2019 levvij

const log = globalConsole.createUnit("fs/rrsp");

function RRSP(config, fs) {
	let ray;
	let links;
	let exeinfo;
	let cache;
	let blobCache;

	const public = {
		name: config.name,
		free: 0,
		async reload() {
			// get server ray
			const lray = await (await fetch(config.ray)).json();
			links = {};
			cache = {};
			blobCache = {};
			ray = {};
			exeinfo = {};

			// last item of ray is the total size of the remote files
			public.used = public.capacity = lray.reduce((a, c) => a + c.size, 0);

			for (let item of lray) {
				ray[item.name] = item;
			}

			// init localStorage delete list
			if (!localStorage[config.deleteList]) {
				localStorage[config.deleteList] = "[]";
			}

			// load exeinfos
			for (let path in ray) {
				if ((path.endsWith(".exe") || path.endsWith(".dll")) && ray[path].type == "d") {
					if (ray[path + "/meta.json"] && ray[path + "/main.js"]) {
						try {
							exeinfo[path] = JSON.parse(await public.read(path + "/meta.json"));
						} catch (e) {
							throw new Error("Could not parse meta.json of '" + path + "'");
						}
					}
				}
			}
		},
		exeinfo(path) {
			return exeinfo[path];
		},
		meta(path) {
			return ray[path].meta;
		},
		times(path) {
			return {
				ctime: new Date(ray[path].ctime),
				mtime: new Date(ray[path].mtime)
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
			console.log(public, this)

			return path in ray;
		},
		canRead(path) {
			return path in ray;
		},
		async read(path) {
			if (!config.beta && cache[path]) {
				return cache[path];
			}

			return cache[path] = await fetch(ray[path].source + global.config.cacheArgs).then(r => r.text());
		},
		async readBlob(path) {
			if (!config.beta && blobCache[path]) {
				return blobCache[path];
			}

			return blobCache[path] = await fetch(ray[path].source + global.config.cacheArgs).then(r => r.blob());
		},
		readURI(path) {
			return ray[path].source;
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
		list(path) {
			const items = [];
			const layer = path.split("/").length + 1;

			for (let key in ray) {
				if (key.startsWith(path + "/") && key != path && key.split("/").length == layer) {
					items.push(key);
				}
			}

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
			return false;
		},
		async delete(path) {
			throw new Error('cannot delete files in read only file system');
		},
		mime(path) {
			return ray[path].mime;
		},
		size(path) {
			return ray[path].size;
		}
	}

	return public;
}

NTFS.registerProvider("rrsp", RRSP);
