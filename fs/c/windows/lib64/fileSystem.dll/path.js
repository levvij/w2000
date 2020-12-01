const Path = {
	...configuration.paths,
	async programData(path) {
		return configuration.paths.programData
			.replace("%a", (await fs.exeinfo(path)).author)
			.replace("%h", Cypp.hash.md5(path))
			.replace("%n", Path.name(path));
	},
	abs(path, base) {
		if (!path) {
			return base;
		}
		
		return Path.fix(base + "/" + path);
	},
	fix(path) {
		return path.split("/").filter(c => c).join("/");
	},
	name(path) {
		return Path.fix(path).split("/").pop();
	},
	ext(path) {
		return Path.name(path).split(".").slice(1).join(".");
	},
	nameWithoutExt(path) {
		return Path.name(path).split(".")[0];
	},
	parentPath(path) {
		return Path.fix(path).split("/").slice(0, -1).join("/");
	},
	async extInfo(ext) {
		return await fs.extinfo(ext);
	},
	async exeInfo(path) {
		return await fs.exeinfo(path);
	},
	createTempFileName() {
		return configuration.path.temp.replace("%i", Cypp.createId());
	},
	diskPreviewName(disk) {
		return disk.split(":")[0].split("/")[0];
	},
	async canEdit(file) {
		const extInfo = Path.extInfo(Path.ext(file));

		if (extInfo) {
			if (extInfo.editors) {
				return !!extInfo.editors.length;
			}
		}

		return true;
	},
	async getPrettyName(path)  {
		path = Path.fix(path);

		if (!path) {
			return configuration.name.computer;
		}

		if (await fs.isLink(path)) {
			const resolved = await fs.resolve(path);
			
			if (resolved) {
				if (resolved.title) {
					return resolved.title;
				}
				
				if (resolved.path) {
					return await Path.getPrettyName(resolved.path);
				}
			}
		}
		
		if (await fs.isExecuteable(path)) {
			const info = await fs.exeinfo(path);
			
			if (info.name) {
				return info.name;
			}
		}

		if (await fs.isDirectory(path) || await fs.isDisk(path)) {
			const meta = await fs.meta(path);

			if (meta && meta.name) {
				return meta.name;
			}
		}

		if (await fs.isDisk(path)) {
			return configuration.name.disk.replace("%d", path.toUpperCase());
		}

		return Path.getTitle(path);
	},
	async getTitle(path) {
		path = Path.fix(path);

		if (await fs.isLink(path)) {
			const l = await fs.resolve(path);

			if (l.title) {
				return l.title;
			}
		}

		return Path.nameWithoutExt(path);
	},
	async getDescription() {
		return "";
	},
	async nextName(path, name) {
		path = Path.fix(path);

		if (!await fs.exists(path + "/" + name)) {
			return Path.fix(path + "/" + name);
		}

		if (name.includes(".")) {
			// logic for files with ext
			let i = 1;
			while (await fs.exists(path + "/" + Path.nameWithoutExt(name) + " (" + i + ")." + Path.ext(name))) {
				i++;
			}

			return path + "/" + Path.nameWithoutExt(name) + " (" + i + ")." + Path.ext(name);
		} else {
			// logic for files without ext
			let i = 1;
			while (await fs.exists(path + "/" + name + " (" + i + ")")) {
				i++;
			}

			return path + "/" + name + " (" + i + ")";
		}
	},
	readableSize(bytes) {
		if (bytes < 1024) {
			return bytes + " B";
		}

		let u = -1;
		do {
			bytes /= 1024;
			u++;
		} while (Math.abs(bytes) >= 1024)

		return bytes.toFixed(1) + " " + configuration.sizes[u];
	},
	async getFileTypeName(file) {
		if (await fs.isDirectory(file)) {
			return configuration.names.directory;
		}

		if (await fs.isDisk(file)) {
			return configuration.names.disk;
		}

		if (Path.ext(file) == "exe") {
			return configuration.names.program;
		}

		if (Path.ext(file) == "dll") {
			return configuration.names.library;
		}

		const info = fs.extinfo(Path.ext(file));

		console.log("FILETYPEINFO", info);

		if (info && info.name) {
			return info.name;
		}

		return configuration.names.file;
	},
	diskOf(path) {
		return Path.fix(path).split("/")[0];
	},
	fixExt(path) {
		if (path.includes(".")) {
			return Path.nameWithoutExt(path) + "." + Path.ext(path).toLowerCase();
		}
			
		return path;
	}
};

DLL.export("Path", Path);