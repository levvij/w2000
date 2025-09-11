/// Storage Zone Remote
/// C 2019 levvij

const log = globalConsole.createUnit("fs/stzr");

function STZR(config, fs) {
	let container = localStorage[config.key];
	let list = {};
	let exeinfos = {};

	const request = async(url, data) => {
		const body = new FormData();

		for (let key in data) {
			body.append(key, data[key]);
		}

		return await (await fetch(url, {
			method: "post",
			body
		})).json();
	};

	const url = path => config.root.replace("%c", container).replace("%p", list[path].path)

	const public = {
		name: config.name,
		capacity: 1e8,
		disks: ["c", "d"],
		get free() {
			return public.capacity - public.used;
		},
		async reload() {
			list = {};
			exeinfos = {};

			if (!container) {
				container = localStorage[config.key] = await request(config.api.create, {
					secret: Array(128).fill().map(() => Math.random().toString(36).substr(2)).join("")
				});

				for (let disk of public.disks) {
					await public.createDirectory(disk);
				}
			}

			const meta = await request(config.api.meta, {
				container
			});

			public.used = meta.size;

			for (let file of meta.files || []) {
				list[file.name] = file;
			}

			// load exeinfos
			for (let path in list) {
				if ((path.endsWith(".exe") || path.endsWith(".dll")) && list[path].type == "d") {
					if (list[path + "/meta.json"] && list[path + "/main.js"]) {
						exeinfos[path] = JSON.parse(await public.read(path + "/meta.json"));
					}
				}
			}
		},
		exeinfo(path) {
			return exeinfos[path];
		},
		diskInfo(disk) {
			let size = 0;

			for (let path in list) {
				if (Path.diskOf(path) == disk && list[path].size) {
					size += list[path].size;
				}
			}

			return {
				name: config.name,
				used: size,
				capacity: public.capacity - public.used + size,
				free: public.capacity - public.used
			}
		},
		exists(path) {
			return path in list;
		},
		canCreate(path) {
			return true;
		},
		canDelete(path) {
			return path in list;
		},
		canRead(path) {
			return path in list;
		},
		canResolve(path) {
			return path in list && !!list[path].link;
		},
		canWrite(path) {
			return true;
		},
		canLink(path, to) {
			return true;
		},
		times(path) {
			return {
				ctime: new Date(list[path].date * 1000),
				mtime: new Date(list[path].date * 1000)
			};
		},
		async createFile(path, content, mime) {
			const res = await request(config.api.write, {
				container,
				path,
				file: new Blob([content], {
					type: mime
				}),
				mime
			});

			if (res) {
				list[path] = res;
			} else {
				throw new Error("Cannot write '" + path + "'");
			}
		},
		async createBlobFile(path, blob) {
			const res = await request(config.api.write, {
				container,
				path,
				file: blob,
				mime: blob.type
			});

			if (res) {
				list[path] = res;
			} else {
				throw new Error("Cannot write blob '" + path + "'");
			}
		},
		async createDirectory(path) {
			const res = await request(config.api.mkdir, {
				container,
				path
			});

			if (res) {
				list[path] = res;
			} else {
				throw new Error("Cannot create directory '" + path + "'");
			}
		},
		async link(path, to, title, icon) {
			const res = await request(config.api.link, {
				container,
				path,
				link: to,
				title,
				icon
			});

			if (res) {
				list[path] = res;
			} else {
				throw new Error("Cannot link '" + path + "'");
			}
		},
		async delete(path) {
			if (await fs.isDirectory(path)) {
				for (let file of await fs.list(path)) {
					await fs.delete(file);
				}
			}

			await request(config.api.delete, {
				container,
				path
			});

			delete list[path];
		},
		meta(path) {
			return list[path].meta;
		},
		isDirectory(path) {
			return list[path].type == "d";
		},
		isFile(path) {
			return list[path].type == "f" || list[path].type == "l";
		},
		isLink(path) {
			return list[path].type == "l";
		},
		list(path) {
			const res = [];
			const layer = path.split("/").length + 1;

			for (let key in list) {
				if (key.startsWith(path + "/") && key != path && key.split("/").length == layer) {
					res.push(key);
				}
			}

			return res;
		},
		listAll(path) {
			const res = [];

			for (let key in list) {
				if (key.startsWith(path + "/") && key != path) {
					res.push(key);
				}
			}

			return res;
		},
		async read(path) {
			return await (fetch(url(path)).then(r => r.text()));
		},
		async readBlob(path) {
			return await (fetch(url(path)).then(r => r.blob()));
		},
		async readURI(path) {
			return url(path);
		},
		mime(path) {
			return list[path].mime;
		},
		resolve(path) {
			const l = list[path].link;

			return {
				path: l.path,
				title: l.title,
				icon: l.icon
			};
		},
		async write(path, content) {
			return public.createFile(path, content, await fs.mime(path));
		},
		async writeBlob(path, blob) {
			return public.createBlobFile(path, blob, await fs.mime(path));
		},
		size(path) {
			return list[path].size;
		}
	};

	return public;
}

NTFS.registerProvider("stzr", STZR);
