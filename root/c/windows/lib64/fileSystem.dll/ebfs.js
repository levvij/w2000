/// Encrypted bucket file system storage provider
/// stores files in a remote bucket
/// C 2025 levvij

const log = globalConsole.createUnit("fs/ebfs");

function EBFS(config, fs) {
	let ray;
	let exeinfo;

	let key;
	let encryptionKey;

	const mounted = path => {
		for (let mount of config.mounts) {
			if (path.startsWith(mount)) {
				return true;
			}
		}

		return false;
	};

	const public = {
		name: config.name,
		free: 0,
		async reload() {
			key = localStorage.getItem(config.local.key);
			encryptionKey = localStorage.getItem(config.local.encrypt);

			if (key) {
				log.action('use', `bucket '${key}'`);
			} else {
				key = await (await fetch(`${config.root}/create`)).json();
				localStorage.setItem(config.local.key, key);

				const bytes = new Uint8Array(64);
				crypto.getRandomValues(bytes);
				encryptionKey = btoa(bytes);
				localStorage.setItem(config.local.encrypt, encryptionKey);

				log.action('create', `bucket '${key}'`);
			}

			// get server ray
			const lray = await (await fetch(`${config.root}/index/${key}`)).json();

			ray = {};
			exeinfo = {};

			// last item of ray is the total size of the remote files
			public.used = public.capacity = lray.reduce((a, c) => a + c.size, 0);

			for (let item of lray) {
				ray[item.name] = item;
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
			return config.mounts.filter(mount => !mount.includes('/'))
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
		canRead(path) {
			return path in ray;
		},
		async read(path) {
			return await fetch(`${config.root}/${key}/${encodeURIComponent(path)}`).then(r => r.text());
		},
		async readBlob(path) {
			return await fetch(`${config.root}/${key}/${encodeURIComponent(path)}`).then(r => r.blob());
		},
		readURI(path) {
			throw new Error('EBFS does not support direct URI loading.');
		},
		isDirectory(path) {
			return ray[path].mimeType === null;
		},
		isFile(path) {
			return ray[path].mimeType !== null;
		},
		isLink(path) {
			return false;
		},
		canResolve(path) {
			return path in ray;
		},
		resolve(path) {
			throw new Error('Cannot resolve link. EBFS does not support linking');
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
		async createDirectory(path) {
			await fetch(`${config.root}/directory/${key}/${encodeURIComponent(path)}`, {
				method: 'post'
			}).then(response => response.json());

			ray[path] = {
				name: path,
				type: 'd',
				ctime: +new Date(),
				mtime: +new Date()
			};
		},
		async createFile(path, content, mime) {
			await this.createBlobFile(
				path,
				new Blob([content], { type: mime })
			);
		},
		async createBlobFile(path, blob) {
			ray[path] = {
				name: path,
				type: 'f',
				ctime: +new Date(),
				mtime: +new Date(),
				mime: blob.type
			}

			public.writeBlob(path, blob);
		},
		async write(path, content) {
			const entry = ray[path];

			if (!entry || !entry.mimeType) {
				throw new Error(`File '${path}' does not exist. Call create first`);
			}

			await public.writeBlob(
				path,
				new Blob([content], { type: entry.mime })
			);
		},
		async writeBlob(path, blob) {
			await fetch(`${config.root}/file/${key}/${encodeURIComponent(path)}/${encodeURIComponent(blob.type)}`, {
				method: 'post',
				body: blob
			}).then(response => response.json());
		},
		canLink(path, to) {
			return false;
		},
		canCreate(path) {
			return mounted(path);
		},
		canWrite(path) {
			return mounted(path);
		},
		canDelete(path) {
			return mounted(path);
		},
		async delete(path) {
			await fetch(`${config.root}/${key}/${encodeURIComponent(path)}`, {
				method: 'delete'
			}).then(response => response.json());

			delete ray[path];
		},
		mime(path) {
			return ray[path].mimeType;
		},
		size(path) {
			return ray[path].size;
		}
	}

	return public;
}

NTFS.registerProvider("ebfs", EBFS);
