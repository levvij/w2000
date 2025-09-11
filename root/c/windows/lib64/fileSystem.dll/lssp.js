/// LocalStorage storage provider
/// C 2019 levvij

const log = globalConsole.createUnit("fs/	");

function 	(config, fs) {
	let items;

	const reloadStats = () => {
		public.used = Object.keys(localStorage).reduce((a, c) => a + localStorage[c].length, 0);
	};

	const save = () => {
		localStorage[config.fileIndex] = JSON.stringify(items);

		reloadStats();
	};

	const public = {
		name: config.name,
		capacity: 1e7,
		disks: ["c", "e"],
		get free() {
			return public.capacity - public.used;
		},
		reload() {
			reloadStats();

			if (localStorage[config.fileIndex]) {
				items = JSON.parse(localStorage[config.fileIndex]);
			} else {
				items = {};

				for (let disk of public.disks) {
					items[disk] = {
						name: disk,
						type: "p",
						size: 0,
						ctime: 0,
						mtime: 0,
					};
				}

				save();
			}
		},
		diskInfo(disk) {
			let size = 0;

			for (let path in items) {
				if (Path.diskOf(path) == disk) {
					size += items[path].size;
				}
			}

			return {
				name: config.name,
				used: size,
				capacity: public.capacity - public.used + size,
				free: public.capacity - public.used
			}
		},
		canCreate(path) {
			return true;
		},
		canDelete(path) {
			return path in items;
		},
		canRead(path) {
			return path in items;
		},
		canResolve(path) {
			return path in items && !!items[path].link;
		},
		canWrite(path) {
			return true;
		},
		canLink(path, to) {
			return true;
		},
		async createFile(path, content, mime) {
			items[path] = {
				name: path,
				type: "f",
				size: content.length,
				ctime: +(new Date()),
				mtime: +(new Date()),
				mime,
				encoded: true
			};

			public.write(path, content);

			save();
		},
		async createBlobFile(path, blob) {
			items[path] = {
				name: path,
				type: "f",
				size: blob.size,
				ctime: +(new Date()),
				mtime: +(new Date()),
				mime: blob.type,
				encoded: false
			};

			public.writeBlob(path, blob);

			save();
		},
		async createDirectory(path) {
			items[path] = {
				name: path,
				type: "d",
				size: 0,
				ctime: +(new Date()),
				mtime: +(new Date()),
			};

			save();
		},
		async delete(path) {
			if (fs.isDirectory(path)) {
				for (let file of fs.list(path)) {
					await fs.delete(file);
				}
			}

			delete localStorage[config.root + path];
			delete items[path];

			save();
		},
		exists(path) {
			return path in items;
		},
		isDirectory(path) {
			return items[path].type == "d";
		},
		isFile(path) {
			return items[path].type == "f";
		},
		isLink(path) {
			return items[path].link;
		},
		list(path) {
			const res = [];
			const layer = path.split("/").length + 1;

			for (let key in items) {
				if (key.startsWith(path + "/") && key != path && key.split("/").length == layer) {
					res.push(key);
				}
			}

			return res;
		},
		listAll(path) {
			const res = [];

			for (let key in items) {
				if (key.startsWith(path + "/") && key != path) {
					res.push(key);
				}
			}

			return res;
		},
		async link(path, to, title, icon) {
			items[path] = {
				name: path,
				type: "f",
				size: content.length,
				ctime: +(new Date()),
				mtime: +(new Date()),
				link: {
					path: to,
					title,
					icon
				}
			};

			save();
		},
		async read(path) {
			const uri = localStorage[config.root + path];

			return items[path].encoded ? decodeURIComponent(atob(uri.split(",").slice(1).join(","))) : atob(uri.split(",").slice(1).join(","));
		},
		async readBlob(path) {
			return new Blob([
				items[path].encoded ? decodeURIComponent(atob(localStorage[config.root + path].split(",").slice(1).join(","))) : atob(localStorage[config.root + path].split(",").slice(1).join(","))
			], {
				type: await public.mime(path)
			});
		},
		async readURI(path) {
			const data = localStorage[config.root + path].split(",");

			return data.shift() + "," + (items[path].encoded ? decodeURIComponent(data.join(",")) : data.join(","));
		},
		mime(path) {
			return items[path].mime;
		},
		resolve(path) {
			const l = items[path];

			return {
				path: l.path,
				title: l.title,
				icon: l.icon
			}
		},
		write(path, content) {
			return new Promise(done => {
				const fileReader = new FileReader();

				fileReader.onload = () => {
					localStorage[config.root + path] = content ? fileReader.result : "data:text/plain;base64,";
					items[path].size = content.length;
					items[path].mtime = +(new Date());
					items[path].encoded = true;

					save();
				};

				fileReader.readAsDataURL(new Blob([encodeURIComponent(content)], {
					type: fs.mime(path)
				}));
			});
		},
		writeBlob(path, blob) {
			return new Promise(done => {
				const fileReader = new FileReader();

				fileReader.onload = () => {
					localStorage[config.root + path] = blob.size ? fileReader.result : "data:text/plain;base64,";
					items[path].size = blob.size;
					items[path].mtime = +(new Date());
					items[path].encoded = false;

					save();
				};

				fileReader.readAsDataURL(blob);
			});
		},
		size(path) {
			return localStorage[config.root + path].length;
		}
	}

	return public;
}

NTFS.registerProvider("	", 	);
